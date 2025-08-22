-- Create progress tracking tables that work alongside existing debate_sessions and profiles

-- Achievement badges definition table
CREATE TABLE public.achievement_badges (
    badge_id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    badge_name TEXT NOT NULL,
    badge_description TEXT NOT NULL,
    icon_name TEXT NOT NULL, -- Lucide icon name
    badge_tier TEXT NOT NULL CHECK (badge_tier IN ('bronze', 'silver', 'gold', 'platinum', 'diamond')),
    achievement_criteria JSONB NOT NULL,
    points_value INTEGER NOT NULL DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User progress tracking (extends existing profiles)
CREATE TABLE public.user_progress (
    progress_id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    total_points INTEGER NOT NULL DEFAULT 0,
    current_level INTEGER NOT NULL DEFAULT 1,
    current_streak INTEGER NOT NULL DEFAULT 0,
    longest_streak INTEGER NOT NULL DEFAULT 0,
    last_activity_date DATE,
    total_time_spent INTEGER NOT NULL DEFAULT 0, -- in seconds
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id)
);

-- User earned badges
CREATE TABLE public.user_achievement_badges (
    user_badge_id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES public.achievement_badges(badge_id) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    progress_percentage INTEGER NOT NULL DEFAULT 100 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    UNIQUE(user_id, badge_id)
);

-- Progress feedback for sessions (links to existing debate_sessions)
CREATE TABLE public.session_feedback (
    feedback_id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES public.debate_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    self_rating INTEGER CHECK (self_rating >= 1 AND self_rating <= 5),
    reflection_notes TEXT,
    improvement_goals TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.achievement_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievement_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies for achievement_badges (public read access)
CREATE POLICY "Anyone can view achievement badges" 
ON public.achievement_badges 
FOR SELECT 
USING (true);

-- RLS Policies for user_progress
CREATE POLICY "Users can view their own progress" 
ON public.user_progress 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress" 
ON public.user_progress 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" 
ON public.user_progress 
FOR UPDATE 
USING (auth.uid() = user_id);

-- RLS Policies for user_achievement_badges
CREATE POLICY "Users can view their own badges" 
ON public.user_achievement_badges 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own badges" 
ON public.user_achievement_badges 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for session_feedback
CREATE POLICY "Users can view their own feedback" 
ON public.session_feedback 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own feedback" 
ON public.session_feedback 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feedback" 
ON public.session_feedback 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for updating user_progress timestamps
CREATE TRIGGER update_user_progress_updated_at
    BEFORE UPDATE ON public.user_progress
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial achievement badges
INSERT INTO public.achievement_badges (badge_name, badge_description, icon_name, badge_tier, achievement_criteria, points_value) VALUES
-- Engagement Badges
('First Steps', 'Complete your first debate session', 'Trophy', 'bronze', '{"type": "session_count", "value": 1}', 10),
('Getting Started', 'Complete 5 debate sessions', 'Award', 'bronze', '{"type": "session_count", "value": 5}', 25),
('Consistent Learner', 'Maintain a 7-day activity streak', 'Calendar', 'silver', '{"type": "streak", "value": 7}', 50),
('Dedicated Student', 'Maintain a 30-day activity streak', 'CalendarDays', 'gold', '{"type": "streak", "value": 30}', 150),
('Learning Champion', 'Maintain a 100-day activity streak', 'Crown', 'platinum', '{"type": "streak", "value": 100}', 500),

-- Performance Badges
('Quick Learner', 'Complete 10 debate sessions', 'BookOpen', 'bronze', '{"type": "session_count", "value": 10}', 50),
('Knowledge Seeker', 'Complete 25 debate sessions', 'GraduationCap', 'silver', '{"type": "session_count", "value": 25}', 125),
('Expert Scholar', 'Complete 50 debate sessions', 'Brain', 'gold', '{"type": "session_count", "value": 50}', 250),
('Debate Master', 'Complete 100 debate sessions', 'Star', 'platinum', '{"type": "session_count", "value": 100}', 500),

-- Quality Badges
('Good Start', 'Achieve an average score of 70% or higher', 'ThumbsUp', 'bronze', '{"type": "average_score", "value": 70}', 75),
('High Achiever', 'Achieve an average score of 80% or higher', 'Target', 'silver', '{"type": "average_score", "value": 80}', 150),
('Excellence', 'Achieve an average score of 90% or higher', 'Medal', 'gold', '{"type": "average_score", "value": 90}', 300),
('Perfectionist', 'Score 100% on 5 different sessions', 'Gem', 'platinum', '{"type": "perfect_scores", "value": 5}', 400),

-- Speed Badges
('Quick Response', 'Complete a session in under 2 minutes', 'Zap', 'bronze', '{"type": "session_duration", "value": 120, "operator": "less_than"}', 30),
('Speed Demon', 'Complete 10 sessions in under 2 minutes each', 'Rocket', 'silver', '{"type": "fast_sessions", "duration": 120, "count": 10}', 100),
('Lightning Fast', 'Complete 25 sessions in under 1 minute each', 'Bolt', 'gold', '{"type": "fast_sessions", "duration": 60, "count": 25}', 250),

-- Engagement Badges
('Reflective', 'Provide self-assessment for 10 sessions', 'MessageSquare', 'bronze', '{"type": "feedback_count", "value": 10}', 40),
('Self-Aware', 'Provide self-assessment for 25 sessions', 'Eye', 'silver', '{"type": "feedback_count", "value": 25}', 100),
('Growth Mindset', 'Provide self-assessment for 50 sessions', 'TrendingUp', 'gold', '{"type": "feedback_count", "value": 50}', 200);

-- Function to initialize user progress
CREATE OR REPLACE FUNCTION public.initialize_user_progress()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_progress (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create progress when user is created
CREATE TRIGGER on_auth_user_created_progress
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.initialize_user_progress();