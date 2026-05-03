import { useState, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Download, Copy, FileText, Code, FileCode } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: {
    file: File;
    id: string;
    name: string;
    size: number;
    type: string;
  } | null;
  onRemove?: (fileId: string) => void;
}

export default function FilePreviewModal({ 
  isOpen, 
  onClose, 
  file, 
  onRemove 
}: FilePreviewModalProps) {
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const { toast } = useToast();

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'js':
      case 'jsx':
      case 'ts':
      case 'tsx':
      case 'py':
      case 'java':
      case 'cpp':
      case 'c':
      case 'cs':
      case 'go':
      case 'rs':
      case 'php':
      case 'rb':
      case 'swift':
      case 'kt':
      case 'scala':
      case 'pl':
      case 'hs':
      case 'm':
      case 'r':
        return <Code className="h-5 w-5" />;
      case 'html':
      case 'css':
      case 'json':
      case 'xml':
      case 'yaml':
      case 'yml':
      case 'sql':
        return <FileCode className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const getLanguageClass = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'js':
      case 'jsx':
        return 'language-javascript';
      case 'ts':
      case 'tsx':
        return 'language-typescript';
      case 'py':
        return 'language-python';
      case 'java':
        return 'language-java';
      case 'cpp':
      case 'c':
        return 'language-cpp';
      case 'cs':
        return 'language-csharp';
      case 'go':
        return 'language-go';
      case 'rs':
        return 'language-rust';
      case 'php':
        return 'language-php';
      case 'rb':
        return 'language-ruby';
      case 'swift':
        return 'language-swift';
      case 'kt':
        return 'language-kotlin';
      case 'scala':
        return 'language-scala';
      case 'pl':
        return 'language-perl';
      case 'hs':
        return 'language-haskell';
      case 'm':
        return 'language-matlab';
      case 'r':
        return 'language-r';
      case 'html':
        return 'language-html';
      case 'css':
        return 'language-css';
      case 'json':
        return 'language-json';
      case 'xml':
        return 'language-xml';
      case 'yaml':
      case 'yml':
        return 'language-yaml';
      case 'sql':
        return 'language-sql';
      case 'md':
        return 'language-markdown';
      case 'txt':
      default:
        return 'language-text';
    }
  };

  const readFileContent = useCallback(async (file: File) => {
    setIsLoading(true);
    setError('');
    
    try {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setContent(result);
        setIsLoading(false);
      };
      
      reader.onerror = () => {
        setError('Failed to read file content');
        setIsLoading(false);
      };
      
      reader.readAsText(file);
    } catch (err) {
      setError('Failed to read file content');
      setIsLoading(false);
    }
  }, []);

  const handleCopyContent = useCallback(() => {
    if (content) {
      navigator.clipboard.writeText(content).then(() => {
        toast({
          title: "Content copied to clipboard",
          description: "File content has been copied to your clipboard.",
          className: "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/50",
        });
      }).catch(() => {
        toast({
          title: "Failed to copy",
          description: "Could not copy content to clipboard.",
          variant: "destructive",
        });
      });
    }
  }, [content, toast]);

  const handleDownload = useCallback(() => {
    if (file) {
      const url = URL.createObjectURL(file.file);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [file]);

  const handleRemove = useCallback(() => {
    if (file && onRemove) {
      onRemove(file.id);
      onClose();
    }
  }, [file, onRemove, onClose]);

  useEffect(() => {
    if (isOpen && file) {
      readFileContent(file.file);
    } else {
      setContent('');
      setError('');
      setIsLoading(false);
    }
  }, [isOpen, file, readFileContent]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900/30 dark:to-blue-900/30">
              <div className="text-green-600 dark:text-green-400">
                {file && getFileIcon(file.name)}
              </div>
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">{file?.name}</DialogTitle>
              <p className="text-sm text-muted-foreground">
                {file && formatFileSize(file.size)} • {file?.type || 'Unknown type'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyContent}
              disabled={!content || isLoading}
              className="h-8"
            >
              <Copy className="h-4 w-4 mr-1" />
              Copy
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={!file}
              className="h-8"
            >
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
            {onRemove && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRemove}
                disabled={!file}
                className="h-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 border-red-200 dark:border-red-800"
              >
                <X className="h-4 w-4 mr-1" />
                Remove
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading file content...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="text-red-500 mb-4">
                  <FileText className="h-8 w-8 mx-auto" />
                </div>
                <p className="text-red-600 dark:text-red-400">{error}</p>
              </div>
            </div>
          ) : (
            <div className="h-full">
              <ScrollArea className="h-full max-h-[60vh] border rounded-lg">
                <div className="p-4">
                  {content ? (
                    <pre className={cn(
                      "text-sm leading-relaxed whitespace-pre-wrap break-words overflow-x-auto",
                      "bg-muted/30 rounded-lg p-4 font-mono min-h-full",
                      getLanguageClass(file?.name || '')
                    )}>
                      <code className="text-xs">{content}</code>
                    </pre>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No content to display
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
