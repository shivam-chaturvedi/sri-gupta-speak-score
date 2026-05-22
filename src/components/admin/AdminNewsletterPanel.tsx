import { useEffect, useMemo, useState } from "react";
import { Mail, Send, Users, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  NewsletterRichTextEditor,
  isHtmlContentEmpty,
} from "@/components/admin/NewsletterRichTextEditor";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { NEWSLETTER_CATEGORIES } from "@/components/NewsletterSubscribeBlock";
import { useLocalStorageState } from "@/hooks/useLocalStorageState";

const NEWSLETTER_DRAFT_KEY = "dialecta-admin-newsletter-draft";

type NewsletterDraft = {
  filterTopics: string[];
  subject: string;
  content: string;
};

const emptyDraft = (): NewsletterDraft => ({
  filterTopics: [],
  subject: "",
  content: "",
});

function parseDraft(raw: string): NewsletterDraft {
  try {
    const parsed = JSON.parse(raw) as Partial<NewsletterDraft>;
    return {
      filterTopics: Array.isArray(parsed.filterTopics)
        ? parsed.filterTopics.filter((t) => typeof t === "string")
        : [],
      subject: typeof parsed.subject === "string" ? parsed.subject : "",
      content: typeof parsed.content === "string" ? parsed.content : "",
    };
  } catch {
    return emptyDraft();
  }
}

type SubscriptionRow = {
  id: string;
  user_id: string | null;
  email: string;
  topics: string[];
  created_at: string;
  updated_at: string;
};

const topicLabel = (id: string) =>
  NEWSLETTER_CATEGORIES.find((c) => c.id === id)?.label ?? id;

export function AdminNewsletterPanel() {
  const { toast } = useToast();
  const [subscribers, setSubscribers] = useState<SubscriptionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const [draft, setDraft] = useLocalStorageState<NewsletterDraft>(
    NEWSLETTER_DRAFT_KEY,
    emptyDraft(),
    JSON.stringify,
    parseDraft,
  );

  const filterTopics = useMemo(
    () => new Set(draft.filterTopics),
    [draft.filterTopics],
  );

  const setFilterTopics = (updater: Set<string> | ((prev: Set<string>) => Set<string>)) => {
    setDraft((prev) => {
      const prevSet = new Set(prev.filterTopics);
      const nextSet =
        typeof updater === "function" ? updater(prevSet) : updater;
      return { ...prev, filterTopics: Array.from(nextSet) };
    });
  };

  const setSubject = (subject: string) =>
    setDraft((prev) => ({ ...prev, subject }));

  const setContent = (content: string) =>
    setDraft((prev) => ({ ...prev, content }));

  const { subject, content } = draft;

  const loadSubscribers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("newsletter_subscriptions")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      toast({
        title: "Failed to load subscribers",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    setSubscribers((data || []) as SubscriptionRow[]);
    setLoading(false);
  };

  useEffect(() => {
    loadSubscribers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const matchingRows = useMemo(() => {
    if (filterTopics.size === 0) return [];
    return subscribers.filter((row) =>
      row.topics?.some((t) => filterTopics.has(t)),
    );
  }, [subscribers, filterTopics]);

  const recipientEmails = useMemo(() => {
    const seen = new Set<string>();
    for (const row of matchingRows) {
      const e = row.email?.trim().toLowerCase();
      if (e) seen.add(e);
    }
    return Array.from(seen);
  }, [matchingRows]);

  const toggleFilterTopic = (id: string) => {
    setFilterTopics((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAllTopics = () => {
    setFilterTopics(new Set(NEWSLETTER_CATEGORIES.map((c) => c.id)));
  };

  const clearTopicFilters = () => setFilterTopics(new Set());

  const sendNewsletter = async () => {
    if (!subject.trim()) {
      toast({ title: "Subject is required", variant: "destructive" });
      return;
    }
    if (isHtmlContentEmpty(content)) {
      toast({ title: "Email body is required", variant: "destructive" });
      return;
    }
    if (recipientEmails.length === 0) {
      toast({
        title: "No recipients",
        description: "Select at least one topic to choose who receives this email.",
        variant: "destructive",
      });
      return;
    }

    const confirmed = window.confirm(
      `Send "${subject.trim()}" to ${recipientEmails.length} subscriber(s)?`,
    );
    if (!confirmed) return;

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-newsletter", {
        body: {
          emails: recipientEmails,
          subject: subject.trim(),
          content,
          html: true,
        },
      });

      const result = (data ?? {}) as {
        success?: boolean;
        message?: string;
        sent?: number;
        failed?: string[];
        error?: string;
      };

      if (error) {
        const detail =
          result.error ??
          (error instanceof Error ? error.message : "Edge function request failed");
        throw new Error(detail);
      }

      if (result?.error) throw new Error(result.error);

      toast({
        title: result?.success ? "Newsletter sent" : "Partially sent",
        description:
          result?.message ??
          `Sent to ${result?.sent ?? recipientEmails.length} recipients`,
      });

      if (result?.failed?.length) {
        console.warn("Failed recipients:", result.failed);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to send newsletter";
      toast({
        title: "Send failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Newsletter
          </h2>
          <p className="text-sm text-muted-foreground">
            View subscribers and send bulk emails by topic.
          </p>
        </div>
        <Button variant="outline" onClick={loadSubscribers} disabled={loading}>
          {loading ? "Loading…" : "Refresh"}
        </Button>
      </div>

      {/* Send composer */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="w-4 h-4" />
            Send newsletter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">
              Filter recipients by topic
            </p>
            <p className="text-xs text-muted-foreground">
              Select at least one topic to choose recipients. Users subscribed to any selected
              topic are included (deduplicated by email). Nothing is selected until you pick a topic.
            </p>
            <div className="flex flex-wrap gap-2">
              {NEWSLETTER_CATEGORIES.map(({ id, label }) => {
                const active = filterTopics.has(id);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggleFilterTopic(id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      active
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={selectAllTopics}>
                Select all topics
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={clearTopicFilters}>
                Clear selection
              </Button>
            </div>
            <div
              className={`flex items-center gap-2 p-3 rounded-lg border ${
                filterTopics.size === 0
                  ? "bg-muted/50 border-border"
                  : "bg-primary/10 border-primary/20"
              }`}
            >
              <Users className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">
                {filterTopics.size === 0
                  ? "0 recipients selected — choose at least one topic"
                  : `${recipientEmails.length} recipient${recipientEmails.length !== 1 ? "s" : ""} selected`}
              </span>
              {filterTopics.size > 0 && matchingRows.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  ({matchingRows.length} subscription row{matchingRows.length !== 1 ? "s" : ""})
                </span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Subject</label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g., This week in Geopolitics — Dialecta Daily"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Email body</label>
            <p className="text-xs text-muted-foreground">
              Format text with bold, colors, lists, and links — styling is included in the email.
            </p>
            <NewsletterRichTextEditor value={content} onChange={setContent} />
          </div>

          <Button
            onClick={sendNewsletter}
            disabled={sending || recipientEmails.length === 0}
            className="w-full sm:w-auto"
          >
            {sending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send to {recipientEmails.length} subscriber{recipientEmails.length !== 1 ? "s" : ""}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Subscribers table */}
      <Card>
        <CardHeader>
          <CardTitle>
            All subscribers ({subscribers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Topics</TableHead>
                <TableHead className="hidden md:table-cell">Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscribers.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.email}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(row.topics || []).map((t) => (
                        <Badge key={t} variant="secondary" className="text-xs">
                          {topicLabel(t)}
                        </Badge>
                      ))}
                      {(!row.topics || row.topics.length === 0) && (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                    {new Date(row.updated_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
              {subscribers.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={3} className="text-muted-foreground">
                    No subscribers yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
