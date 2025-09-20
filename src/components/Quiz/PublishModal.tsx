import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Copy, Check } from "lucide-react";
import { PublishSettings } from "./types";
import React from "react";

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPublish: () => void;
  quizId: string;
  settings: PublishSettings;
  onSettingsChange: (settings: PublishSettings) => void;
  isPublishing: boolean;
  origin: string;
  onCopyLink: () => void;
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
  onCopyLink
}: PublishModalProps) {
  const [isCopied, setIsCopied] = React.useState(false);

  const handleCopy = () => {
    onCopyLink();
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[560px] bg-zinc-900/95 border-white/10 shadow-2xl backdrop-blur supports-[backdrop-filter]:backdrop-blur-md">
        <DialogHeader>
          <DialogTitle className="text-white tracking-tight">Publish Quiz</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="rounded-lg border border-white/10 bg-zinc-800/40 p-4 transition-colors hover:border-white/20">
            <Label htmlFor="quizLink" className="text-white">Quiz Link</Label>
            <div className="flex mt-1">
              <Input
                id="quizLink"
                readOnly
                value={origin ? `${origin}/quiz/take/${quizId}` : 'Loading...'}
                className="rounded-r-none bg-zinc-800 border-white/10 text-white focus-visible:ring-2 focus-visible:ring-blue-600"
              />
              <Button
                type="button"
                variant="outline"
                className="rounded-l-none border-l-0 bg-zinc-800 hover:bg-zinc-700 text-white transition-colors"
                onClick={handleCopy}
                disabled={!origin || isPublishing}
              >
                {isCopied ? (
                  <span className="inline-flex items-center gap-2"><Check className="h-4 w-4" /> Copied</span>
                ) : (
                  <span className="inline-flex items-center gap-2"><Copy className="h-4 w-4" /> Copy</span>
                )}
              </Button>
            </div>
            <div aria-live="polite" className="min-h-[1.25rem] mt-1">
              <p className="text-xs text-white/50">
                {isCopied ? 'Link copied to clipboard' : 'Share this link with participants to take the quiz'}
              </p>
            </div>
          </div>

          <div className="space-y-4 pt-2 rounded-lg border border-white/10 bg-zinc-800/40 p-4 transition-colors hover:border-white/20">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="requireSecretKey" 
                checked={settings.isSecretKeyRequired}
                onCheckedChange={(checked) => 
                  handleSettingChange("isSecretKeyRequired", checked === true)
                }
                className="border-white/30 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                disabled={isPublishing}
              />
              <Label htmlFor="requireSecretKey" className="text-white font-normal">
                Require a secret key to access this quiz
              </Label>
            </div>
            
            {settings.isSecretKeyRequired && (
              <div className="pl-6">
                <Label htmlFor="secretKey" className="text-white">
                  Secret Key
                </Label>
                <Input
                  id="secretKey"
                  type="text"
                  value={settings.secretKey}
                  onChange={(e) => handleSettingChange("secretKey", e.target.value)}
                  placeholder="Enter a secret key"
                  className="mt-1 bg-zinc-800 border-white/10 text-white focus-visible:ring-2 focus-visible:ring-blue-600"
                  disabled={isPublishing}
                />
                <p className="text-xs text-white/50 mt-1">
                  Participants will need to enter this key to access the quiz
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-lg border border-white/10 bg-zinc-800/40 p-4">
            <div>
              <Label htmlFor="timeLimit" className="text-white">
                Time Limit (minutes)
              </Label>
              <Input
                id="timeLimit"
                type="number"
                min="1"
                value={settings.timeLimit}
                onChange={(e) => 
                  handleSettingChange("timeLimit", Number(e.target.value) || 30)
                }
                className="mt-1 bg-zinc-800 border-white/10 text-white focus-visible:ring-2 focus-visible:ring-blue-600"
                disabled={isPublishing}
              />
            </div>
            
            <div>
              <Label htmlFor="maxAttempts" className="text-white">
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
                className="mt-1 bg-zinc-800 border-white/10 text-white focus-visible:ring-2 focus-visible:ring-blue-600"
                disabled={isPublishing}
              />
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-zinc-800/40 p-4">
            <Label htmlFor="expirationDate" className="text-white">
              Expiration Date
            </Label>
            <Input
              id="expirationDate"
              type="date"
              value={settings.expirationDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => 
                handleSettingChange(
                  "expirationDate", 
                  e.target.value || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                )
              }
              className="mt-1 bg-zinc-800 border-white/10 text-white focus-visible:ring-2 focus-visible:ring-blue-600"
              disabled={isPublishing}
            />
            <p className="text-xs text-white/50 mt-1">
              The quiz will be automatically closed after this date
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-3">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
            disabled={isPublishing}
            className="text-white border-white/20 hover:bg-zinc-800"
          >
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={onPublish}
            disabled={isPublishing || (settings.isSecretKeyRequired && !settings.secretKey.trim())}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isPublishing ? "Publishing..." : "Publish Quiz"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
