import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface FavoriteButtonProps {
  onToggleFavorite: () => void;
  isFavorite: boolean;
  disabled?: boolean;
  variant?: "desktop" | "mobile";
}

export function FavoriteButton({
  onToggleFavorite,
  isFavorite,
  disabled = false,
  variant = "desktop",
}: FavoriteButtonProps) {
  const isMobile = variant === "mobile";

  const button = (
    <Button
      variant={isFavorite ? "default" : "outline"}
      onClick={onToggleFavorite}
      disabled={disabled}
      size="icon"
      className={
        isMobile
          ? `shadow-lg bg-background ${isFavorite ? "text-destructive" : ""}`
          : ""
      }
    >
      <Heart className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
    </Button>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent>
          <p>{isFavorite ? "Remove from Favorites" : "Add to Favorites"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
