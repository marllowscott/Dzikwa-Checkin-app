import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Home, AlertCircle } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
          <Card className="w-full max-w-md p-8 bg-gradient-card shadow-elevation rounded-[7px] text-center">
            <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-[7px] flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-4">404</h1>
            <p className="text-xl text-muted-foreground mb-6">Oops! Page not found</p>
            <p className="text-sm text-muted-foreground mb-6">
              The page you're looking for doesn't exist or has been moved.
            </p>
            <Link to="/">
              <Button className="flex items-center gap-2">
                <Home className="w-4 h-4" />
                Return to Home
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
