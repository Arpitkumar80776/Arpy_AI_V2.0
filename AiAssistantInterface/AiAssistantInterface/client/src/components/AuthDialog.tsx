import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Mail, Lock, UserPlus, LogIn } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAuthSuccess: (user: any) => void;
  neonColor: string;
}

export function AuthDialog({ open, onOpenChange, onAuthSuccess, neonColor }: AuthDialogProps) {
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [signupData, setSignupData] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const { toast } = useToast();

  const loginMutation = useMutation({
    mutationFn: async (data: { username: string; password: string }) => {
      return apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data) => {
      // Store auth data immediately
      if (data.user && data.token) {
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('token', data.token);
      }

      toast({
        title: "Welcome back!",
        description: "Successfully logged in to Arpy AI V2.0!",
      });

      // Call success callback with data
      onAuthSuccess(data);
    },
    onError: (error: any) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (data: { username: string; email: string; password: string }) => {
      return apiRequest('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data) => {
      // Store auth data immediately
      if (data.user && data.token) {
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('token', data.token);
      }
      onAuthSuccess(data);
      toast({
        title: "Account created!",
        description: "Welcome to Arpy AI V2.0!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Signup failed",
        description: error.message || "Could not create account",
        variant: "destructive",
      });
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginData.username || !loginData.password) {
      toast({
        title: "Missing fields",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }
    loginMutation.mutate(loginData);
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupData.username || !signupData.email || !signupData.password) {
      toast({
        title: "Missing fields",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }
    if (signupData.password !== signupData.confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }
    signupMutation.mutate({
      username: signupData.username,
      email: signupData.email,
      password: signupData.password,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-morphism border-white/20 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold bg-gradient-to-r bg-clip-text text-transparent"
            style={{
              background: `linear-gradient(135deg, ${neonColor}, rgba(255,255,255,0.8))`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
            Join Arpy AI V2.0
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="login" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 glass-morphism">
            <TabsTrigger value="login" className="flex items-center space-x-2">
              <LogIn className="w-4 h-4" />
              <span>Login</span>
            </TabsTrigger>
            <TabsTrigger value="signup" className="flex items-center space-x-2">
              <UserPlus className="w-4 h-4" />
              <span>Sign Up</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-username" className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>Username</span>
                </Label>
                <Input
                  id="login-username"
                  type="text"
                  placeholder="Enter your username"
                  value={loginData.username}
                  onChange={(e) => setLoginData(prev => ({ ...prev, username: e.target.value }))}
                  className="glass-morphism border-white/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password" className="flex items-center space-x-2">
                  <Lock className="w-4 h-4" />
                  <span>Password</span>
                </Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="Enter your password"
                  value={loginData.password}
                  onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                  className="glass-morphism border-white/20"
                />
              </div>
              <Button
                type="submit"
                className="w-full glass-morphism hover:bg-white/20"
                style={{ borderColor: neonColor }}
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? 'Logging in...' : 'Login'}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-username" className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>Username</span>
                </Label>
                <Input
                  id="signup-username"
                  type="text"
                  placeholder="Choose a username"
                  value={signupData.username}
                  onChange={(e) => setSignupData(prev => ({ ...prev, username: e.target.value }))}
                  className="glass-morphism border-white/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-email" className="flex items-center space-x-2">
                  <Mail className="w-4 h-4" />
                  <span>Email</span>
                </Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="Enter your email"
                  value={signupData.email}
                  onChange={(e) => setSignupData(prev => ({ ...prev, email: e.target.value }))}
                  className="glass-morphism border-white/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password" className="flex items-center space-x-2">
                  <Lock className="w-4 h-4" />
                  <span>Password</span>
                </Label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="Create a password"
                  value={signupData.password}
                  onChange={(e) => setSignupData(prev => ({ ...prev, password: e.target.value }))}
                  className="glass-morphism border-white/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="flex items-center space-x-2">
                  <Lock className="w-4 h-4" />
                  <span>Confirm Password</span>
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirm your password"
                  value={signupData.confirmPassword}
                  onChange={(e) => setSignupData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="glass-morphism border-white/20"
                />
              </div>
              <Button
                type="submit"
                className="w-full glass-morphism hover:bg-white/20"
                style={{ borderColor: neonColor }}
                disabled={signupMutation.isPending}
              >
                {signupMutation.isPending ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}