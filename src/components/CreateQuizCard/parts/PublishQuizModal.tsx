import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Check, Clock, Calendar, Key, Link as LinkIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@clerk/nextjs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

interface PublishQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  quizId: string;
  onPublish: (settings: {
    secretKey: string;
    timeLimit: number;
    maxAttempts: number;
    expirationDate: string;
    publicLink: string;
  }) => Promise<void>;
  isPublishing: boolean;
}

export function PublishQuizModal({
  isOpen,
  onClose,
  quizId,
  onPublish,
  isPublishing,
}: PublishQuizModalProps) {
  const [secretKey, setSecretKey] = useState("");
  const [timeLimit, setTimeLimit] = useState<number>(30);
  const [maxAttempts, setMaxAttempts] = useState<number>(1);
  const [expirationDate, setExpirationDate] = useState<string>("");
  const [expirationTime, setExpirationTime] = useState<string>("23:59");
  const [hasCopied, setHasCopied] = useState(false);
  const { toast } = useToast();
  const { user } = useUser();

  // Format username to be URL-friendly
  const userSlug = (user?.username || user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] || 'user')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-') // Replace special chars with dash
    .replace(/-+/g, '-')          // Replace multiple dashes with single dash
    .replace(/^-+|-+$/g, '');     // Remove leading/trailing dashes

  // Set default expiration to 7 days from now
  useEffect(() => {
    if (!expirationDate) {
      const date = new Date();
      date.setDate(date.getDate() + 7);
      setExpirationDate(date.toISOString().split('T')[0]);
    }
  }, [expirationDate]);

  // Generate the correct quiz link format
  const quizLink = `${window.location.origin}/${userSlug}/take/quiz/${quizId}`;
  
  // Ensure the URL is properly formatted
  const formatQuizLink = (link: string) => {
    // Remove any duplicate slashes and ensure proper formatting
    return link.replace(/([^:]\/)\/+/g, '$1').replace(/\/$/, '');
  };
  
  const formattedQuizLink = formatQuizLink(quizLink);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(formattedQuizLink);
    setHasCopied(true);
    toast({
      title: "Link copied to clipboard!",
      description: "Share this link with your participants.",
    });

    setTimeout(() => {
      setHasCopied(false);
    }, 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!secretKey.trim()) {
      toast({
        title: "Secret Key Required",
        description: "Please enter a secret key for your quiz.",
        variant: "destructive",
      });
      return;
    }

    // Combine date and time for expiration
    const expirationDateTime = expirationDate
      ? new Date(`${expirationDate}T${expirationTime}`).toISOString()
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    await onPublish({
      secretKey: secretKey.trim(),
      timeLimit,
      maxAttempts,
      expirationDate: expirationDateTime,
      publicLink: formattedQuizLink // Ensure the formatted link is sent to the API
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] bg-white dark:bg-gray-900 p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">
            Publish Quiz
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            Configure your quiz settings before publishing
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {/* Quiz Link Section - NO CHECKBOX HERE */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="quizLink" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Quiz Link
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 h-8 px-2"
                onClick={handleCopyLink}
              >
                {hasCopied ? (
                  <Check className="h-3.5 w-3.5 mr-1" />
                ) : (
                  <Copy className="h-3.5 w-3.5 mr-1" />
                )}
                {hasCopied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
            <div className="relative">
              <Input
                readOnly
                value={formattedQuizLink}
                className="flex-1 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700 font-mono text-sm"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <LinkIcon className="h-4 w-4 text-gray-400" />
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Share this link with participants to take the quiz
            </p>
          </div>

          {/* Secret Key Section - NO CHECKBOX HERE EITHER */}
          <div className="space-y-2">
            <Label htmlFor="secretKey" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Secret Key
            </Label>
            <div className="relative">
              <Input
                id="secretKey"
                type="text"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                placeholder="Enter a secret key that participants will use to access the quiz"
                className="pl-10 bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 h-10"
                required
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Key className="h-4 w-4 text-gray-400" />
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Participants will need this key to access the quiz
            </p>
          </div>

          {/* Time Limit and Max Attempts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Time Limit */}
            <div className="space-y-2">
              <Label htmlFor="timeLimit" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Time Limit (minutes)
              </Label>
              <div className="relative">
                <Input
                  id="timeLimit"
                  type="number"
                  min="1"
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(Number(e.target.value) || 30)}
                  className="pl-10 bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 h-10"
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Clock className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Max Attempts */}
            <div className="space-y-2">
              <Label htmlFor="maxAttempts" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Max Attempts
              </Label>
              <div className="relative">
                <Input
                  id="maxAttempts"
                  type="number"
                  min="1"
                  value={maxAttempts}
                  onChange={(e) => setMaxAttempts(Number(e.target.value) || 1)}
                  className="pl-10 bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 h-10"
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Expiration Date & Time */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Expiration Date & Time
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Input
                  id="expirationDate"
                  type="date"
                  value={expirationDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setExpirationDate(e.target.value)}
                  className="pl-10 bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 h-10"
                  required
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Calendar className="h-4 w-4 text-gray-400" />
                </div>
              </div>
              <div className="relative">
                <Input
                  id="expirationTime"
                  type="time"
                  value={expirationTime}
                  onChange={(e) => setExpirationTime(e.target.value)}
                  className="pl-10 bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 h-10"
                  required
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Clock className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              The quiz will be automatically closed after this date and time
            </p>
          </div>

          <DialogFooter className="mt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose} 
              disabled={isPublishing}
              className="px-6 h-10"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isPublishing}
              className="px-6 h-10 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isPublishing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Publishing...
                </>
              ) : 'Publish Quiz'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}