// Simplified hierarchy version - replace notes/tags/stats sections with this

{/* Notes */}
{item.notes && (
  <div className="space-y-2">
    <p className="text-sm font-medium text-muted-foreground">Notes</p>
    <p className="text-foreground leading-relaxed">{item.notes}</p>
  </div>
)}

{/* Style Tags */}
{Array.isArray(item.style_tags) && item.style_tags.length > 0 && (
  <div className="space-y-2">
    <p className="text-sm font-medium text-muted-foreground">Style</p>
    <div className="flex flex-wrap gap-2">
      {item.style_tags.map((tag: any) => (
        <Badge key={tag.style_tag?.id || tag.id} variant="secondary">
          {tag.style_tag?.name || tag.name}
        </Badge>
      ))}
    </div>
  </div>
)}

{/* Wear Stats - Simplified */}
<div className="space-y-3">
  <p className="text-sm font-medium text-muted-foreground">Wear Stats</p>
  <div className="grid grid-cols-3 gap-4">
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <TrendingUp className="h-3.5 w-3.5" />
        <p className="text-xs">Worn</p>
      </div>
      <p className="text-2xl font-semibold">{item.times_worn || 0}</p>
    </div>
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Clock className="h-3.5 w-3.5" />
        <p className="text-xs">Last</p>
      </div>
      <p className="text-2xl font-semibold">
        {daysSinceWorn !== null ? `${daysSinceWorn}d` : "—"}
      </p>
    </div>
    {item.cost && (
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <DollarSign className="h-3.5 w-3.5" />
          <p className="text-xs">CPW</p>
        </div>
        <p className="text-2xl font-semibold">
          {costPerWear ? `$${costPerWear}` : `$${item.cost}`}
        </p>
      </div>
    )}
  </div>
</div>

{/* Details - Simplified */}
<div className="space-y-3">
  <p className="text-sm font-medium text-muted-foreground">Details</p>
  <div className="grid grid-cols-2 gap-x-6 gap-y-3">
    {item.size && (
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">Size</p>
        <p className="font-medium">{item.size}</p>
      </div>
    )}
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">Color</p>
      <div className="flex flex-wrap gap-1">
        <Badge variant="outline">{item.primary_color}</Badge>
      </div>
    </div>
    {Array.isArray(item.material) && item.material.length > 0 && (
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">Material</p>
        <p className="font-medium text-sm">{item.material.slice(0, 2).join(", ")}</p>
      </div>
    )}
    {item.pattern && (
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">Pattern</p>
        <p className="font-medium capitalize">{item.pattern}</p>
      </div>
    )}
  </div>
</div>
