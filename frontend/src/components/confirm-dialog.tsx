import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

type ConfirmProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  body: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  isPending?: boolean;
};

/** Every destructive or irreversible action in the system uses this modal shape */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  body,
  confirmLabel = "Confirm",
  destructive = false,
  onConfirm,
  isPending = false,
}: ConfirmProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl border-rule bg-surface p-6 shadow-panel sm:max-w-md">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-lg font-semibold tracking-tight text-ink">
            {title}
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed text-slate">
            {body}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-6 flex flex-col-reverse sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className="rounded-xl border-rule text-slate hover:bg-slate-50"
          >
            Cancel
          </Button>
          <Button
            variant={destructive ? "destructive" : "default"}
            onClick={onConfirm}
            disabled={isPending}
            className="gap-1.5 rounded-xl font-medium"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isPending ? "Working..." : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
