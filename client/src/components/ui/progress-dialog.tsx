import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

interface ProgressDialogProps {
  open: boolean;
  title: string;
  progress: number;
}

export function ProgressDialog({ open, title, progress }: ProgressDialogProps) {
  const [showProgress, setShowProgress] = useState(progress);

  useEffect(() => {
    // Animate progress change
    const timer = setTimeout(() => {
      setShowProgress(progress);
    }, 100);

    return () => clearTimeout(timer);
  }, [progress]);

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md">
        <div className="flex flex-col items-center justify-center py-6 space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <h3 className="text-lg font-semibold text-center">{title}</h3>
          <div className="w-full max-w-xs">
            <Progress value={showProgress} className="transition-all duration-300" />
          </div>
          <p className="text-sm text-muted-foreground text-center">
            {showProgress}% Complete
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
