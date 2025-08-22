import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress as ProgressBar } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Trophy, Calendar, Star, Target, Zap, TrendingUp, Award, Crown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Navigate } from 'react-router-dom';

interface UserProgress {
  total_points: number;
  current_level: number;
  current_streak: number;
  longest_streak: number;
  total_time_spent: number;
}

interface Badge {
  badge_id: string;
  badge_name: string;
  badge_description: string;
  icon_name: string;
  badge_tier: string;
  points_value: number;
  earned_at?: string;
}

interface SessionStats {
  total_sessions: number;
  average_score: number;
  perfect_scores: number;
}

const ICON_MAP = {
  Trophy, Calendar, Star, Target, Zap, TrendingUp, Award, Crown,
  BookOpen: Trophy, GraduationCap: Award, Brain: Star, ThumbsUp: Target,
  Medal: Trophy, Gem: Crown, Rocket: Zap, Bolt: Zap, MessageSquare: TrendingUp,
  Eye: Target, CalendarDays: Calendar
};

const TIER_COLORS = {
  bronze: 'from-orange-500 to-orange-600',
  silver: 'from-gray-400 to-gray-500',
  gold: 'from-yellow-400 to-yellow-500',
  platinum: 'from-purple-400 to-purple-500',
  diamond: 'from-blue-400 to-blue-500'
};

const Progress = () => {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [earnedBadges, setEarnedBadges] = useState<Badge[]>([]);
  const [sessionStats, setSessionStats] = useState<SessionStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user && !loading) {
      fetchProgressData();
    }
  }, [user, loading]);

  const fetchProgressData = async () => {
    try {
      setIsLoading(true);

      // Fetch user progress
      const { data: progressData, error: progressError } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (progressError && progressError.code !== 'PGRST116') {
        throw progressError;
      }

      // Initialize progress if doesn't exist
      if (!progressData) {
        const { data: newProgress, error: insertError } = await supabase
          .from('user_progress')
          .insert({ user_id: user!.id })
          .select()
          .single();

        if (insertError) throw insertError;
        setUserProgress(newProgress);
      } else {
        setUserProgress(progressData);
      }

      // Fetch all badges
      const { data: badgesData, error: badgesError } = await supabase
        .from('achievement_badges')
        .select('*')
        .order('points_value', { ascending: true });

      if (badgesError) throw badgesError;
      setAllBadges(badgesData || []);

      // Fetch earned badges
      const { data: earnedData, error: earnedError } = await supabase
        .from('user_achievement_badges')
        .select(`
          *,
          achievement_badges (*)
        `)
        .eq('user_id', user!.id);

      if (earnedError) throw earnedError;
      setEarnedBadges(earnedData?.map(item => ({
        ...item.achievement_badges,
        earned_at: item.earned_at
      })) || []);

      // Fetch session statistics
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('debate_sessions')
        .select('overall_score, duration')
        .eq('user_id', user!.id);

      if (sessionsError) throw sessionsError;

      if (sessionsData) {
        const validSessions = sessionsData.filter(s => s.overall_score !== null);
        const totalSessions = validSessions.length;
        const averageScore = totalSessions > 0 
          ? Math.round(validSessions.reduce((sum, s) => sum + s.overall_score, 0) / totalSessions)
          : 0;
        const perfectScores = validSessions.filter(s => s.overall_score === 100).length;

        setSessionStats({
          total_sessions: totalSessions,
          average_score: averageScore,
          perfect_scores: perfectScores
        });

        // Update progress with session data
        await updateProgressFromSessions(validSessions);
      }

    } catch (error) {
      console.error('Error fetching progress data:', error);
      toast({
        title: "Error",
        description: "Failed to load progress data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateProgressFromSessions = async (sessions: any[]) => {
    if (sessions.length === 0) return;

    const totalTimeSpent = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    const totalPoints = sessions.length * 10; // Base points per session

    const { error } = await supabase
      .from('user_progress')
      .update({
        total_time_spent: totalTimeSpent,
        total_points: totalPoints
      })
      .eq('user_id', user!.id);

    if (error) {
      console.error('Error updating progress:', error);
    }
  };

  const getIconComponent = (iconName: string) => {
    return ICON_MAP[iconName as keyof typeof ICON_MAP] || Trophy;
  };

  const getTierBadge = (tier: string) => {
    const colors = {
      bronze: 'bg-orange-100 text-orange-800 border-orange-200',
      silver: 'bg-gray-100 text-gray-800 border-gray-200',
      gold: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      platinum: 'bg-purple-100 text-purple-800 border-purple-200',
      diamond: 'bg-blue-100 text-blue-800 border-blue-200'
    };

    return (
      <Badge variant="outline" className={colors[tier as keyof typeof colors] || colors.bronze}>
        {tier.charAt(0).toUpperCase() + tier.slice(1)}
      </Badge>
    );
  };

  const calculateLevel = (points: number) => {
    return Math.floor(points / 100) + 1;
  };

  const getPointsToNextLevel = (points: number) => {
    const nextLevelPoints = calculateLevel(points) * 100;
    return nextLevelPoints - points;
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const earnedBadgeIds = new Set(earnedBadges.map(b => b.badge_id));
  const availableBadges = allBadges.filter(b => !earnedBadgeIds.has(b.badge_id));

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-xl font-bold bg-primary/10">
                {user.email?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold">Your Progress</h1>
              <p className="text-muted-foreground">Track your debate journey and achievements</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Points</p>
                    <p className="text-2xl font-bold">{userProgress?.total_points || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Level</p>
                    <p className="text-2xl font-bold">{calculateLevel(userProgress?.total_points || 0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Current Streak</p>
                    <p className="text-2xl font-bold">{userProgress?.current_streak || 0} days</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Sessions</p>
                    <p className="text-2xl font-bold">{sessionStats?.total_sessions || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Level Progress */}
          {userProgress && (
            <Card className="mb-8">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold">Level {calculateLevel(userProgress.total_points)}</h3>
                  <span className="text-sm text-muted-foreground">
                    {getPointsToNextLevel(userProgress.total_points)} points to next level
                  </span>
                </div>
                <ProgressBar 
                  value={(userProgress.total_points % 100)} 
                  className="h-3"
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="badges" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="badges">Achievements</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
          </TabsList>

          <TabsContent value="badges" className="space-y-6">
            {/* Earned Badges */}
            <div>
              <h2 className="text-2xl font-bold mb-4">Earned Badges ({earnedBadges.length})</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {earnedBadges.map((badge) => {
                  const IconComponent = getIconComponent(badge.icon_name);
                  return (
                    <Card key={badge.badge_id} className="relative overflow-hidden">
                      <div className={`absolute inset-0 bg-gradient-to-br ${TIER_COLORS[badge.badge_tier]} opacity-10`} />
                      <CardContent className="p-4 relative">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`p-2 rounded-full bg-gradient-to-br ${TIER_COLORS[badge.badge_tier]} text-white`}>
                            <IconComponent className="h-5 w-5" />
                          </div>
                          {getTierBadge(badge.badge_tier)}
                        </div>
                        <h3 className="font-semibold mb-1">{badge.badge_name}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{badge.badge_description}</p>
                        <p className="text-xs text-muted-foreground">
                          Earned {new Date(badge.earned_at!).toLocaleDateString()}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Available Badges */}
            <div>
              <h2 className="text-2xl font-bold mb-4">Available Badges ({availableBadges.length})</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {availableBadges.map((badge) => {
                  const IconComponent = getIconComponent(badge.icon_name);
                  return (
                    <Card key={badge.badge_id} className="opacity-60 hover:opacity-80 transition-opacity">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 rounded-full bg-muted">
                            <IconComponent className="h-5 w-5 text-muted-foreground" />
                          </div>
                          {getTierBadge(badge.badge_tier)}
                        </div>
                        <h3 className="font-semibold mb-1">{badge.badge_name}</h3>
                        <p className="text-sm text-muted-foreground">{badge.badge_description}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="progress" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Session Progress</CardTitle>
                  <CardDescription>Your debate session history</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Total Sessions</span>
                      <span className="font-semibold">{sessionStats?.total_sessions || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average Score</span>
                      <span className="font-semibold">{sessionStats?.average_score || 0}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Perfect Scores</span>
                      <span className="font-semibold">{sessionStats?.perfect_scores || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Time Tracking</CardTitle>
                  <CardDescription>Time spent practicing</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Total Time</span>
                      <span className="font-semibold">
                        {Math.round((userProgress?.total_time_spent || 0) / 60)} minutes
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Current Streak</span>
                      <span className="font-semibold">{userProgress?.current_streak || 0} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Longest Streak</span>
                      <span className="font-semibold">{userProgress?.longest_streak || 0} days</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="stats" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Detailed Statistics</CardTitle>
                <CardDescription>Comprehensive view of your performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">{earnedBadges.length}</div>
                    <div className="text-sm text-muted-foreground">Badges Earned</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">{userProgress?.total_points || 0}</div>
                    <div className="text-sm text-muted-foreground">Total Points</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">
                      {sessionStats?.average_score || 0}%
                    </div>
                    <div className="text-sm text-muted-foreground">Average Score</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Progress;