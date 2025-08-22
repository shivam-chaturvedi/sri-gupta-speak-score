import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProgressTrackerProps {
  sessionData?: {
    score: number;
    duration: number;
    sessionId: string;
  };
}

export const ProgressTracker = ({ sessionData }: ProgressTrackerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (sessionData && user) {
      updateProgress();
      checkAchievements();
    }
  }, [sessionData, user]);

  const updateProgress = async () => {
    if (!sessionData || !user) return;

    try {
      // Update user progress with new session data
      const { data: currentProgress } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (currentProgress) {
        const newPoints = currentProgress.total_points + 10; // Base points per session
        const bonusPoints = sessionData.score === 100 ? 20 : 0; // Perfect score bonus
        const speedBonus = sessionData.duration < 120 ? 10 : 0; // Speed bonus

        await supabase
          .from('user_progress')
          .update({
            total_points: newPoints + bonusPoints + speedBonus,
            total_time_spent: currentProgress.total_time_spent + sessionData.duration,
            last_activity_date: new Date().toISOString().split('T')[0]
          })
          .eq('user_id', user.id);
      }
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const checkAchievements = async () => {
    if (!user || !sessionData) return;

    try {
      // Get current session count
      const { data: sessions } = await supabase
        .from('debate_sessions')
        .select('overall_score')
        .eq('user_id', user.id);

      const sessionCount = sessions?.length || 0;
      const perfectScores = sessions?.filter(s => s.overall_score === 100).length || 0;
      const averageScore = sessions?.length > 0 
        ? sessions.reduce((sum, s) => sum + (s.overall_score || 0), 0) / sessions.length 
        : 0;

      // Check for new badge achievements
      const { data: availableBadges } = await supabase
        .from('achievement_badges')
        .select('*');

      const { data: earnedBadges } = await supabase
        .from('user_achievement_badges')
        .select('badge_id')
        .eq('user_id', user.id);

      const earnedBadgeIds = new Set(earnedBadges?.map(b => b.badge_id) || []);

      for (const badge of availableBadges || []) {
        if (earnedBadgeIds.has(badge.badge_id)) continue;

        const criteria = badge.achievement_criteria as any;
        let shouldAward = false;

        switch (criteria.type) {
          case 'session_count':
            shouldAward = sessionCount >= criteria.value;
            break;
          case 'average_score':
            shouldAward = averageScore >= criteria.value;
            break;
          case 'perfect_scores':
            shouldAward = perfectScores >= criteria.value;
            break;
          case 'session_duration':
            shouldAward = sessionData.duration < criteria.value;
            break;
        }

        if (shouldAward) {
          // Award the badge
          await supabase
            .from('user_achievement_badges')
            .insert({
              user_id: user.id,
              badge_id: badge.badge_id
            });

          // Show toast notification
          toast({
            title: "Achievement Unlocked! 🏆",
            description: `You earned the "${badge.badge_name}" badge!`,
          });
        }
      }
    } catch (error) {
      console.error('Error checking achievements:', error);
    }
  };

  return null; // This component doesn't render anything
};

export default ProgressTracker;