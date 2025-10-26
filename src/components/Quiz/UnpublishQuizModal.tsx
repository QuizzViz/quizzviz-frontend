import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface UnpublishQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function UnpublishQuizModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}: UnpublishQuizModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-zinc-950 border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl">Unpublish Quiz</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Are you sure you want to unpublish this quiz? The quiz will no longer be accessible to others.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isLoading}
            className="hover:bg-zinc-800"
          >
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700"
          >
            {isLoading ? 'Unpublishing...' : 'Yes, Unpublish'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
