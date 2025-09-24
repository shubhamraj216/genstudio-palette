import { useState } from "react";
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
  CheckCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthMode = 'login' | 'signup' | 'forgot-password' | 'guest';

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      if (mode === 'signup') {
        if (formData.password !== formData.confirmPassword) {
          setError("Passwords don't match");
          return;
        }
        toast({
          title: "Account Created",
          description: "Check your inbox to verify your email address.",
        });
      } else if (mode === 'login') {
        toast({
          title: "Welcome back!",
          description: "You've been successfully logged in.",
        });
        onClose();
      } else if (mode === 'forgot-password') {
        toast({
          title: "Reset Link Sent",
          description: "Check your email for password reset instructions.",
        });
        setMode('login');
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = () => {
    setIsLoading(true);
    // Simulate OAuth
    setTimeout(() => {
      toast({
        title: "Welcome!",
        description: "You've been successfully signed in with Google.",
      });
      setIsLoading(false);
      onClose();
    }, 1000);
  };

  const handleGuestMode = () => {
    toast({
      title: "Guest Mode",
      description: "You have 5 free generations remaining.",
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary mx-auto mb-4">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
            <h2 className="text-2xl font-semibold">
              {mode === 'login' && "Welcome back"}
              {mode === 'signup' && "Create account"}
              {mode === 'forgot-password' && "Reset password"}
              {mode === 'guest' && "Try as guest"}
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              {mode === 'login' && "Sign in to your account to continue"}
              {mode === 'signup' && "Get started with your free account"}
              {mode === 'forgot-password' && "Enter your email to reset your password"}
              {mode === 'guest' && "Limited to 5 generations per session"}
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Guest Mode */}
          {mode === 'guest' ? (
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
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setMode('signup')}
                >
                  Create Account
                </Button>
                <Button 
                  variant="gradient" 
                  className="flex-1"
                  onClick={handleGuestMode}
                >
                  Continue as Guest
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* OAuth Button */}
              <Button
                variant="outline"
                className="w-full"
                onClick={handleGoogleAuth}
                disabled={isLoading}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      disabled={isLoading}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                {mode !== 'forgot-password' && (
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        disabled={isLoading}
                        className="pl-10 pr-10"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                )}

                {mode === 'signup' && (
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        disabled={isLoading}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                )}

                <Button 
                  type="submit" 
                  variant="gradient" 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                      Processing...
                    </div>
                  ) : (
                    <>
                      {mode === 'login' && "Sign In"}
                      {mode === 'signup' && "Create Account"}
                      {mode === 'forgot-password' && "Send Reset Link"}
                    </>
                  )}
                </Button>
              </form>

              {/* Footer Links */}
              <div className="space-y-2 text-center">
                {mode === 'login' && (
                  <>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => setMode('forgot-password')}
                      className="p-0 h-auto text-sm"
                    >
                      Forgot password?
                    </Button>
                    <p className="text-sm text-muted-foreground">
                      Don't have an account?{" "}
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => setMode('signup')}
                        className="p-0 h-auto text-sm"
                      >
                        Sign up
                      </Button>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Or{" "}
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => setMode('guest')}
                        className="p-0 h-auto text-sm"
                      >
                        try as guest
                      </Button>
                    </p>
                  </>
                )}

                {mode === 'signup' && (
                  <p className="text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => setMode('login')}
                      className="p-0 h-auto text-sm"
                    >
                      Sign in
                    </Button>
                  </p>
                )}

                {mode === 'forgot-password' && (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => setMode('login')}
                    className="p-0 h-auto text-sm"
                  >
                    Back to sign in
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}