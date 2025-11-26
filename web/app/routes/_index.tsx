import { useSearchParams, useNavigate } from "react-router";
import type { Route } from "./+types/_index";
import { useToast } from "@/lib/use-toast";
import { useEffect, useRef } from "react";
import { Hero } from "@/components/landing/Hero";
import { ProblemSolution } from "@/components/landing/ProblemSolution";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Features } from "@/components/landing/Features";
import { Pricing } from "@/components/landing/Pricing";
import { TrustSignals } from "@/components/landing/TrustSignals";
import { FinalCTA } from "@/components/landing/FinalCTA";

export const meta = () => {
  const title = "Idrobe | AI Personal Stylist & Digital Closet";
  const description = "Turn your closet into a curated wardrobe. Idrobe uses AI to organize your clothes, plan daily outfits, and help you rediscover your personal style.";
  const url = "https://idrobe-web.vercel.app/";
  const image = "https://idrobe-web.vercel.app/og-image.png";
  
  return [
    { title },
    { name: "description", content: description },
    
    // Open Graph
    { property: "og:type", content: "website" },
    { property: "og:url", content: url },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:image", content: image },
    
    // Twitter
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: image },
  ];
};

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
    <main className="min-h-screen bg-background">
      <Hero />
      <ProblemSolution />
      <HowItWorks />
      <Features />
      <Pricing />
      <TrustSignals />
      <FinalCTA />
    </main>
  );
}
