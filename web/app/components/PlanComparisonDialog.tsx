import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Check, Zap, Crown, Sparkles } from "lucide-react";
import { useFetcher } from "react-router";
import { useToast } from "@/lib/use-toast";
import { useEffect, useRef } from "react";

type Plan = {
  id: string;
  name: string;
  price: number;
  currency: string;
  billing_interval: string;
  description: string | null;
};

type PlanLimit = {
  plan_id: string;
  limit_type: string;
  limit_value: number;
};

type PlanComparisonDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plans: Plan[];
  planLimits: PlanLimit[];
  currentPlanId?: string;
};

export function PlanComparisonDialog({
  open,
  onOpenChange,
  plans,
  planLimits,
  currentPlanId,
}: PlanComparisonDialogProps) {
  const fetcher = useFetcher();
  const toast = useToast();
  const lastProcessedData = useRef<any>(null);

  // Handle fetcher responses with toast notifications
  useEffect(() => {
    if (fetcher.data && fetcher.data !== lastProcessedData.current) {
      lastProcessedData.current = fetcher.data;
      
      if (fetcher.data.error) {
        toast.error(fetcher.data.error);
      }
      if (fetcher.data.success) {
        toast.success("Your plan has been updated successfully.");
        onOpenChange(false);
      }
    }
  }, [fetcher.data, toast, onOpenChange]);

  const getLimit = (planId: string, limitType: string) => {
    const limit = planLimits.find(
      (l) => l.plan_id === planId && l.limit_type === limitType
    );
    return limit?.limit_value === -1 ? "Unlimited" : limit?.limit_value || 0;
  };

  const getPlanIcon = (planName: string) => {
    if (planName.includes("Pro")) return Crown;
    if (planName.includes("Premium")) return Sparkles;
    return Zap;
  };

  const sortedPlans = [...plans].sort((a, b) => a.price - b.price);

  // Debug logging
  console.log('PlanComparisonDialog Debug:', {
    currentPlanId,
    plans: plans.map(p => ({ id: p.id, name: p.name, price: p.price })),
    sortedPlans: sortedPlans.map(p => ({ id: p.id, name: p.name, price: p.price }))
  });

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="h-full w-full sm:w-[90vw] lg:w-[60vw] xl:w-[50vw] ml-auto">
        <DrawerHeader className="border-b px-6 py-4">
          <DrawerTitle className="text-xl font-semibold">Choose Your Plan</DrawerTitle>
          <DrawerDescription className="text-sm text-muted-foreground">
            Select the plan that best fits your needs
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex flex-wrap gap-6">
            {sortedPlans.map((plan) => {
              const Icon = getPlanIcon(plan.name);
              const isCurrent = plan.id === currentPlanId || (!currentPlanId && plan.price === 0);
              const isPopular = plan.name.includes("Premium");
              
              console.log(`Plan ${plan.name}:`, {
                planId: plan.id,
                currentPlanId,
                isCurrent,
                price: plan.price
              });

              return (
                <div
                  key={plan.id}
                  className={`relative border rounded-lg p-6 transition-all hover:shadow-sm flex-1 min-w-[250px] ${
                    isPopular ? "border-primary shadow-md" : "border-border"
                  } ${isCurrent ? "bg-muted/30" : "bg-card"}`}
                >
                  {isPopular && (
                    <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs">
                      Most Popular
                    </Badge>
                  )}
                  
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2 rounded-lg ${
                      isPopular ? "bg-primary/10" : "bg-muted"
                    }`}>
                      <Icon className={`w-5 h-5 ${
                        isPopular ? "text-primary" : "text-muted-foreground"
                      }`} />
                    </div>
                    <h3 className="font-semibold text-lg">{plan.name}</h3>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-3xl font-bold">
                        {plan.currency === "USD" ? "$" : plan.currency}
                        {plan.price}
                      </span>
                      <span className="text-muted-foreground">
                        /{plan.billing_interval}
                      </span>
                    </div>
                    {plan.description && (
                      <p className="text-sm text-muted-foreground">
                        {plan.description}
                      </p>
                    )}
                  </div>

                  <ul className="space-y-3 mb-6">
                    <li className="flex items-center gap-3">
                      <Check className="w-4 h-4 text-green-600 shrink-0" />
                      <span className="text-sm">
                        {getLimit(plan.id, "uploads")} uploads/month
                      </span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="w-4 h-4 text-green-600 shrink-0" />
                      <span className="text-sm">
                        {getLimit(plan.id, "recs")} recommendations/week
                      </span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="w-4 h-4 text-green-600 shrink-0" />
                      <span className="text-sm">
                        {getLimit(plan.id, "tryons")} try-ons/month
                      </span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="w-4 h-4 text-green-600 shrink-0" />
                      <span className="text-sm">
                        {getLimit(plan.id, "storage")} GB storage
                      </span>
                    </li>
                  </ul>

                  <Button
                    className={`w-full ${
                      isPopular && !isCurrent ? "bg-primary hover:bg-primary/90" : ""
                    } ${isCurrent ? "cursor-not-allowed" : ""}`}
                    variant={isCurrent ? "outline" : isPopular ? "default" : "outline"}
                    disabled={isCurrent || fetcher.state === "submitting"}
                    onClick={isCurrent ? undefined : () => {
                      if (plan.price === 0) {
                        // Free plan - no checkout needed
                        return;
                      }
                      const formData = new FormData();
                      formData.append("planId", plan.id);
                      fetcher.submit(formData, {
                        method: "POST",
                        action: "/api/create-checkout",
                      });
                    }}
                  >
                    {isCurrent
                      ? "✓ Current Plan"
                      : plan.price === 0
                        ? "Select Free Plan"
                        : fetcher.state === "submitting"
                          ? "Processing..."
                          : "Upgrade Now"}
                  </Button>
                </div>
              );
            })}
          </div>


        </div>
      </DrawerContent>
    </Drawer>
  );
}
