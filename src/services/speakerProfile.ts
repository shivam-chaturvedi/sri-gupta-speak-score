import { supabase } from "@/integrations/supabase/client";
import {
  ALL_CRITERIA,
  CRITERION_LABELS,
  CRITERION_MAX,
  type AssessmentCriterion,
} from "@/types/feedback";

export type SpeakerProfileSummary = {
  sessionCount: number;
  averages: Partial<Record<AssessmentCriterion, number>>;
  weakest: AssessmentCriterion[];
  strongest: AssessmentCriterion[];
  lowScoringTopics: string[];
  contextForPrompt: string;
};

function pct(score: number | null | undefined, max: number): number | null {
  if (score == null || Number.isNaN(Number(score))) return null;
  return Math.round((Number(score) / max) * 100);
}

export async function buildSpeakerProfileContext(
  userId: string,
  limit = 12,
): Promise<string | undefined> {
  const summary = await loadSpeakerProfile(userId, limit);
  return summary?.contextForPrompt;
}

export async function loadSpeakerProfile(
  userId: string,
  limit = 20,
): Promise<SpeakerProfileSummary | null> {
  const { data, error } = await supabase
    .from("debate_sessions")
    .select(
      "motion_topic, score_logic, score_rhetoric, score_empathy, score_delivery, overall_score, created_at",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data || data.length === 0) return null;

  const sums: Record<AssessmentCriterion, { total: number; count: number }> = {
    logic: { total: 0, count: 0 },
    rhetoric: { total: 0, count: 0 },
    empathy: { total: 0, count: 0 },
    delivery: { total: 0, count: 0 },
  };

  const topicScores = new Map<string, number[]>();

  for (const row of data) {
    const scores: Record<AssessmentCriterion, number | null> = {
      logic: pct(row.score_logic, CRITERION_MAX.logic),
      rhetoric: pct(row.score_rhetoric, CRITERION_MAX.rhetoric),
      empathy: pct(row.score_empathy, CRITERION_MAX.empathy),
      delivery: pct(row.score_delivery, CRITERION_MAX.delivery),
    };
    for (const c of ALL_CRITERIA) {
      const v = scores[c];
      if (v != null) {
        sums[c].total += v;
        sums[c].count += 1;
      }
    }
    if (row.motion_topic && row.overall_score != null) {
      const maxPossible = 30;
      const overallPct = Math.round((Number(row.overall_score) / maxPossible) * 100);
      const list = topicScores.get(row.motion_topic) ?? [];
      list.push(overallPct);
      topicScores.set(row.motion_topic, list);
    }
  }

  const averages: Partial<Record<AssessmentCriterion, number>> = {};
  for (const c of ALL_CRITERIA) {
    if (sums[c].count > 0) {
      averages[c] = Math.round(sums[c].total / sums[c].count);
    }
  }

  const ranked = ALL_CRITERIA.filter((c) => averages[c] != null).sort(
    (a, b) => (averages[a] ?? 0) - (averages[b] ?? 0),
  );
  const weakest = ranked.slice(0, 2);
  const strongest = [...ranked].reverse().slice(0, 2);

  const lowScoringTopics = Array.from(topicScores.entries())
    .map(([topic, scores]) => ({
      topic,
      avg: scores.reduce((a, b) => a + b, 0) / scores.length,
    }))
    .filter((t) => t.avg < 65)
    .sort((a, b) => a.avg - b.avg)
    .slice(0, 3)
    .map((t) => t.topic);

  const focusLines = [
    weakest.length
      ? `Recurring weaker areas: ${weakest.map((c) => `${CRITERION_LABELS[c]} (~${averages[c]}%)`).join(", ")}`
      : null,
    strongest.length
      ? `Relative strengths: ${strongest.map((c) => `${CRITERION_LABELS[c]} (~${averages[c]}%)`).join(", ")}`
      : null,
    lowScoringTopics.length
      ? `Lower-scoring topics historically: ${lowScoringTopics.join("; ")}`
      : null,
  ].filter(Boolean);

  const contextForPrompt =
    focusLines.length > 0
      ? [
          `SPEAKER PROFILE (from ${data.length} recent session(s)):`,
          ...focusLines.map((l) => `- ${l}`),
          "Prioritize actionable coaching on the weaker areas unless the user deselected those criteria. Distinguish one-off slips from recurring patterns when possible.",
        ].join("\n")
      : "";

  return {
    sessionCount: data.length,
    averages,
    weakest,
    strongest,
    lowScoringTopics,
    contextForPrompt,
  };
}
