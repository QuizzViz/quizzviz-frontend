import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Check } from "lucide-react";
import { PublishSettings } from "./types";
import React from "react";
import { useUser } from "@clerk/nextjs";

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPublish: (secretKey: string) => void;
  quizId: string;
  settings: PublishSettings;
  onSettingsChange: (settings: PublishSettings) => void;
  isPublishing: boolean;
  origin: string;
  onCopyLink: () => void;
  isPublished?: boolean;
}

export function PublishModal({
  isOpen,
  onClose,
  onPublish,
  quizId,
  settings,
  onSettingsChange,
  isPublishing,
  origin,
  onCopyLink,
  isPublished = false
}: PublishModalProps) {
  const [isCopied, setIsCopied] = React.useState(false);
  const [localSecretKey, setLocalSecretKey] = React.useState(settings.secretKey || '');

  // Sync local state with props when settings change
  React.useEffect(() => {
    setLocalSecretKey(settings.secretKey || '');
  }, [settings.secretKey]);

  const handleCopy = () => {
    onCopyLink();
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handlePublish = () => {
    // Ensure the secret key is properly set in settings before publishing
    const updatedSettings = {
      ...settings,
      secretKey: localSecretKey.trim(),
      isSecretKeyRequired: localSecretKey.trim().length > 0
    };
    onSettingsChange(updatedSettings);
    onPublish(localSecretKey.trim());
  };

  const handleSettingChange = <K extends keyof PublishSettings>(
    key: K,
    value: PublishSettings[K]
  ) => {
    onSettingsChange({
      ...settings,
      [key]: value
    });
  };

  const handleSecretKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalSecretKey(value); // Update local state immediately
    handleSettingChange("secretKey", value);
    handleSettingChange("isSecretKeyRequired", value.trim().length > 0);
  };

  // Convert date string to datetime-local format
  const formatDateTimeLocal = (dateStr: string) => {
    if (!dateStr) {
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 7);
      return defaultDate.toISOString().slice(0, 16);
    }
    // If it's just a date, append default time
    if (dateStr.length === 10) {
      return `${dateStr}T23:59`;
    }
    return dateStr;
  };

  // Get minimum datetime (current time)
  const getMinDateTime = () => {
    const now = new Date();
    return now.toISOString().slice(0, 16);
  };

  const { user } = useUser();
  const slug = (user?.firstName as string).trim().replace(" ", "").toLowerCase();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md bg-gray-950 border-gray-800/50 shadow-2xl backdrop-blur-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            Publish Quiz
          </DialogTitle>
          <p className="text-xs text-gray-200">
            Configure settings and share with participants
          </p>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Quiz Link Section */}
          <div className="space-y-2">
            <Label htmlFor="quizLink" className="text-sm font-medium text-white">
              Quiz Link
            </Label>
            <div className="flex items-stretch rounded-md border border-blue-600/60 bg-slate-800/80 overflow-hidden hover:border-blue-500/70 transition-colors">
              <Input
                id="quizLink"
                readOnly
                value={origin ? `${origin}/${slug}/take/quiz/${quizId}` : 'Loading...'}
                className="flex-1 border-0 bg-transparent text-white text-xs h-9 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-9 px-3 text-white hover:bg-blue-700/50 border-l border-blue-600/60 rounded-none shrink-0"
                onClick={handleCopy}
                disabled={!origin || isPublishing}
              >
                {isCopied ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>

          {/* Quiz Key Section */}
          <div className="space-y-2">
            <Label htmlFor="secretKey" className="text-sm font-medium text-white">
              Set Quiz Key <span className="text-red-400">*</span>
            </Label>
            <input
              id="secretKey"
              type="text"
              value={localSecretKey}
              onChange={handleSecretKeyChange}
              placeholder="Enter a secret key"
              className="w-full px-3 py-2 bg-slate-800/80 border border-blue-600/60 rounded-md text-white placeholder:text-blue-300/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 h-9 text-sm hover:border-blue-500/70 transition-colors disabled:opacity-50"
              disabled={isPublishing}
              required
              autoComplete="off"
            />
          </div>

          {/* Time Settings - Inline */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="timeLimit" className="text-sm font-medium text-white">
                Time Limit (in minutes)
              </Label>
              <Input
                id="timeLimit"
                type="number"
                min="1"
                value={settings.timeLimit}
                onChange={(e) => 
                  handleSettingChange("timeLimit", Number(e.target.value) || 30)
                }
                className="bg-slate-800/80 border-blue-600/60 text-white focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:border-blue-400 h-9 text-sm hover:border-blue-500/70 transition-colors"
                disabled={isPublishing}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="maxAttempts" className="text-sm font-medium text-white">
                Max Attempts
              </Label>
              <Input
                id="maxAttempts"
                type="number"
                min="1"
                value={settings.maxAttempts}
                onChange={(e) => 
                  handleSettingChange("maxAttempts", Number(e.target.value) || 1)
                }
                className="bg-slate-800/80 border-blue-600/60 text-white focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:border-blue-400 h-9 text-sm hover:border-blue-500/70 transition-colors"
                disabled={isPublishing}
              />
            </div>
          </div>

          {/* Expiration DateTime */}
          <div className="space-y-2">
            <Label htmlFor="expirationDate" className="text-sm font-medium text-white">
              Expiration Date & Time
            </Label>
            <div className="relative">
              <Input
                id="expirationDate"
                type="datetime-local"
                value={formatDateTimeLocal(settings.expirationDate)}
                min={getMinDateTime()}
                onChange={(e) => 
                  handleSettingChange("expirationDate", e.target.value || '')
                }
                className="bg-slate-800/80 border-blue-600/60 text-white focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:border-blue-400 h-9 text-sm hover:border-blue-500/70 transition-colors [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-datetime-edit-fields-wrapper]:text-white/90"
                disabled={isPublishing}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 pt-4 border-t border-blue-700/50 mt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
            disabled={isPublishing}
            className="text-white border-blue-600 hover:bg-blue-800/50 hover:border-blue-500 h-9 text-sm"
          >
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={handlePublish}
            disabled={isPublishing || (settings.isSecretKeyRequired && !localSecretKey.trim())}
            className={`w-full ${isPublished ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
          >
            {isPublishing ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {isPublished ? 'Updating...' : 'Publishing...'}
              </>
            ) : isPublished ? (
              'Update Quiz Settings'
            ) : (
              'Publish Quiz'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}