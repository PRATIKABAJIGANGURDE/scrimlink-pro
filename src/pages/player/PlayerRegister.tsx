
import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { signUpPlayer, getCurrentPlayer, savePlayer, updatePlayer } from "@/lib/storage"; // Added updatePlayer
import { playerRegisterSchema } from "@/lib/validations";
import { Users, ArrowLeft, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Player } from "@/types"; // Assuming Player type is available or needs to be imported

const PlayerRegister = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isAddingProfile, setIsAddingProfile] = useState(false);
  const [isConnectIGL, setIsConnectIGL] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [existingPlayer, setExistingPlayer] = useState<Player | null>(null); // New state for existing player

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
    joinCode: "",
    role: "",
  });

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const mode = searchParams.get("mode"); // Capture mode early

      if (session?.user) {
        // User is logged in
        const player = await getCurrentPlayer();

        if (player) {
          // Player profile exists
          if (mode === 'connect_igl') {
            // If mode is connect_igl, we might want to re-link an existing profile
            setExistingPlayer(player);
            setIsConnectIGL(true); // Enable IGL mode UI if we proceed
            setUserId(session.user.id); // Set userId for potential update
            // Do NOT navigate away. Let the user decide to re-link or not.
          } else {
            // Player profile exists, and it's not connect_igl mode, so redirect
            navigate("/player/dashboard");
          }
        } else {
          // Logged in but no player profile -> Mode: Add Profile
          setIsAddingProfile(true);
          setUserId(session.user.id);

          // Check if mode is 'connect_igl' (already captured)
          if (mode === 'connect_igl') {
            setIsConnectIGL(true);
            setFormData(prev => ({ ...prev, email: "", role: "IGL" })); // Clear email for IGL allow custom
            toast({
              title: "Connect Leader Profile",
              description: "Create your IGL profile to manage your team.",
            });
          } else {
            setFormData(prev => ({ ...prev, email: session.user.email || "" }));
            toast({
              title: "Account found",
              description: "You are already logged in. Create a player profile for your account.",
            });
          }
        }
      }
    };
    checkSession();
  }, [navigate, searchParams, toast]); // Added searchParams and toast to dependencies

  useEffect(() => {
    const role = searchParams.get("role");
    if (role) {
      setFormData(prev => ({ ...prev, role: role }));
    }
  }, [searchParams]);

  const handleRelink = async () => {
    if (!existingPlayer || !userId) return;
    setLoading(true);
    try {
      await updatePlayer(existingPlayer.id, {
        teamId: userId, // Link to current team account
        role: 'IGL',
        status: 'approved'
      });
      toast({
        title: "Profile Linked",
        description: "Your existing player profile has been linked as Team Leader."
      });
      navigate("/team/dashboard");
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validate input with zod
    const validation = playerRegisterSchema.safeParse(formData);
    if (!isAddingProfile && !validation.success) {
      const firstError = validation.error.errors[0];
      toast({
        title: "Validation Error",
        description: firstError.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Manual validation if adding profile
    if (isAddingProfile) {
      if (!formData.username) {
        toast({ title: "Validation Error", description: "Username is required", variant: "destructive" });
        setLoading(false);
        return;
      }
      if (/\s/.test(formData.username)) {
        toast({ title: "Validation Error", description: "Username cannot contain spaces", variant: "destructive" });
        setLoading(false);
        return;
      }
    }

    try {
      if (isAddingProfile && userId) {
        if (isConnectIGL) {
          // If connecting IGL, we automatically link the team (which is the SAME ID as user in this model)
          // and set status to APPROVED (since they own the team).
          await savePlayer({
            id: userId,
            username: formData.username,
            email: formData.email,
            status: 'approved', // Auto-approve IGL
            createdAt: new Date().toISOString(),
            role: 'IGL',
            phoneNumber: formData.phoneNumber,
            teamId: userId // Link to own team
          });
          toast({
            title: "Leader Connected!",
            description: "Your IGL profile is now connected to your Team.",
          });
        } else {
          await savePlayer({
            id: userId,
            username: formData.username,
            email: formData.email,
            status: 'pending',
            createdAt: new Date().toISOString(),
            role: formData.role as any,
            phoneNumber: formData.phoneNumber
          });
          toast({
            title: "Profile Created!",
            description: "Your player profile has been created.",
          });
        }
        navigate("/player/dashboard");
      } else {
        await signUpPlayer(
          validation.data.email!,
          validation.data.password!,
          validation.data.username!,
          undefined, // No join code
          validation.data.role,
          validation.data.phoneNumber
        );
        setShowSuccess(true);
        toast({
          title: "Registration successful!",
          description: "Please check your email to verify your account.",
        });
      }
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Registration failed",
        description: error.message || "An error occurred during registration",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Registration Successful!</CardTitle>
            <CardDescription>
              We've sent a verification link to <strong>{formData.email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Please check your email and click the link to activate your account.
              Once verified, you will be redirected to your dashboard.
            </p>
            <Button className="w-full" variant="outline" onClick={() => navigate("/player/login")}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl">
              {isConnectIGL ? "Connect IGL Profile" : (isAddingProfile ? "Create Player Profile" : "Player Registration")}
            </CardTitle>
          </div>
          <CardDescription>
            {isConnectIGL ? "Set up your leader profile for this team" : (isAddingProfile ? "Add a player profile to your existing account" : "Create your account and join a team")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {existingPlayer ? (
            <div className="text-center py-6 space-y-4">
              <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Users className="h-10 w-10 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Existing Profile Found</h3>
                <p className="text-muted-foreground">
                  We found a player profile for <strong>{existingPlayer.username}</strong> on your account.
                </p>
              </div>
              <Button onClick={handleRelink} className="w-full" disabled={loading}>
                {loading ? "Linking..." : "Link as Leader (IGL)"}
              </Button>
              <div className="flex flex-col gap-2">
                <p className="text-xs text-muted-foreground">
                  This will connect your existing profile to this team as the IGL.
                </p>
                <Button variant="ghost" size="sm" onClick={async () => {
                  await supabase.auth.signOut();
                  window.location.href = "/player/login";
                }} className="text-xs text-muted-foreground hover:text-foreground">
                  Not you? Logout & Switch Account
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="Your in-game name"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="player@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={isAddingProfile && !isConnectIGL}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="+91 1234567890"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                />
              </div>

              {!isConnectIGL && (
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select onValueChange={(value) => setFormData({ ...formData, role: value })} value={formData.role}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IGL">IGL (In-Game Leader)</SelectItem>
                      <SelectItem value="Rusher">Rusher</SelectItem>
                      <SelectItem value="Sniper">Sniper</SelectItem>
                      <SelectItem value="Supporter">Supporter</SelectItem>
                      <SelectItem value="Flanker">Flanker</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              {isConnectIGL && (
                <div className="p-3 bg-muted rounded-md text-sm text-muted-foreground flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span>Role will be set to <strong>IGL (Leader)</strong></span>
                </div>
              )}

              {!isAddingProfile && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Min 6 characters"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      required
                    />
                  </div>
                </>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Processing..." : (isConnectIGL ? "Connect Leader Profile" : (isAddingProfile ? "Create Player Profile" : "Join Team"))}
              </Button>
            </form>
          )}

          <div className="text-center text-sm text-muted-foreground mt-6 space-y-2">
            <p>
              Already have an account?{" "}
              <Link to="/player/login" className="text-primary hover:underline">
                Login here
              </Link>
            </p>
            {userId && (
              <Button variant="link" size="sm" onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = "/player/login";
              }} className="text-xs text-muted-foreground hover:text-destructive">
                Logout & Switch Account
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlayerRegister;
