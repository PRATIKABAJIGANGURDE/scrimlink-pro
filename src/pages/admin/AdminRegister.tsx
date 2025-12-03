import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { signUpAdmin, signOut } from "@/lib/storage";
import { Shield, ArrowLeft } from "lucide-react";

const AdminRegister = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        signOut();
    }, []);

    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await signUpAdmin(formData.email, formData.password);

            toast({
                title: "Admin Registered",
                description: "Account created successfully. You are now an admin.",
            });
            navigate("/admin");
        } catch (error: any) {
            console.error(error);
            toast({
                title: "Registration failed",
                description: error.message || "Something went wrong",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <Card className="w-full max-w-md border-destructive/50">
                <CardHeader>
                    <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Home
                    </Link>
                    <div className="flex items-center gap-2 mb-2">
                        <Shield className="h-6 w-6 text-destructive" />
                        <CardTitle className="text-2xl">Create Admin Account</CardTitle>
                    </div>
                    <CardDescription className="text-destructive">
                        Warning: This page allows creating admin accounts.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="admin@example.com"
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

                        <Button type="submit" className="w-full" variant="destructive" disabled={loading}>
                            {loading ? "Creating Account..." : "Create Admin Account"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminRegister;
