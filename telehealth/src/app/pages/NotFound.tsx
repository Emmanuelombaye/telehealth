import { Link } from "react-router";
import { Activity, ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/shared";

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        <div className="h-20 w-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Activity className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-6xl font-extrabold text-primary mb-2">404</h1>
        <h2 className="text-xl font-bold mb-3">Page Not Found</h2>
        <p className="text-muted-foreground text-sm mb-8">The page you're looking for doesn't exist or has been moved.</p>
        <Link to="/">
          <Button className="rounded-full px-8 gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
