import { useState } from "react";
import {
  Globe,
  TrendingUp,
  Briefcase,
  Landmark,
  Cpu,
  ScrollText,
  MessageSquare,
  Newspaper,
  Mail,
  Sparkles,
  CheckCircle2,
  Bell,
  Brain,
  Filter,
  Send,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const CATEGORIES = [
  { id: "geopolitics", label: "Geopolitics", icon: Globe, color: "from-blue-500 to-indigo-600" },
  { id: "economics", label: "Economics", icon: TrendingUp, color: "from-emerald-500 to-teal-600" },
  { id: "business", label: "Business", icon: Briefcase, color: "from-amber-500 to-orange-600" },
  { id: "international", label: "International Relations", icon: Landmark, color: "from-rose-500 to-pink-600" },
  { id: "technology", label: "Technology", icon: Cpu, color: "from-violet-500 to-purple-600" },
  { id: "policy", label: "Policy", icon: ScrollText, color: "from-cyan-500 to-sky-600" },
  { id: "debate", label: "Debate Topics", icon: MessageSquare, color: "from-fuchsia-500 to-pink-600" },
  { id: "current", label: "Current Affairs", icon: Newspaper, color: "from-lime-500 to-green-600" },
];

const AI_FEATURES = [
  {
    icon: Brain,
    title: "AI-Generated Summaries",
    description: "Every article distilled into a crisp 3-sentence brief so you stay informed in minutes, not hours.",
  },
  {
    icon: Filter,
    title: "Personalized Curation",
    description: "Only the stories that match your selected topics land in your inbox — zero noise.",
  },
  {
    icon: Bell,
    title: "Daily & Weekly Cadence",
    description: "Choose your frequency. Morning briefings or weekly deep-dives — your call.",
  },
  {
    icon: Sparkles,
    title: "Debate-Ready Insights",
    description: "Each story comes tagged with debate angles, helping you form arguments instantly.",
  },
];

type SubmitState = "idle" | "loading" | "success";

export function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [error, setError] = useState("");

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (selectedCategories.size === 0) {
      setError("Please select at least one category.");
      return;
    }

    setSubmitState("loading");
    // Simulate API call — replace with real endpoint later
    await new Promise((r) => setTimeout(r, 1200));
    setSubmitState("success");
  };

  return (
    <section className="w-full bg-gradient-hero py-20 px-4">
      <div className="max-w-5xl mx-auto space-y-14">

        {/* ── Header ── */}
        <div className="text-center text-white space-y-4">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
            <Mail className="w-4 h-4" />
            <span className="text-sm font-medium">Personalized AI Newsletter</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold leading-tight">
            Stay Brief, Stay Sharp
          </h2>
          <p className="text-lg opacity-85 max-w-2xl mx-auto">
            Get AI-curated news briefings tailored to your debate interests — delivered straight to your inbox.
          </p>
        </div>

        {/* ── How the newsletter works (numbered steps) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { n: "1", icon: Filter, label: "Pick your topics", sub: "Choose from 8 categories below" },
            { n: "2", icon: Newspaper, label: "We collect the news", sub: "From verified, trusted sources" },
            { n: "3", icon: Brain, label: "AI summarises it", sub: "Concise, debate-ready briefs" },
            { n: "4", icon: Send, label: "Lands in your inbox", sub: "Daily or weekly — your choice" },
          ].map(({ n, icon: Icon, label, sub }) => (
            <div
              key={n}
              className="flex flex-col items-center text-center p-5 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-white/15 transition-all"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-sm mb-3">
                {n}
              </div>
              <Icon className="w-7 h-7 text-white mb-2" />
              <span className="text-sm font-semibold text-white">{label}</span>
              <span className="text-xs text-white/65 mt-1">{sub}</span>
            </div>
          ))}
        </div>

        {/* ── AI Feature cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {AI_FEATURES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="flex items-start gap-4 p-5 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-white/15 transition-all"
            >
              <div className="w-10 h-10 flex-shrink-0 rounded-lg bg-white/20 flex items-center justify-center">
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white mb-1">{title}</h4>
                <p className="text-xs text-white/70 leading-relaxed">{description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Category picker ── */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6 space-y-4">
          <div className="text-white">
            <h3 className="text-lg font-semibold mb-1">Choose Your Categories</h3>
            <p className="text-sm text-white/70">
              Select the topics you care about.{" "}
              {selectedCategories.size > 0 && (
                <span className="text-white font-medium">
                  {selectedCategories.size} selected
                </span>
              )}
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {CATEGORIES.map(({ id, label, icon: Icon, color }) => {
              const active = selectedCategories.has(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleCategory(id)}
                  className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border transition-all text-white text-sm font-medium
                    ${active
                      ? "bg-white/25 border-white/60 shadow-lg scale-[1.02]"
                      : "bg-white/5 border-white/15 hover:bg-white/15"
                    }`}
                >
                  <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center shadow`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-center leading-tight text-xs">{label}</span>
                  {active && (
                    <CheckCircle2 className="absolute top-2 right-2 w-4 h-4 text-white" />
                  )}
                </button>
              );
            })}
          </div>
          {selectedCategories.size > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {Array.from(selectedCategories).map((id) => {
                const cat = CATEGORIES.find((c) => c.id === id)!;
                return (
                  <Badge
                    key={id}
                    className="bg-white/20 text-white border-white/30 text-xs gap-1 cursor-pointer hover:bg-white/30"
                    onClick={() => toggleCategory(id)}
                  >
                    {cat.label} ×
                  </Badge>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Subscribe form ── */}
        <div className="max-w-xl mx-auto space-y-4">
          {submitState === "success" ? (
            <div className="flex flex-col items-center gap-4 text-white text-center py-8">
              <div className="w-16 h-16 rounded-full bg-emerald-500/30 border border-emerald-400/50 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-300" />
              </div>
              <h3 className="text-2xl font-bold">You're subscribed!</h3>
              <p className="text-white/75 text-sm">
                Your first personalised briefing is on its way. Check your inbox — and your spam folder, just in case.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {Array.from(selectedCategories).map((id) => {
                  const cat = CATEGORIES.find((c) => c.id === id)!;
                  return (
                    <Badge key={id} className="bg-white/20 text-white border-white/30 text-xs">
                      {cat.label}
                    </Badge>
                  );
                })}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-white/15 border-white/30 text-white placeholder:text-white/50 focus:ring-white/40 focus:border-white/60 h-12"
                    disabled={submitState === "loading"}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={submitState === "loading"}
                  className="h-12 px-6 bg-white text-primary hover:bg-white/90 font-semibold flex items-center gap-2 whitespace-nowrap"
                >
                  {submitState === "loading" ? (
                    <>
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      Subscribing…
                    </>
                  ) : (
                    <>
                      Subscribe Free
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
              {error && (
                <p className="text-rose-300 text-sm text-center">{error}</p>
              )}
              <p className="text-center text-white/55 text-xs">
                No spam. Unsubscribe anytime. Built on trusted, curated sources.
              </p>
            </form>
          )}
        </div>

        {/* ── Source trust badge row ── */}
        <div className="flex flex-wrap justify-center items-center gap-3 text-white/60 text-xs">
          <span className="uppercase tracking-wider font-semibold text-white/40">Powered by trusted sources</span>
          {["Reuters", "AP News", "BBC", "The Economist", "Foreign Policy", "MIT Tech Review"].map((src) => (
            <span key={src} className="px-3 py-1 rounded-full bg-white/10 border border-white/15 text-white/70">
              {src}
            </span>
          ))}
        </div>

      </div>
    </section>
  );
}
