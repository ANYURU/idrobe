import { Button } from "@/components/ui/button";
import { CheckCheck } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface WearTrackingButtonProps {
  onMarkAsWorn: () => void;
  disabled?: boolean;
  variant?: "desktop" | "mobile";
}

export function WearTrackingButton({
  onMarkAsWorn,
  disabled = false,
  variant = "desktop",
}: WearTrackingButtonProps) {
  const isMobile = variant === "mobile";

  const button = (
    <Button
      onClick={onMarkAsWorn}
      disabled={disabled}
      size="icon"
      className={isMobile ? "shadow-lg" : ""}
    >
      <CheckCheck className="h-4 w-4" />
    </Button>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent>
          <p>Wore This Today</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
