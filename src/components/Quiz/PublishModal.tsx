import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Check, Share2 } from "lucide-react";
import { PublishSettings } from "./types";
import React, { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { ShareQuizModal } from "./ShareQuizModal";

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPublish: (secretKey: string, techStack?: any[]) => Promise<void>;
  quizId: string;
  settings: PublishSettings;
  onSettingsChange: (settings: PublishSettings) => void;
  isPublishing: boolean;
  origin: string;
  onCopyLink: () => void;
  isPublished?: boolean;
  quizPublicLink?: string;
  companyId?: string;
  techStack?: any[];
}

type PublishedQuizData = {
  quiz_public_link: string;
  quiz_key: string;
  tech_stack?: Array<{ name: string; weight: number }>;
};

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
  isPublished = false,
  quizPublicLink,
  companyId,
  techStack = []
}: PublishModalProps) {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [localSecretKey, setLocalSecretKey] = useState(settings.secretKey || '');
  const [publishedQuizData, setPublishedQuizData] = useState<PublishedQuizData | null>(null);
  const [isPublishingLocal, setIsPublishingLocal] = useState(false);

  // Sync local state with props when settings change
  React.useEffect(() => {
    setLocalSecretKey(settings.secretKey || '');
  }, [settings.secretKey]);

  // Reset share modal state when main modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setIsShareModalOpen(false);
      setPublishedQuizData(null);
      setIsPublishingLocal(false);
    }
  }, [isOpen]);

  const handleCopy = () => {
    navigator.clipboard.writeText(quizLink);
    onCopyLink();
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleShareClick = () => {
    setIsShareModalOpen(true);
  };

  const handlePublish = async () => {
    // Prevent multiple clicks
    if (isPublishingLocal) {
      return;
    }

    setIsPublishingLocal(true);

    try {
      // Ensure the secret key is properly set in settings before publishing
      const updatedSettings = {
        ...settings,
        secretKey: localSecretKey.trim(),
        isSecretKeyRequired: localSecretKey.trim().length > 0
      };
      onSettingsChange(updatedSettings);

      // Call the publish handler and wait for it to complete, passing the tech stack
      await onPublish(localSecretKey.trim(), techStack);

      // Fetch the published quiz data with proper headers
      const headers = new Headers({
        'Content-Type': 'application/json'
      });

      // Add company ID to headers if available
      if (companyId) {
        headers.append('x-company-id', companyId);
      }

      const response = await fetch(`/api/publish/${companyId || 'user'}/${quizId}`, {
        headers
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const quizKey = data.data.quiz_key || localSecretKey.trim();
          const techStack = data.data.tech_stack || [];

          // If we have a public link from the API, use it, otherwise construct it
          let publicLink = data.data.quiz_public_link;
          if (!publicLink) {
            publicLink = `${origin}/${companyId}/take/quiz/${quizId}`;
          }

          setPublishedQuizData({
            quiz_public_link: publicLink,
            quiz_key: quizKey,
            tech_stack: techStack
          });
        }
      } else {
        setIsPublishingLocal(false);
        // Fallback to the generated link if there's an error
        setPublishedQuizData({
          quiz_public_link: `${origin}/${companyId}/take/quiz/${quizId}`,
          quiz_key: localSecretKey.trim(),
          tech_stack: techStack || []
        });
      }
    } catch (error) {
      console.error('Error in handlePublish:', error);
      // Fallback to the generated link if there's an error
      setPublishedQuizData({
        quiz_public_link: `${origin}/${companyId}/take/quiz/${quizId}`,
        quiz_key: localSecretKey.trim(),
        tech_stack: techStack || []
      });
    } finally {
      setIsPublishingLocal(false);
    }
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

  const getMinDateTime = () => {
    const now = new Date();
    return now.toISOString().slice(0, 16);
  };

  const { user } = useUser();
  // Use first name for consistency with the database and remove any spaces
  const slug = (user?.firstName?.trim() as string).toLowerCase().replace(/\s+/g, '');
  
  // Create a single source of truth for the quiz link
  const quizLink = companyId 
    ? `${origin}/${companyId}/take/quiz/${quizId}`
    : `${origin}/quiz/${quizId}`;

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
                value={origin ? quizLink : 'Loading...'}
                className="flex-1 border-0 bg-transparent text-white text-xs h-9 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              <Button
              type="button"
              variant="outline"
              onClick={handleCopy}
              disabled={isCopied}
              className="text-white border-blue-600 hover:bg-blue-800/50 hover:border-blue-500 h-9 text-sm"
            >
              {isCopied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
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

        <DialogFooter className="pt-4 flex flex-col sm:flex-row gap-2">
          {isPublished ? (
            <Button
              type="button"
              onClick={handleShareClick}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share Quiz
            </Button>
          ) : (
            <>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={isPublishing || isPublishingLocal}
                className="text-white border-blue-600 hover:bg-blue-800/50 hover:border-blue-500 h-9 text-sm"
              >
                Cancel
              </Button>
              <Button 
                type="button" 
                onClick={handlePublish}
                disabled={isPublishing || isPublishingLocal || (settings.isSecretKeyRequired && !localSecretKey.trim())}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {(isPublishing || isPublishingLocal) ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Publishing...
                  </>
                ) : 'Publish Quiz'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
      
      {/* Share Quiz Modal - Use the public link from the API if available, otherwise fallback to generated link */}
      {isShareModalOpen && (
        <ShareQuizModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          quizLink={publishedQuizData?.quiz_public_link || `${origin}/${companyId}/take/quiz/${quizId}`}
          quizKey={publishedQuizData?.quiz_key || localSecretKey}
        />
      )}
    </Dialog>
  );
}