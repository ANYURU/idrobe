import { useState, useEffect } from "react";
import { useFetcher } from "react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface WearHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
}

export function WearHistoryModal({ isOpen, onClose, itemId }: WearHistoryModalProps) {
  const fetcher = useFetcher<any>();
  const [limit, setLimit] = useState(20);

  useEffect(() => {
    if (isOpen && !fetcher.data) {
      fetcher.load(`/api/items/wear-history?itemId=${itemId}&limit=${limit}`);
    }
  }, [isOpen, itemId]);

  const handleLoadMore = () => {
    const newLimit = limit + 20;
    setLimit(newLimit);
    fetcher.load(`/api/items/wear-history?itemId=${itemId}&limit=${newLimit}`);
  };

  const history = fetcher.data?.history || [];
  const totalCount = fetcher.data?.totalCount || 0;
  const isLoading = fetcher.state === 'loading' && !fetcher.data;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Complete Wear History</DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex-1 space-y-3 pr-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-2">
                <Skeleton className="w-6 h-6 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-20 mb-1" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {history.map((entry: any, idx: number) => {
              const wornDate = new Date(entry.worn_date);
              const createdAt = new Date(entry.created_at);
              const isToday = wornDate.toDateString() === new Date().toDateString();
              
              return (
                <div key={entry.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <Calendar className="h-3 w-3 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {wornDate.toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                        {isToday && (
                          <span className="text-muted-foreground font-normal ml-2 text-xs">
                            {createdAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                          </span>
                        )}
                      </p>
                      {entry.occasion_name && (
                        <p className="text-xs text-muted-foreground capitalize">{entry.occasion_name}</p>
                      )}
                    </div>
                  </div>
                  {idx === 0 && (
                    <Badge variant="secondary" className="text-xs">Latest</Badge>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!isLoading && history.length < totalCount && (
          <div className="pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleLoadMore}
              disabled={fetcher.state !== 'idle'}
            >
              {fetcher.state !== 'idle' ? 'Loading...' : `Load More (${totalCount - history.length} remaining)`}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}