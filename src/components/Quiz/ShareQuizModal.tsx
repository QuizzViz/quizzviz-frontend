import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check, Link as LinkIcon, X, Key } from "lucide-react";
import React, { useState } from "react";
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
  const formattedQuizLink = React.useMemo(() => {
    if (!quizLink) return '';
    // If it's already a full URL, return as is
    if (quizLink.startsWith('http')) return quizLink;
    // Otherwise, prepend the current origin
    return `${window.location.origin}${quizLink.startsWith('/') ? '' : '/'}${quizLink}`;
  }, [quizLink]);

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

  const isPrivate = !!quizKey;
  const statusColor = isPrivate ? 'amber' : 'blue';
  const statusIcon = isPrivate ? (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  ) : (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md bg-gray-900/95 backdrop-blur-sm border border-gray-700/50 rounded-xl shadow-xl p-0 overflow-hidden">
        {/* Header */}
        <div className={`p-5 border-b border-gray-700/50 bg-gradient-to-r ${
          isPrivate 
            ? 'from-amber-900/30 to-amber-900/10' 
            : 'from-blue-900/30 to-blue-900/10'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              isPrivate 
                ? 'bg-amber-900/30 text-amber-400' 
                : 'bg-blue-900/30 text-blue-400'
            }`}>
              {statusIcon}
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-white">
                {isPrivate ? 'Private Quiz' : 'Public Quiz'}
              </DialogTitle>
              <p className="text-sm text-gray-400">
                {isPrivate 
                  ? 'Share both link and key with participants' 
                  : 'Anyone with the link can take this quiz'}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4 p-5">
          {/* Quiz Link */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">Quiz Link</label>
            
            {formattedQuizLink ? (
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={formattedQuizLink}
                  className="bg-gray-800/60 border-gray-600/40 text-gray-100 text-sm h-10 flex-1 font-mono text-xs hover:border-gray-500/50 transition-colors"
                />
                <Button
                  size="sm"
                  variant={copied === 'link' ? 'default' : 'outline'}
                  onClick={() => handleCopy(formattedQuizLink, 'link')}
                  className="h-10 w-10 p-0 flex items-center justify-center"
                  title="Copy link"
                >
                  {copied === 'link' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(formattedQuizLink, '_blank', 'noopener,noreferrer')}
                  className="h-10 w-10 p-0 flex items-center justify-center"
                  title="Open in new tab"
                >
                  <LinkIcon className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="h-10 flex items-center justify-center bg-gray-800/30 rounded-md border border-dashed border-gray-700/50">
                <span className="text-sm text-gray-400">Loading quiz link...</span>
              </div>
            )}
          </div>

          {/* Access Key */}
          {isPrivate && (
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Access Key</label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={quizKey}
                  className="bg-gray-800/60 border-amber-500/30 text-amber-100 text-sm h-10 flex-1 font-mono text-xs"
                />
                <Button
                  size="sm"
                  variant={copied === 'key' ? 'default' : 'outline'}
                  onClick={() => handleCopy(quizKey, 'key')}
                  className="h-10 w-10 p-0 flex items-center justify-center"
                  title="Copy key"
                >
                  {copied === 'key' ? <Check className="h-4 w-4" /> : <Key className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-gray-400 mt-2 px-1">
                Share this key <span className="text-amber-300">only with authorized participants</span>
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
