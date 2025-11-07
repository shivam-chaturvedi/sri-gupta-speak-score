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
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back to Home Button */}
        <Link to="/">
          <Button
            variant="ghost"
            className="mb-6 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Profile</h1>
          <p className="text-muted-foreground">Manage your account information and preferences</p>
        </div>

        {/* Profile Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Profile Information</CardTitle>
              {!isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar Section */}
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarFallback className="text-2xl font-bold bg-primary/10">
                  {displayName?.charAt(0).toUpperCase() || userInitial}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-xl font-semibold">
                  {displayName || user.email || 'User'}
                </h3>
                <p className="text-muted-foreground">{user.email}</p>
                <Badge variant="outline" className="mt-2">
                  Member since {joinDate}
                </Badge>
              </div>
            </div>

            {/* Edit Form */}
            {isEditing ? (
              <div className="space-y-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your display name"
                  />
                  <p className="text-xs text-muted-foreground">
                    This name will be displayed on your profile and progress page
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Display Name</p>
                    <p className="text-sm text-muted-foreground">
                      {displayName || 'Not set'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Email Address</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Member Since</p>
                    <p className="text-sm text-muted-foreground">{joinDate}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link to="/progress">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">View Progress</h3>
                    <p className="text-sm text-muted-foreground">
                      Track your achievements and stats
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-success/10 rounded-lg">
                    <ArrowLeft className="w-6 h-6 text-success" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Start Practicing</h3>
                    <p className="text-sm text-muted-foreground">
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


