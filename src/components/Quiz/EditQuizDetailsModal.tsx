import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { convertQuizExpirationToUTC } from "@/utils/quizTimezoneUtils";

interface EditQuizDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  quizId: string;
  companyId?: string;
  initialSecretKey: string;
  initialMaxAttempts: number;
  initialExpirationDate: string | null | undefined;
}

const toDateTimeLocalValue = (utcIso: string | null | undefined) => {
  if (!utcIso) return "";
  const d = new Date(utcIso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const getMinDateTime = () => {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
};

export function EditQuizDetailsModal({
  isOpen,
  onClose,
  quizId,
  companyId,
  initialSecretKey,
  initialMaxAttempts,
  initialExpirationDate,
}: EditQuizDetailsModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [secretKey, setSecretKey] = useState(initialSecretKey || "");
  const [maxAttempts, setMaxAttempts] = useState(initialMaxAttempts || 1);
  const [expirationDate, setExpirationDate] = useState(toDateTimeLocalValue(initialExpirationDate));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSecretKey(initialSecretKey || "");
      setMaxAttempts(initialMaxAttempts || 1);
      setExpirationDate(toDateTimeLocalValue(initialExpirationDate));
      setError(null);
    }
  }, [isOpen, initialSecretKey, initialMaxAttempts, initialExpirationDate]);

  const hasChanges =
    secretKey.trim() !== (initialSecretKey || "").trim() ||
    Number(maxAttempts) !== Number(initialMaxAttempts || 1) ||
    expirationDate !== toDateTimeLocalValue(initialExpirationDate);

  const handleSave = async () => {
    if (!companyId) {
      setError("Missing company information. Please refresh and try again.");
      return;
    }
    if (!expirationDate) {
      setError("Please choose an expiration date and time.");
      return;
    }
    if (!maxAttempts || maxAttempts < 1) {
      setError("Max attempts must be at least 1.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/publish/${companyId}/${quizId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quiz_key: secretKey.trim(),
          max_attempts: Number(maxAttempts),
          quiz_expiration_time: convertQuizExpirationToUTC(expirationDate),
        }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || "Failed to update quiz details");
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["publishedQuiz", quizId] }),
        queryClient.invalidateQueries({ queryKey: ["quizzes", companyId] }),
        queryClient.invalidateQueries({ queryKey: ["publishedQuizzes", companyId] }),
      ]);

      toast({
        title: "Quiz details updated",
        description: "The secret key, expiration, and max attempts are now live for candidates.",
        className: "cursor-pointer border-green-600/60 bg-green-700 text-green-100 shadow-lg shadow-green-600/30",
      });

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSaving && onClose()}>
      <DialogContent className="max-w-md bg-gray-950 border-gray-800/50 shadow-2xl backdrop-blur-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-blue-400" />
            Edit Quiz Details
          </DialogTitle>
          <p className="text-xs text-gray-400">
            Update the secret key, expiration, and max attempts for this published quiz.
          </p>
        </DialogHeader>

        {error && (
          <div className="border border-red-500/40 bg-red-500/10 text-red-300 rounded-md p-3 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="editSecretKey" className="text-sm font-medium text-white">
              Secret Key
            </Label>
            <Input
              id="editSecretKey"
              type="text"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              placeholder="Leave empty for a public quiz"
              autoComplete="off"
              className="bg-slate-800/80 border-blue-600/60 text-white placeholder:text-blue-300/50 focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:border-blue-400 h-9 text-sm hover:border-blue-500/70 transition-colors"
              disabled={isSaving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="editMaxAttempts" className="text-sm font-medium text-white">
              Max Attempts
            </Label>
            <Input
              id="editMaxAttempts"
              type="number"
              min={1}
              value={maxAttempts}
              onChange={(e) => setMaxAttempts(Number(e.target.value) || 1)}
              className="bg-slate-800/80 border-blue-600/60 text-white focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:border-blue-400 h-9 text-sm hover:border-blue-500/70 transition-colors"
              disabled={isSaving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="editExpirationDate" className="text-sm font-medium text-white">
              Expiration Date & Time
            </Label>
            <Input
              id="editExpirationDate"
              type="datetime-local"
              value={expirationDate}
              min={getMinDateTime()}
              onChange={(e) => setExpirationDate(e.target.value)}
              className="cursor-pointer bg-slate-800/80 border-blue-600/60 text-white focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:border-blue-400 h-9 text-sm hover:border-blue-500/70 transition-colors [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-datetime-edit-fields-wrapper]:text-white/90"
              disabled={isSaving}
            />
          </div>
        </div>

        <DialogFooter className="pt-4 flex flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
            className="text-white border-blue-600 hover:bg-blue-800/50 hover:border-blue-500 h-9 text-sm"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
