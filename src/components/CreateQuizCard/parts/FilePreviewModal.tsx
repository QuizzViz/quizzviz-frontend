import { useCallback, useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, Download, X, FileText, Trash2, Code, FileCode, Check, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface FileItem {
  file: File;
  id: string;
  name: string;
  size: number;
  type: string;
}

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: FileItem | null;
  onRemove?: (fileId: string) => void;
}

function getFileIcon(fileName: string, size: 'sm' | 'md' = 'md') {
  const ext = fileName.split('.').pop()?.toLowerCase();
  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
  const codeExts = ['js','jsx','ts','tsx','py','java','cpp','c','cs','go','rs','php','rb','swift','kt','scala','pl','hs','m','r'];
  const markupExts = ['html','css','json','xml','yaml','yml','sql'];
  if (ext && codeExts.includes(ext)) return <Code className={iconSize} />;
  if (ext && markupExts.includes(ext)) return <FileCode className={iconSize} />;
  return <FileText className={iconSize} />;
}

function getLanguageLabel(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  const map: Record<string, string> = {
    js: 'JavaScript', jsx: 'JSX', ts: 'TypeScript', tsx: 'TSX',
    py: 'Python', java: 'Java', cpp: 'C++', c: 'C', cs: 'C#',
    go: 'Go', rs: 'Rust', php: 'PHP', rb: 'Ruby', swift: 'Swift',
    kt: 'Kotlin', scala: 'Scala', pl: 'Perl', hs: 'Haskell',
    m: 'MATLAB', r: 'R', html: 'HTML', css: 'CSS', json: 'JSON',
    xml: 'XML', yaml: 'YAML', yml: 'YAML', sql: 'SQL', md: 'Markdown', txt: 'Plain Text',
  };
  return (ext && map[ext]) || 'Text';
}

function getAccentColor(fileName: string) {
  const ext = fileName.split('.').pop()?.toLowerCase();
  const codeExts = ['js','jsx','ts','tsx','py','java','cpp','c','cs','go','rs','php','rb','swift','kt','scala','pl','hs','m','r'];
  const markupExts = ['html','css','json','xml','yaml','yml','sql'];
  if (ext && codeExts.includes(ext)) return 'green';
  if (ext && markupExts.includes(ext)) return 'blue';
  return 'slate';
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function countLines(content: string): number {
  return content.split('\n').length;
}

export default function FilePreviewModal({ isOpen, onClose, file, onRemove }: FilePreviewModalProps) {
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const readFileContent = useCallback(async (f: File) => {
    setIsLoading(true);
    setError('');
    setContent('');
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        setContent(e.target?.result as string ?? '');
        setIsLoading(false);
      };
      reader.onerror = () => {
        setError('Failed to read file. Please check if the file is a valid text file.');
        setIsLoading(false);
      };
      reader.readAsText(f);
    } catch {
      setError('Unexpected error reading file.');
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && file) {
      readFileContent(file.file);
    } else {
      setContent('');
      setError('');
      setIsLoading(false);
      setCopied(false);
    }
  }, [isOpen, file, readFileContent]);

  const handleCopy = useCallback(() => {
    if (!content) return;
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      toast({ title: 'Failed to copy', variant: 'destructive' });
    });
  }, [content, toast]);

  const handleDownload = useCallback(() => {
    if (!file) return;
    const url = URL.createObjectURL(file.file);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [file]);

  const handleRemove = useCallback(() => {
    if (file && onRemove) {
      onRemove(file.id);
      onClose();
    }
  }, [file, onRemove, onClose]);

  const accent = file ? getAccentColor(file.name) : 'slate';
  const accentClasses = {
    green: {
      iconBg: 'from-green-500 to-emerald-500',
      badge: 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20',
      copyBtn: 'border-green-500/30 hover:bg-green-500/10 hover:text-green-600 dark:hover:text-green-400 hover:border-green-500/50',
    },
    blue: {
      iconBg: 'from-blue-500 to-indigo-500',
      badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20',
      copyBtn: 'border-blue-500/30 hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-500/50',
    },
    slate: {
      iconBg: 'from-slate-500 to-slate-600',
      badge: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20',
      copyBtn: 'border-slate-500/30 hover:bg-slate-500/10 hover:text-slate-600 dark:hover:text-slate-400 hover:border-slate-500/50',
    },
  }[accent];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full h-[85vh] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl border border-border/60 shadow-2xl bg-background">
        
        {/* ── Header ── */}
        <div className="flex-shrink-0 flex items-center justify-between gap-4 px-6 py-4 border-b border-border/50 bg-muted/20">
          {/* File info */}
          <div className="flex items-center gap-3 min-w-0">
            <div className={cn(
              'flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br shadow-sm text-white',
              accentClasses.iconBg
            )}>
              {file && getFileIcon(file.name)}
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-sm font-semibold text-foreground truncate leading-tight">
                {file?.name ?? 'File Preview'}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-xs text-muted-foreground">
                  {file ? formatFileSize(file.size) : '—'}
                </span>
                {content && (
                  <>
                    <span className="text-muted-foreground/40 text-xs">·</span>
                    <span className="text-xs text-muted-foreground">
                      {countLines(content).toLocaleString()} lines
                    </span>
                  </>
                )}
                {file && (
                  <>
                    <span className="text-muted-foreground/40 text-xs">·</span>
                    <span className={cn('text-[11px] font-medium px-1.5 py-0.5 rounded-md', accentClasses.badge)}>
                      {getLanguageLabel(file.name)}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex-shrink-0 flex items-center gap-2">
            {/* Copy */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              disabled={!content || isLoading}
              className={cn(
                'h-8 px-3 text-xs font-medium transition-all duration-200 gap-1.5',
                copied
                  ? 'border-green-500/40 bg-green-500/10 text-green-600 dark:text-green-400'
                  : accentClasses.copyBtn
              )}
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied!' : 'Copy'}
            </Button>

            {/* Download */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={!file}
              className="h-8 px-3 text-xs font-medium gap-1.5 border-border/60 hover:bg-muted/60 transition-all duration-200"
            >
              <Download className="h-3.5 w-3.5" />
              Download
            </Button>

            {/* Remove */}
            {onRemove && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRemove}
                disabled={!file}
                className="h-8 px-3 text-xs font-medium gap-1.5 text-red-500 border-red-500/20 hover:bg-red-500/10 hover:border-red-500/40 hover:text-red-600 transition-all duration-200"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove
              </Button>
            )}

            {/* Close */}
            <div className="w-px h-5 bg-border/50 mx-1" />
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 rounded-lg hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-all duration-200"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* ── Content Area ── */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">Reading file…</p>
                <p className="text-xs text-muted-foreground mt-1">This will just take a moment</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 px-8">
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center">
                <AlertCircle className="h-7 w-7 text-red-500" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground mb-1">Unable to read file</p>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-sm">{error}</p>
              </div>
            </div>
          ) : !content ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center text-muted-foreground">
                <FileText className="h-6 w-6" />
              </div>
              <p className="text-sm text-muted-foreground">No content to display</p>
            </div>
          ) : (
            <div className="h-full flex flex-col">
              {/* Line numbers + code */}
              <div className="flex-1 overflow-auto">
                <div className="flex min-h-full">
                  {/* Line numbers gutter */}
                  <div
                    className="flex-shrink-0 select-none px-4 py-5 text-right bg-muted/30 border-r border-border/40"
                    aria-hidden="true"
                  >
                    {content.split('\n').map((_, i) => (
                      <div key={i} className="font-mono text-[11px] leading-5 text-muted-foreground/50 h-5">
                        {i + 1}
                      </div>
                    ))}
                  </div>

                  {/* Code content */}
                  <div className="flex-1 px-5 py-5 overflow-x-auto">
                    <pre className="font-mono text-[12.5px] leading-5 text-foreground/90 whitespace-pre">
                      <code>{content}</code>
                    </pre>
                  </div>
                </div>
              </div>

              {/* Footer status bar */}
              <div className="flex-shrink-0 flex items-center gap-4 px-5 py-2.5 border-t border-border/40 bg-muted/20">
                <span className="text-[11px] text-muted-foreground font-mono">
                  {countLines(content).toLocaleString()} lines
                </span>
                <span className="text-muted-foreground/30 text-xs">·</span>
                <span className="text-[11px] text-muted-foreground font-mono">
                  {content.length.toLocaleString()} chars
                </span>
                <span className="text-muted-foreground/30 text-xs">·</span>
                <span className="text-[11px] text-muted-foreground">
                  {getLanguageLabel(file?.name ?? '')}
                </span>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}