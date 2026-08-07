import { supabase } from "@/integrations/supabase/client";
import type { Motion } from "@/data/motions";
import type { AssessmentCriterion, FeedbackLengthMinutes } from "@/types/feedback";

type ScoreResultLike = {
  score?: {
    logic?: number;
    rhetoric?: number;
    empathy?: number;
    delivery?: number;
    total?: number;
  };
  feedback?: unknown;
  missingPoints?: string[];
  enhancedArgument?: string | null;
  enhancedFeedback?: unknown;
};

export async function saveDebateSession(params: {
  userId: string;
  motion: Motion;
  stance?: string | null;
  duration: number;
  transcript: string;
  results: ScoreResultLike;
  audioBlob?: Blob | null;
  feedbackLengthMinutes: FeedbackLengthMinutes;
  selectedCriteria: AssessmentCriterion[];
}): Promise<{ id: string | null; audioUrl: string | null }> {
  const {
    userId,
    motion,
    stance,
    duration,
    transcript,
    results,
    audioBlob,
    feedbackLengthMinutes,
    selectedCriteria,
  } = params;

  const comprehensiveFeedback = {
    stance: stance || null,
    feedbackLengthMinutes,
    selectedCriteria,
    enhancedFeedback: results.enhancedFeedback || null,
    missingPoints: results.missingPoints || [],
    enhancedArgument: results.enhancedArgument || null,
    scores: {
      logic: results.score?.logic ?? null,
      rhetoric: results.score?.rhetoric ?? null,
      empathy: results.score?.empathy ?? null,
      delivery: results.score?.delivery ?? null,
      total: results.score?.total ?? null,
    },
    feedback: results.feedback || null,
  };

  const baseRow: Record<string, unknown> = {
    user_id: userId,
    motion_id: motion.id,
    motion_topic: motion.topic,
    stance: stance || null,
    duration,
    transcript: transcript || null,
    score_logic: results.score?.logic ?? null,
    score_rhetoric: results.score?.rhetoric ?? null,
    score_empathy: results.score?.empathy ?? null,
    score_delivery: results.score?.delivery ?? null,
    overall_score: results.score?.total ?? null,
    feedback: comprehensiveFeedback,
  };

  let sessionId: string | null = null;

  const withExtras = await supabase
    .from("debate_sessions")
    .insert({
      ...baseRow,
      feedback_length_minutes: feedbackLengthMinutes,
      selected_criteria: selectedCriteria,
    })
    .select("id")
    .single();

  if (withExtras.error) {
    console.warn(
      "Insert with feedback options failed, retrying base columns:",
      withExtras.error.message,
    );
    const fallback = await supabase
      .from("debate_sessions")
      .insert(baseRow)
      .select("id")
      .single();
    if (fallback.error) {
      console.error("Error saving session to Supabase:", fallback.error);
      return { id: null, audioUrl: null };
    }
    sessionId = fallback.data?.id ?? null;
  } else {
    sessionId = withExtras.data?.id ?? null;
  }

  if (!sessionId || !audioBlob) {
    return { id: sessionId, audioUrl: null };
  }

  const ext = audioBlob.type.includes("mp4")
    ? "mp4"
    : audioBlob.type.includes("mpeg")
      ? "mp3"
      : "webm";
  const path = `${userId}/${sessionId}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("debate-recordings")
    .upload(path, audioBlob, {
      contentType: audioBlob.type || "audio/webm",
      upsert: true,
    });

  if (uploadError) {
    console.warn("Audio upload failed (session still saved):", uploadError.message);
    return { id: sessionId, audioUrl: null };
  }

  const { data: publicData } = supabase.storage
    .from("debate-recordings")
    .getPublicUrl(path);

  const audioUrl = publicData?.publicUrl ?? null;
  if (audioUrl) {
    await supabase
      .from("debate_sessions")
      .update({ audio_url: audioUrl })
      .eq("id", sessionId);
  }

  return { id: sessionId, audioUrl };
}
