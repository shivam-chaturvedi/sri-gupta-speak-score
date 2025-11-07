-- ============================================
-- Supabase Schema for Speak Score Elevate
-- Complete database schema for authentication and application
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- PROFILES TABLE
-- User profile information linked to auth.users
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    display_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- ============================================
-- DEBATE SESSIONS TABLE
-- Stores user debate session recordings and scores
-- ============================================
CREATE TABLE IF NOT EXISTS public.debate_sessions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    motion_id TEXT,
    motion_topic TEXT NOT NULL,
    stance TEXT,
    duration INTEGER NOT NULL,
    transcript TEXT,
    score_logic INTEGER,
    score_rhetoric INTEGER,
    score_empathy INTEGER,
    score_delivery INTEGER,
    overall_score INTEGER,
    feedback JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on debate_sessions
ALTER TABLE public.debate_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for debate_sessions
CREATE POLICY "Users can view their own sessions" 
ON public.debate_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions" 
ON public.debate_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" 
ON public.debate_sessions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions" 
ON public.debate_sessions 
FOR DELETE 
USING (auth.uid() = user_id);

-- ============================================
-- USER PROGRESS TABLE
-- Tracks user progress, points, streaks, and levels
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_progress (
    progress_id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    total_points INTEGER NOT NULL DEFAULT 0,
    current_level INTEGER NOT NULL DEFAULT 1,
    current_streak INTEGER NOT NULL DEFAULT 0,
    longest_streak INTEGER NOT NULL DEFAULT 0,
    last_activity_date DATE,
    total_time_spent INTEGER NOT NULL DEFAULT 0, -- in seconds
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on user_progress
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

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

-- ============================================
-- ACHIEVEMENT BADGES TABLE
-- Defines available achievement badges
-- ============================================
CREATE TABLE IF NOT EXISTS public.achievement_badges (
    badge_id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    badge_name TEXT NOT NULL,
    badge_description TEXT NOT NULL,
    icon_name TEXT NOT NULL, -- Lucide icon name
    badge_tier TEXT NOT NULL CHECK (badge_tier IN ('bronze', 'silver', 'gold', 'platinum', 'diamond')),
    achievement_criteria JSONB NOT NULL,
    points_value INTEGER NOT NULL DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on achievement_badges
ALTER TABLE public.achievement_badges ENABLE ROW LEVEL SECURITY;

-- RLS Policies for achievement_badges (public read access)
CREATE POLICY "Anyone can view achievement badges" 
ON public.achievement_badges 
FOR SELECT 
USING (true);

-- ============================================
-- USER ACHIEVEMENT BADGES TABLE
-- Tracks badges earned by users
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_achievement_badges (
    user_badge_id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES public.achievement_badges(badge_id) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    progress_percentage INTEGER NOT NULL DEFAULT 100 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    UNIQUE(user_id, badge_id)
);

-- Enable RLS on user_achievement_badges
ALTER TABLE public.user_achievement_badges ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_achievement_badges
CREATE POLICY "Users can view their own badges" 
ON public.user_achievement_badges 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own badges" 
ON public.user_achievement_badges 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- ============================================
-- SESSION FEEDBACK TABLE
-- User self-assessment and reflection for sessions
-- ============================================
CREATE TABLE IF NOT EXISTS public.session_feedback (
    feedback_id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES public.debate_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    self_rating INTEGER CHECK (self_rating >= 1 AND self_rating <= 5),
    reflection_notes TEXT,
    improvement_goals TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on session_feedback
ALTER TABLE public.session_feedback ENABLE ROW LEVEL SECURITY;

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

-- ============================================
-- FUNCTIONS
-- Helper functions for triggers and utilities
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Function to handle new user creation (creates profile)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'display_name')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Function to initialize user progress when user is created
CREATE OR REPLACE FUNCTION public.initialize_user_progress()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.user_progress (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$;

-- ============================================
-- TRIGGERS
-- Automatic actions on database events
-- ============================================

-- Trigger to update updated_at on profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to update updated_at on user_progress
DROP TRIGGER IF EXISTS update_user_progress_updated_at ON public.user_progress;
CREATE TRIGGER update_user_progress_updated_at
    BEFORE UPDATE ON public.user_progress
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger to initialize user progress when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created_progress ON auth.users;
CREATE TRIGGER on_auth_user_created_progress
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.initialize_user_progress();

-- ============================================
-- INITIAL DATA
-- Seed data for achievement badges
-- ============================================

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
('Growth Mindset', 'Provide self-assessment for 50 sessions', 'TrendingUp', 'gold', '{"type": "feedback_count", "value": 50}', 200)
ON CONFLICT DO NOTHING;

-- ============================================
-- INDEXES
-- Performance optimization indexes
-- ============================================

-- Indexes for profiles
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);

-- Indexes for debate_sessions
CREATE INDEX IF NOT EXISTS idx_debate_sessions_user_id ON public.debate_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_debate_sessions_created_at ON public.debate_sessions(created_at DESC);

-- Indexes for user_progress
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON public.user_progress(user_id);

-- Indexes for user_achievement_badges
CREATE INDEX IF NOT EXISTS idx_user_achievement_badges_user_id ON public.user_achievement_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievement_badges_badge_id ON public.user_achievement_badges(badge_id);

-- Indexes for session_feedback
CREATE INDEX IF NOT EXISTS idx_session_feedback_user_id ON public.session_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_session_feedback_session_id ON public.session_feedback(session_id);

-- ============================================
-- COMMENTS
-- Documentation for tables and columns
-- ============================================

COMMENT ON TABLE public.profiles IS 'User profile information linked to auth.users';
COMMENT ON TABLE public.debate_sessions IS 'Stores user debate session recordings, transcripts, and scores';
COMMENT ON TABLE public.user_progress IS 'Tracks user progress, points, streaks, and levels';
COMMENT ON TABLE public.achievement_badges IS 'Defines available achievement badges and their criteria';
COMMENT ON TABLE public.user_achievement_badges IS 'Tracks badges earned by users';
COMMENT ON TABLE public.session_feedback IS 'User self-assessment and reflection for debate sessions';


