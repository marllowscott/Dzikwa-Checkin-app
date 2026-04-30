import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { AdminIcon } from "@/components/ui/AdminIcon";
import { adminSupabase, adminManagement } from '../lib/supabase';

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Check if already logged in
  useEffect(() => {
    const isAdmin = localStorage.getItem('isAdmin');
    const adminToken = localStorage.getItem('adminToken');
    if (isAdmin === 'true' && adminToken) {
      console.log('User already logged in, redirecting to dashboard');
      navigate('/admin-dashboard', { replace: true });
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log('Attempting login with email:', email);

      // Use adminSupabase client for authentication
      const { data, error } = await adminSupabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('password_hash', password)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Login error:', error);
        toast({
          title: "Login Failed",
          description: error.message || "Invalid credentials",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (!data) {
        toast({
          title: "Login Failed",
          description: "Invalid credentials",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      console.log('✅ Login successful!');
      console.log('User data:', data);

      // Store admin session with role
      localStorage.setItem('adminToken', 'authenticated');
      localStorage.setItem('isAdmin', 'true');
      localStorage.setItem('adminEmail', data.email);
      localStorage.setItem('adminId', data.id);
      localStorage.setItem('adminName', data.email);
      localStorage.setItem('adminRole', data.role || 'admin');

      // Dispatch custom event for navigation update
      window.dispatchEvent(new Event('adminStateChange'));

      toast({
        title: "Success",
        description: data.role === 'superadmin' ? "Welcome back, Super Admin!" : "Welcome back, Admin!",
      });

      // Redirect to admin dashboard
      console.log('🔄 Navigating to /admin-dashboard...');
      navigate('/admin-dashboard');
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login Failed",
        description: "Network error. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6">
      <Card className="w-full max-w-sm sm:max-w-md p-4 sm:p-6 lg:p-8 bg-gradient-card shadow-elevation rounded-[7px]">
        <div className="text-center mb-6 sm:mb-8">
          <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-[7px] flex items-center justify-center mb-3 sm:mb-4 shadow-button">
            <AdminIcon className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">Admin Login</h2>
          <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">Access administrative controls</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 sm:space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter admin email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10 sm:h-12 text-sm sm:text-base focus:ring-2 focus:ring-primary/50 transition-all duration-200"
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-10 sm:h-12 text-sm sm:text-base focus:ring-2 focus:ring-primary/50 transition-all duration-200"
              disabled={isLoading}
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full h-10 sm:h-12 text-sm sm:text-lg font-medium"
            disabled={isLoading}
          >
            {isLoading ? "Logging in..." : "Login as Admin"}
          </Button>
        </form>


      </Card>
    </div>
  );
}