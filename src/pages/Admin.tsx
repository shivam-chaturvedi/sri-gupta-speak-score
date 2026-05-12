import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

type TopicRow = {
  id: string;
  topic: string;
  description: string | null;
  theme: string;
  type: "opinion" | "stance" | string;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
};

const THEMES = ["Ethics", "Politics", "Education", "Technology", "Abstract", "Pop Culture"];

export default function Admin() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [topics, setTopics] = useState<TopicRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [isRoleLoading, setIsRoleLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [newTopic, setNewTopic] = useState({
    topic: "",
    description: "",
    theme: "Ethics",
    type: "stance" as "stance" | "opinion",
    is_featured: false,
  });
  
  useEffect(() => {
    const checkRole = async () => {
      if (!user) {
        setIsAdmin(false);
        setIsRoleLoading(false);
        return;
      }

      setIsRoleLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.warn("Failed to check role:", error.message);
        setIsAdmin(false);
        setIsRoleLoading(false);
        return;
      }

      setIsAdmin((data as any)?.role === "admin");
      setIsRoleLoading(false);
    };

    checkRole();
  }, [user]);

  const loadTopics = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("topics")
      .select("*")
      .order("is_featured", { ascending: false })
      .order("updated_at", { ascending: false });

    if (error) {
      toast({ title: "Failed to load topics", description: error.message, variant: "destructive" });
      setIsLoading(false);
      return;
    }

    setTopics((data || []) as TopicRow[]);
    setIsLoading(false);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return topics;
    return topics.filter((t) => {
      return (
        t.topic.toLowerCase().includes(q) ||
        (t.description || "").toLowerCase().includes(q) ||
        t.theme.toLowerCase().includes(q)
      );
    });
  }, [topics, query]);

  useEffect(() => {
    if (isAdmin) loadTopics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  if (isRoleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Admin access</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground">You must be logged in to access the admin panel.</p>
            <Button asChild className="w-full">
              <Link to="/login">Go to Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Access denied</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground">Your account does not have admin access.</p>
            <Button asChild variant="outline" className="w-full">
              <Link to="/">Back to Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const createTopic = async () => {
    if (!newTopic.topic.trim()) {
      toast({ title: "Topic is required", variant: "destructive" });
      return;
    }
    if (!newTopic.theme.trim()) {
      toast({ title: "Theme is required", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from("topics").insert({
      topic: newTopic.topic.trim(),
      description: newTopic.description.trim() || null,
      theme: newTopic.theme.trim(),
      type: newTopic.type,
      is_featured: newTopic.is_featured,
    });

    if (error) {
      toast({ title: "Failed to create topic", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Topic created" });
    setNewTopic({ topic: "", description: "", theme: newTopic.theme, type: newTopic.type, is_featured: false });
    loadTopics();
  };

  const updateTopic = async (id: string, patch: Partial<TopicRow>) => {
    const { error } = await supabase.from("topics").update(patch).eq("id", id);
    if (error) {
      toast({ title: "Failed to update topic", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Topic updated" });
    loadTopics();
  };

  const deleteTopic = async (id: string) => {
    const { error } = await supabase.from("topics").delete().eq("id", id);
    if (error) {
      toast({ title: "Failed to delete topic", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Topic deleted" });
    loadTopics();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-4 py-10 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin</h1>
            <p className="text-muted-foreground">Add, update, delete, and feature challenge topics.</p>
          </div>
          <Button variant="outline" onClick={loadTopics} disabled={isLoading}>
            {isLoading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create topic</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Topic</label>
              <Input
                value={newTopic.topic}
                onChange={(e) => setNewTopic((p) => ({ ...p, topic: e.target.value }))}
                placeholder="e.g., Is it ethical to eat meat in modern society?"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Theme</label>
              <Input
                list="admin-theme-list"
                value={newTopic.theme}
                onChange={(e) => setNewTopic((p) => ({ ...p, theme: e.target.value }))}
                placeholder="e.g., Ethics"
              />
              <datalist id="admin-theme-list">
                {THEMES.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-foreground">Description</label>
              <Textarea
                value={newTopic.description}
                onChange={(e) => setNewTopic((p) => ({ ...p, description: e.target.value }))}
                placeholder="Short prompt guidance (optional)"
              />
            </div>

            <div className="flex items-center gap-6 md:col-span-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={newTopic.type === "stance"}
                  onCheckedChange={(v) => setNewTopic((p) => ({ ...p, type: v ? "stance" : "opinion" }))}
                  id="topic-type-stance"
                />
                <label htmlFor="topic-type-stance" className="text-sm text-foreground">
                  Stance topic (For/Against/Neutral)
                </label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  checked={newTopic.is_featured}
                  onCheckedChange={(v) => setNewTopic((p) => ({ ...p, is_featured: !!v }))}
                  id="topic-featured"
                />
                <label htmlFor="topic-featured" className="text-sm text-foreground">
                  Featured
                </label>
              </div>
            </div>

            <div className="md:col-span-2">
              <Button onClick={createTopic} className="w-full">
                Add topic
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <CardTitle>Topics ({filtered.length})</CardTitle>
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search topic/theme/description…"
                className="max-w-sm"
              />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Featured</TableHead>
                  <TableHead>Theme</TableHead>
                  <TableHead>Topic</TableHead>
                  <TableHead className="hidden md:table-cell">Type</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((t) => (
                  <TopicRowItem
                    key={t.id}
                    topic={t}
                    onUpdate={updateTopic}
                    onDelete={deleteTopic}
                  />
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground">
                      No topics found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function TopicRowItem({
  topic,
  onUpdate,
  onDelete,
}: {
  topic: TopicRow;
  onUpdate: (id: string, patch: Partial<TopicRow>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [draft, setDraft] = useState({
    topic: topic.topic,
    description: topic.description || "",
    theme: topic.theme,
    type: (topic.type === "opinion" ? "opinion" : "stance") as "stance" | "opinion",
    is_featured: topic.is_featured,
  });

  useEffect(() => {
    setDraft({
      topic: topic.topic,
      description: topic.description || "",
      theme: topic.theme,
      type: (topic.type === "opinion" ? "opinion" : "stance") as "stance" | "opinion",
      is_featured: topic.is_featured,
    });
  }, [topic.id, topic.topic, topic.description, topic.theme, topic.type, topic.is_featured]);

  return (
    <TableRow>
      <TableCell>
        <Checkbox
          checked={topic.is_featured}
          onCheckedChange={(v) => onUpdate(topic.id, { is_featured: !!v })}
          aria-label="Toggle featured"
        />
      </TableCell>
      <TableCell className="font-medium">{topic.theme}</TableCell>
      <TableCell className="max-w-[520px]">
        <div className="font-medium text-foreground">{topic.topic}</div>
        {topic.description && <div className="text-sm text-muted-foreground mt-1">{topic.description}</div>}
      </TableCell>
      <TableCell className="hidden md:table-cell">{topic.type}</TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                Edit
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit topic</DialogTitle>
              </DialogHeader>

              <div className="grid gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Topic</label>
                  <Input value={draft.topic} onChange={(e) => setDraft((p) => ({ ...p, topic: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Theme</label>
                  <Input value={draft.theme} onChange={(e) => setDraft((p) => ({ ...p, theme: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Description</label>
                  <Textarea
                    value={draft.description}
                    onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))}
                  />
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={draft.type === "stance"}
                      onCheckedChange={(v) => setDraft((p) => ({ ...p, type: v ? "stance" : "opinion" }))}
                      id={`edit-type-${topic.id}`}
                    />
                    <label htmlFor={`edit-type-${topic.id}`} className="text-sm text-foreground">
                      Stance topic
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={draft.is_featured}
                      onCheckedChange={(v) => setDraft((p) => ({ ...p, is_featured: !!v }))}
                      id={`edit-featured-${topic.id}`}
                    />
                    <label htmlFor={`edit-featured-${topic.id}`} className="text-sm text-foreground">
                      Featured
                    </label>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  onClick={() =>
                    onUpdate(topic.id, {
                      topic: draft.topic.trim(),
                      theme: draft.theme.trim(),
                      description: draft.description.trim() || null,
                      type: draft.type,
                      is_featured: draft.is_featured,
                    })
                  }
                >
                  Save
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button variant="destructive" size="sm" onClick={() => onDelete(topic.id)}>
            Delete
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
