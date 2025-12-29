import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { signIn, getCurrentTeam } from "@/lib/storage";
import { loginSchema } from "@/lib/validations";
import { Trophy, ArrowLeft } from "lucide-react";

const TeamLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Verify if the user is actually a team
        const team = await getCurrentTeam();
        if (team) {
          navigate("/team/dashboard");
        } else {
          // User is logged in but not as a team. Redirect to register to create profile.
          toast({
            title: "Create Team Profile",
            description: "You are logged in. Let's set up your team profile.",
          });
          navigate("/team/register");
        }
      }
    };
    checkSession();
  }, [navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validate input with zod
    const validation = loginSchema.safeParse(formData);
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      toast({
        title: "Validation Error",
        description: firstError.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      await signIn(validation.data.email, validation.data.password);

      // Verify role immediately after login
      const team = await getCurrentTeam();
      if (!team) {
        await supabase.auth.signOut();
        throw new Error("This account is not registered as a Team.");
      }

      toast({
        title: "Welcome back!",
        description: "Logged in successfully",
      });
      navigate("/team/dashboard");
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Login failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl">Team Login</CardTitle>
          </div>
          <CardDescription>
            Login to manage your team and scrims
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="team@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Don't have a team?{" "}
            <Link to="/team/register" className="text-primary hover:underline">
              Register here
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamLogin;
