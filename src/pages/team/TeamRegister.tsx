import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { signUpTeam, generateJoinCode } from "@/lib/storage";
import { teamRegisterSchema } from "@/lib/validations";
import { Trophy, ArrowLeft, Check } from "lucide-react";

const TeamRegister = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [formData, setFormData] = useState({
    teamName: "",
    email: "",
    password: "",
    confirmPassword: "",
    country: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validate input with zod
    const validation = teamRegisterSchema.safeParse(formData);
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
      const code = generateJoinCode();
      await signUpTeam(
        validation.data.email,
        validation.data.password,
        validation.data.teamName,
        code,
        validation.data.country
      );

      setShowSuccess(true);
      toast({
        title: "Registration successful!",
        description: "Please check your email to verify your account.",
      });
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
            <Button className="w-full" variant="outline" onClick={() => navigate("/team/login")}>
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
            <Trophy className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl">Register Team</CardTitle>
          </div>
          <CardDescription>
            Create your team account to start managing scrims
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="teamName">Team Name</Label>
              <Input
                id="teamName"
                placeholder="Enter team name"
                value={formData.teamName}
                onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
                required
              />
            </div>

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
              <Label htmlFor="country">Country (Optional)</Label>
              <Input
                id="country"
                placeholder="Enter country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              />
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
              {loading ? "Creating Team..." : "Create Team"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have a team?{" "}
            <Link to="/team/login" className="text-primary hover:underline">
              Login here
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamRegister;
