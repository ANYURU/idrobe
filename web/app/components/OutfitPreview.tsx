import { ClothingImageCard } from "./ClothingImageCard";

interface ClothingItem {
  id: string;
  name: string;
  image_url: string;
  primary_color: string;
}

interface OutfitPreviewProps {
  items: ClothingItem[];
  maxItems?: number;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12', 
  lg: 'w-16 h-16'
};

export function OutfitPreview({ items, maxItems = 3, size = 'md' }: OutfitPreviewProps) {
  const displayItems = items.slice(0, maxItems);
  const remainingCount = items.length - maxItems;

  return (
    <div className="flex gap-2 flex-wrap">
      {displayItems.map((item) => (
        <div key={item.id} className={`${sizeClasses[size]} rounded-lg overflow-hidden`}>
          <ClothingImageCard
            filePath={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover"
            fallbackClassName={`${sizeClasses[size]}`}
          />
        </div>
      ))}
      {remainingCount > 0 && (
        <div className={`${sizeClasses[size]} bg-muted rounded-lg flex items-center justify-center text-xs font-medium text-muted-foreground`}>
          +{remainingCount}
        </div>
      )}
    </div>
  );
}