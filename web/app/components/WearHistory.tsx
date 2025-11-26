import { use, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";
import { WearHistoryModal } from "./WearHistoryModal";

interface WearHistoryProps {
  wearHistoryPromise: Promise<{ history: any[]; totalCount: number }>;
  itemId: string;
}

export function WearHistory({ wearHistoryPromise, itemId }: WearHistoryProps) {
  const { history, totalCount } = use(wearHistoryPromise);
  const [showModal, setShowModal] = useState(false);

  if (totalCount === 0) return null;

  const mostRecent = history[0];
  const wornDate = new Date(mostRecent.worn_date);
  const createdAt = new Date(mostRecent.created_at);
  const isToday = wornDate.toDateString() === new Date().toDateString();

  return (
    <>
      <div className="bg-muted/30 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">Wear History</h2>
          <p className="text-sm text-muted-foreground">
            {totalCount} {totalCount === 1 ? 'time' : 'times'} total
          </p>
        </div>
        
        {/* Most Recent Wear */}
        <div className="flex items-center justify-between py-2 border-b">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Calendar className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">
                {wornDate.toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric',
                  year: 'numeric'
                })}
                {isToday && (
                  <span className="text-muted-foreground font-normal ml-2">
                    {createdAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </span>
                )}
              </p>
              {mostRecent.occasion_name && (
                <p className="text-xs text-muted-foreground capitalize">{mostRecent.occasion_name}</p>
              )}
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">Most Recent</Badge>
        </div>

        {/* View All Button */}
        {totalCount > 1 && (
          <Button
            // variant="outline"
            size="sm"
            className="w-full mt-4"
            onClick={() => setShowModal(true)}
          >
            View All History ({totalCount - 1} more)
          </Button>
        )}
      </div>

      <WearHistoryModal 
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        itemId={itemId}
      />
    </>
  );
}