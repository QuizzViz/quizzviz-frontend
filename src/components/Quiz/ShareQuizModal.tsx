import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check, Link as LinkIcon, X, Key } from "lucide-react";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface ShareQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  quizLink: string;
  quizKey: string;
}

export function ShareQuizModal({ isOpen, onClose, quizLink, quizKey }: ShareQuizModalProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Ensure the quiz link is properly formatted
  const formattedQuizLink = quizLink.startsWith('http') ? quizLink : `${window.location.origin}${quizLink.startsWith('/') ? '' : '/'}${quizLink}`;

  const handleCopy = async (text: string, type: 'link' | 'key') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      
      // Show toast notification
      toast({
        title: type === 'link' ? 'Link copied!' : 'Key copied!',
        description: type === 'link' 
          ? 'The quiz link has been copied to your clipboard.'
          : 'The access key has been copied to your clipboard.',
        className: "border-green-600/20 bg-green-800 text-green-100",
      });
      
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      toast({
        title: 'Failed to copy',
        description: 'Please try again or copy manually.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md bg-gray-900 border border-gray-700/50 rounded-lg shadow-xl">
        <div className="space-y-4">
          <DialogTitle className="text-lg font-semibold text-white mb-2">Share Quiz</DialogTitle>
          
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-300 mb-2">Quiz Link</p>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={formattedQuizLink}
                  className="bg-gray-800/50 border-gray-600/50 text-gray-100 text-sm h-9 flex-1 font-mono text-xs"
                />
                <Button
                  size="sm"
                  variant={copied === 'link' ? 'default' : 'outline'}
                  onClick={() => handleCopy(formattedQuizLink, 'link')}
                  className="h-9 px-3"
                >
                  {copied === 'link' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {quizKey && (
              <div>
                <p className="text-sm text-gray-300 mb-2">Access Key</p>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={quizKey}
                    className="bg-gray-800/50 border-gray-600/50 text-gray-100 text-sm h-9 flex-1"
                  />
                  <Button
                    size="sm"
                    variant={copied === 'key' ? 'default' : 'outline'}
                    onClick={() => handleCopy(quizKey, 'key')}
                    className="h-9 px-3"
                  >
                    {copied === 'key' ? <Check className="h-4 w-4" /> : <Key className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Share this key only with authorized participants</p>
                <p className="text-xs text-gray-600 mt-1">Participants will need both the link and this key to access the quiz</p>
              </div>
            )}

            {!quizKey && (
              <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded-md text-center">
                <p className="text-sm text-blue-300">This quiz is publicly accessible</p>
                <p className="text-xs text-blue-400/80 mt-1">Anyone with the link can take the quiz</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
