import { Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Travel } from "@/app/types/Travel";

interface TravelCardActionsProps {
  canEdit: boolean;
  onEdit: (travel: Travel) => void;
  onDelete: () => void;
}

export function TravelCardActions({
  canEdit,
  onEdit,
  onDelete,
}: TravelCardActionsProps) {
  if (!canEdit) return null;

  return (
    <div className="absolute top-2 right-2 z-10 flex gap-1">
      <Button
        variant="ghost"
        size="sm"
        className="p-2 h-8 w-8 text-muted-foreground hover:text-primary transition-colors"
        onClick={onEdit}
        aria-label="Edit Travel"
      >
        <Edit className="h-4 w-4" aria-hidden="true" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        className="p-2 h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
        onClick={onDelete}
        aria-label="Delete Travel"
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
      </Button>
    </div>
  );
}
