import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type ConfirmProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** Required on purpose: forces the caller to say what will happen, not just ask "are you sure?" */
  body: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  isPending?: boolean;
};

/** Every destructive or irreversible action in the system uses this, so the shape never varies. */
export function ConfirmDialog({
  open, onOpenChange, title, body, confirmLabel = "Confirm",
  destructive = false, onConfirm, isPending,
}: ConfirmProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{body}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant={destructive ? "destructive" : "default"}
                  onClick={onConfirm} disabled={isPending}>
            {isPending ? "Working…" : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
