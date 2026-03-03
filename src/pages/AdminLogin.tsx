import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { AdminIcon } from "@/components/ui/AdminIcon";
import { supabase } from "@/lib/supabase";
import bcrypt from 'bcryptjs';

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

      // Query the admin_users table
      const { data: admin, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', email)
        .single();

      console.log('Supabase response:', { admin, error });

      if (error) {
        console.error('Supabase error:', error);

        // Check if it's a table not found error
        if (error.code === 'PGRST116' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
          toast({
            title: "Database Error",
            description: "The admins table doesn't exist. Please run the SQL schema in Supabase.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Login Failed",
            description: error.message || "Database error. Please check console.",
            variant: "destructive",
          });
        }
        setIsLoading(false);
        return;
      }

      if (!admin) {
        toast({
          title: "Login Failed",
          description: "Invalid email or password",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      console.log('Admin found:', JSON.stringify(admin));
      console.log('User password input:', password);
      console.log('Stored password hash:', admin.password_hash);

      // Use direct comparison (password is likely stored as plain text)
      const isValidPassword = password === admin.password_hash;
      console.log('Password validation (direct comparison):', isValidPassword);

      if (!isValidPassword) {
        toast({
          title: "Login Failed",
          description: "Invalid email or password",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Store admin session
      localStorage.setItem('adminToken', admin.id);
      localStorage.setItem('isAdmin', 'true');
      localStorage.setItem('adminName', admin.full_name);

      console.log('✅ Login successful!');
      console.log('Admin data:', admin);
      console.log('localStorage set:', {
        adminToken: localStorage.getItem('adminToken'),
        isAdmin: localStorage.getItem('isAdmin'),
        adminName: localStorage.getItem('adminName')
      });

      toast({
        title: "Success",
        description: `Welcome back, ${admin.full_name}!`,
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