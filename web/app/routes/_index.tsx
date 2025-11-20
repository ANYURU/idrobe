import { Link, useSearchParams, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import type { Route } from "./+types/_index";
import { useToast } from "@/lib/use-toast";
import { useEffect, useRef } from "react";

export async function loader({ request }: Route.LoaderArgs) {
  const { requireGuest } = await import("@/lib/protected-route");
  await requireGuest(request);
  return null;
}

export default function LandingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const hasShownToast = useRef(false);

  useEffect(() => {
    const toastType = searchParams.get("toast");
    if (toastType === "account_deleted" && !hasShownToast.current) {
      hasShownToast.current = true;
      toast.success(
        "Account deletion initiated. You have 30 days to recover your account."
      );
      navigate("/", { replace: true });
    }
  }, [searchParams, navigate, toast]);
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 sm:text-6xl">
          Your Smart Wardrobe Assistant
        </h1>
        <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
          Organize your clothing, get AI-powered outfit recommendations, and
          never wonder what to wear again.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Button size="lg">
            <Link to="/auth/signup">Get Started Free</Link>
          </Button>
          <Button variant="outline" size="lg">
            <Link to="/auth/login">Sign In</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
