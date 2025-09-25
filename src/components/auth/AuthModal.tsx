// src/components/auth/AuthModal.tsx
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "login" | "signup" | "forgot-password" | "guest";
}

type AuthMode = "login" | "signup" | "forgot-password" | "guest";

export default function AuthModal({ isOpen, onClose, initialMode }: AuthModalProps) {
  const { user, login, signup, guest } = useAuth();
  const [mode, setMode] = useState<AuthMode>(initialMode ?? "login");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
  });

  useEffect(() => {
    if (isOpen && initialMode) setMode(initialMode);
    if (!isOpen) {
      // reset on close
      setFormData({ email: "", password: "", confirmPassword: "", firstName: "", lastName: "" });
      setError("");
      setShowPassword(false);
      setIsLoading(false);
    }
  }, [isOpen, initialMode]);

  useEffect(() => {
    // if user becomes available (signed in elsewhere) auto-close modal
    if (user && isOpen) {
      onClose();
    }
  }, [user, isOpen, onClose]);

  const setField = (k: keyof typeof formData, v: string) => {
    setFormData(prev => ({ ...prev, [k]: v }));
    if (error) setError("");
  };

  const handleSignup = async () => {
    if (!formData.email) return setError("Email is required");
    if (!formData.firstName) return setError("First name required");
    if (!formData.lastName) return setError("Last name required");
    if (!formData.password) return setError("Password is required");
    if (formData.password !== formData.confirmPassword) return setError("Passwords do not match");

    setIsLoading(true);
    setError("");
    try {
      await signup(formData.email, formData.password, formData.firstName, formData.lastName);
      toast({ title: "Account Created", description: "You're signed in." });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!formData.email) return setError("Email is required");
    if (!formData.password) return setError("Password is required");

    setIsLoading(true);
    setError("");
    try {
      await login(formData.email, formData.password);
      toast({ title: "Welcome back!", description: "You're signed in." });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuest = async () => {
    setIsLoading(true);
    setError("");
    try {
      await guest();
      toast({ title: "Guest Mode", description: "Limited quota available." });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgot = async () => {
    if (!formData.email) return setError("Email is required");
    setIsLoading(true);
    setError("");
    try {
      // backend expects JSON string body (we match existing API)
      const res = await fetch(`https://python-genai.railway.internal/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData.email),
      });
      const text = await res.text();
      if (!res.ok) throw new Error(text || "Request failed");
      // server may return reset token for testing
      try {
        const parsed = JSON.parse(text || "{}");
        if (parsed.reset_token) {
          toast({ title: "Reset Link Sent", description: `Reset token: ${parsed.reset_token}` });
        } else {
          toast({ title: "Reset Link Sent", description: "Check your email." });
        }
      } catch {
        toast({ title: "Reset Link Sent", description: "Check your email." });
      }
      setMode("login");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError("");
    if (mode === "signup") return await handleSignup();
    if (mode === "login") return await handleLogin();
    if (mode === "forgot-password") return await handleForgot();
    if (mode === "guest") return await handleGuest();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <div className="space-y-6">
          <div className="text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary mx-auto mb-4">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
            <h2 className="text-2xl font-semibold">
              {mode === "login" && "Welcome back"}
              {mode === "signup" && "Create account"}
              {mode === "forgot-password" && "Reset password"}
              {mode === "guest" && "Try as guest"}
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              {mode === "login" && "Sign in to your account to continue"}
              {mode === "signup" && "Get started with your free account"}
              {mode === "forgot-password" && "Enter your email to reset your password"}
              {mode === "guest" && "Limited to 5 generations per session"}
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {mode === "guest" ? (
            <div className="space-y-4">
              <Card className="p-4 bg-muted/50">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-warning/20">
                    <AlertCircle className="h-4 w-4 text-warning" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Limited Access</p>
                    <p className="text-xs text-muted-foreground">5 generations per session</p>
                  </div>
                </div>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  <li>• Basic image generation</li>
                  <li>• No download history</li>
                  <li>• No cloud storage</li>
                </ul>
              </Card>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setMode("signup")} disabled={isLoading}>
                  Create Account
                </Button>
                <Button variant="gradient" className="flex-1" onClick={handleGuest} disabled={isLoading}>
                  Continue as Guest
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/*<Button variant="outline" className="w-full" onClick={() => toast({ title: "Not configured", description: "OAuth not configured." })} disabled={isLoading}>*/}
              {/*  Continue with Google*/}
              {/*</Button>*/}

              {/*<div className="relative">*/}
              {/*  <div className="absolute inset-0 flex items-center">*/}
              {/*    <Separator />*/}
              {/*  </div>*/}
              {/*  <div className="relative flex justify-center text-xs uppercase">*/}
              {/*    <span className="bg-background px-2 text-muted-foreground">Or continue with</span>*/}
              {/*  </div>*/}
              {/*</div>*/}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="email" type="email" placeholder="Enter your email" value={formData.email} onChange={(e) => setField("email", e.target.value)} disabled={isLoading} className="pl-10" required />
                  </div>
                </div>

                {mode === "signup" && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="firstName">First name</Label>
                      <Input id="firstName" placeholder="First" value={formData.firstName} onChange={(e) => setField("firstName", e.target.value)} disabled={isLoading} />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last name</Label>
                      <Input id="lastName" placeholder="Last" value={formData.lastName} onChange={(e) => setField("lastName", e.target.value)} disabled={isLoading} />
                    </div>
                  </div>
                )}

                {mode !== "forgot-password" && (
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input id="password" type={showPassword ? "text" : "password"} placeholder="Enter your password" value={formData.password} onChange={(e) => setField("password", e.target.value)} disabled={isLoading} className="pl-10 pr-10" required />
                      <Button type="button" variant="ghost" size="sm" className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                )}

                {mode === "signup" && (
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input id="confirmPassword" type={showPassword ? "text" : "password"} placeholder="Confirm your password" value={formData.confirmPassword} onChange={(e) => setField("confirmPassword", e.target.value)} disabled={isLoading} className="pl-10" required />
                    </div>
                  </div>
                )}

                <Button type="submit" variant="gradient" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                      Processing...
                    </div>
                  ) : (
                    <>
                      {mode === "login" && "Sign In"}
                      {mode === "signup" && "Create Account"}
                      {mode === "forgot-password" && "Send Reset Link"}
                    </>
                  )}
                </Button>
              </form>

              <div className="space-y-2 text-center">
                {mode === "login" && (
                  <>
                    <Button variant="link" size="sm" onClick={() => setMode("forgot-password")} className="p-0 h-auto text-sm">Forgot password?</Button>
                    <p className="text-sm text-muted-foreground">Don't have an account? <Button variant="link" size="sm" onClick={() => setMode("signup")} className="p-0 h-auto text-sm">Sign up</Button></p>
                    <p className="text-sm text-muted-foreground">Or <Button variant="link" size="sm" onClick={() => setMode("guest")} className="p-0 h-auto text-sm">try as guest</Button></p>
                  </>
                )}

                {mode === "signup" && (
                  <p className="text-sm text-muted-foreground">Already have an account? <Button variant="link" size="sm" onClick={() => setMode("login")} className="p-0 h-auto text-sm">Sign in</Button></p>
                )}

                {mode === "forgot-password" && (
                  <Button variant="link" size="sm" onClick={() => setMode("login")} className="p-0 h-auto text-sm">Back to sign in</Button>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
