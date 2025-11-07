import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, User, Mail, Calendar, Edit2, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

interface ProfileData {
  id: string;
  user_id: string;
  display_name: string | null;
  created_at: string;
  updated_at: string;
}

const Profile = () => {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user && !loading) {
      fetchProfile();
    }
  }, [user, loading]);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setProfile(data);
        setDisplayName(data.display_name || '');
      } else {
        // Create profile if it doesn't exist
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({ user_id: user.id })
          .select()
          .single();

        if (insertError) throw insertError;
        setProfile(newProfile);
        setDisplayName(newProfile.display_name || '');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      setIsSaving(true);
      
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: displayName || null })
        .eq('user_id', user.id);

      if (error) throw error;

      // Refresh profile data
      await fetchProfile();
      
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setDisplayName(profile?.display_name || '');
    setIsEditing(false);
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

  const userInitial = user.email?.charAt(0).toUpperCase() || 'U';
  const joinDate = profile?.created_at 
    ? new Date(profile.created_at).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    : 'Recently';

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8 max-w-4xl">
        {/* Back to Home Button */}
        <Link to="/">
          <Button
            variant="ghost"
            className="mb-4 sm:mb-6 flex items-center gap-2 text-sm sm:text-base"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Home</span>
            <span className="sm:hidden">Back</span>
          </Button>
        </Link>

        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">Profile</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Manage your account information and preferences</p>
        </div>

        {/* Profile Card */}
        <Card className="mb-4 sm:mb-6">
          <CardHeader className="pb-4 sm:pb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
              <CardTitle className="text-lg sm:text-xl">Profile Information</CardTitle>
              {!isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 w-full sm:w-auto"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6">
            {/* Avatar Section */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
              <Avatar className="h-20 w-20 sm:h-24 sm:w-24 flex-shrink-0">
                <AvatarFallback className="text-xl sm:text-2xl font-bold bg-primary/10">
                  {displayName?.charAt(0).toUpperCase() || userInitial}
                </AvatarFallback>
              </Avatar>
              <div className="text-center sm:text-left flex-1 min-w-0">
                <h3 className="text-lg sm:text-xl font-semibold break-words">
                  {displayName || user.email || 'User'}
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground break-words mt-1">{user.email}</p>
                <Badge variant="outline" className="mt-2 text-xs sm:text-sm">
                  Member since {joinDate}
                </Badge>
              </div>
            </div>

            {/* Edit Form */}
            {isEditing ? (
              <div className="space-y-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label htmlFor="displayName" className="text-sm sm:text-base">Display Name</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your display name"
                    className="text-sm sm:text-base"
                  />
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    This name will be displayed on your profile and progress page
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center justify-center gap-2 w-full sm:w-auto"
                  >
                    <Save className="w-4 h-4" />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="flex items-center justify-center gap-2 w-full sm:w-auto"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4 pt-4 border-t">
                <div className="flex items-start sm:items-center gap-3">
                  <User className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5 sm:mt-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm sm:text-base font-medium">Display Name</p>
                    <p className="text-sm sm:text-base text-muted-foreground break-words">
                      {displayName || 'Not set'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start sm:items-center gap-3">
                  <Mail className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5 sm:mt-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm sm:text-base font-medium">Email Address</p>
                    <p className="text-sm sm:text-base text-muted-foreground break-words">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-start sm:items-center gap-3">
                  <Calendar className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5 sm:mt-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm sm:text-base font-medium">Member Since</p>
                    <p className="text-sm sm:text-base text-muted-foreground break-words">{joinDate}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <Link to="/progress">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="p-2.5 sm:p-3 bg-primary/10 rounded-lg flex-shrink-0">
                    <User className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm sm:text-base">View Progress</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                      Track your achievements and stats
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="p-2.5 sm:p-3 bg-success/10 rounded-lg flex-shrink-0">
                    <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-success" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm sm:text-base">Start Practicing</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                      Choose a topic and begin
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Profile;


