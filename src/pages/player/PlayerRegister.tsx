import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { signUpPlayer, getTeamByJoinCode, setCurrentPlayer } from "@/lib/storage";
import { Users, ArrowLeft, Clock } from "lucide-react";
import { Player, JoinRequest } from "@/types";

const PlayerRegister = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPending, setShowPending] = useState(false);
  const [teamName, setTeamName] = useState("");

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    joinCode: "",
    role: "",
  });

  useEffect(() => {
    const code = searchParams.get("code");
    const role = searchParams.get("role");
    if (code) {
      setFormData(prev => ({ ...prev, joinCode: code }));
    }
    if (role) {
      setFormData(prev => ({ ...prev, role: role }));
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      const user = await signUpPlayer(
        formData.email,
        formData.password,
        formData.username,
        formData.joinCode.toUpperCase(),
        formData.role
      );

      // We need to fetch the team name to display in the success message
      // This is a bit redundant but ensures we have the correct team name
      // In a real app, signUpPlayer could return { user, team }
      const team = await getTeamByJoinCode(formData.joinCode.toUpperCase());
      if (team) setTeamName(team.name);

      setShowPending(true);
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


  if (showPending) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Clock className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Request Sent!</CardTitle>
            <CardDescription>
              Your request to join <span className="font-semibold text-foreground">{teamName}</span> has been sent
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-muted rounded-lg text-center">
              <p className="text-sm text-muted-foreground">
                The team captain (IGL) will review your request. You'll be notified once approved.
              </p>
            </div>
            <Button className="w-full" onClick={() => navigate("/player/dashboard")}>
              Go to Dashboard
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
            <CardTitle className="text-2xl">Player Registration</CardTitle>
          </div>
          <CardDescription>
            Create your account and join a team
          </CardDescription>
        </CardHeader>
        <CardContent>
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
              />
            </div>

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

            <div className="space-y-2">
              <Label htmlFor="joinCode">Team Join Code</Label>
              <Input
                id="joinCode"
                placeholder="e.g., RJ4K82"
                value={formData.joinCode}
                onChange={(e) => setFormData({ ...formData, joinCode: e.target.value.toUpperCase() })}
                className="uppercase tracking-widest"
                maxLength={6}
                required
              />
              <p className="text-xs text-muted-foreground">Get this code from your team captain</p>
            </div>

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

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Sending Request..." : "Join Team"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link to="/player/login" className="text-primary hover:underline">
              Login here
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlayerRegister;
