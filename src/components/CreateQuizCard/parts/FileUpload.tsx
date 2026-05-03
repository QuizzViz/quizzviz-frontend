import { useState, useCallback, useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, X, FileText, Code, FileCode, CheckCircle2, Sparkles, Eye } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import FilePreviewModal from "./FilePreviewModal";

interface UploadedFile {
  file: File;
  id: string;
  name: string;
  size: number;
  type: string;
}

interface FileUploadProps {
  value: UploadedFile[];
  onChange: (files: UploadedFile[]) => void;
  maxFiles?: number;
  accept?: string;
}

export default function FileUpload({ 
  value = [], 
  onChange, 
  maxFiles = 5,
  accept = ".txt,.md,.js,.ts,.jsx,.tsx,.py,.java,.cpp,.c,.cs,.go,.rs,.php,.rb,.swift,.kt,.scala,.pl,.hs,.m,.r,.sql,.html,.css,.json,.xml,.yaml,.yml"
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedSuccessfully, setUploadedSuccessfully] = useState(false);
  const [previewFile, setPreviewFile] = useState<UploadedFile | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, [value, maxFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  }, [value, maxFiles]);

  const handleFiles = useCallback((files: File[]) => {
    if (value.length >= maxFiles) {
      toast({
        title: "Maximum files reached",
        description: `You can only upload up to ${maxFiles} files.`,
        variant: "destructive",
      });
      return;
    }

    const validFiles = files.filter(file => {
      const isValidType = file.type === 'text/plain' || 
                        file.type === 'text/markdown' ||
                        file.type === 'text/html' ||
                        file.type === 'text/css' ||
                        file.type === 'application/json' ||
                        file.type === 'application/xml' ||
                        file.type === 'text/x-java-source' ||
                        file.type === 'text/x-c++src' ||
                        file.type === 'text/x-csrc' ||
                        file.type === 'text/x-csharp' ||
                        file.type === 'text/x-python' ||
                        file.type === 'text/x-ruby' ||
                        file.type === 'text/x-go' ||
                        file.type === 'text/x-rust' ||
                        file.type === 'text/x-php' ||
                        file.type === 'text/x-swift' ||
                        file.type === 'text/x-kotlin' ||
                        file.type === 'text/x-scala' ||
                        file.type === 'text/x-perl' ||
                        file.type === 'text/x-haskell' ||
                        file.type === 'text/x-matlab' ||
                        file.type === 'text/x-r' ||
                        file.type === 'text/x-sql' ||
                        file.name.endsWith('.js') ||
                        file.name.endsWith('.ts') ||
                        file.name.endsWith('.jsx') ||
                        file.name.endsWith('.tsx') ||
                        file.name.endsWith('.txt') ||
                        file.name.endsWith('.md') ||
                        file.name.endsWith('.py') ||
                        file.name.endsWith('.java') ||
                        file.name.endsWith('.cpp') ||
                        file.name.endsWith('.c') ||
                        file.name.endsWith('.cs') ||
                        file.name.endsWith('.go') ||
                        file.name.endsWith('.rs') ||
                        file.name.endsWith('.php') ||
                        file.name.endsWith('.rb') ||
                        file.name.endsWith('.swift') ||
                        file.name.endsWith('.kt') ||
                        file.name.endsWith('.scala') ||
                        file.name.endsWith('.pl') ||
                        file.name.endsWith('.hs') ||
                        file.name.endsWith('.m') ||
                        file.name.endsWith('.r') ||
                        file.name.endsWith('.sql') ||
                        file.name.endsWith('.html') ||
                        file.name.endsWith('.css') ||
                        file.name.endsWith('.json') ||
                        file.name.endsWith('.xml') ||
                        file.name.endsWith('.yaml') ||
                        file.name.endsWith('.yml');
      
      if (!isValidType) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not a supported file type.`,
          variant: "destructive",
        });
        return false;
      }
      
      const maxSize = 15 * 1024 * 1024; // 15MB
      if (file.size > maxSize) {
        toast({
          title: "File too large",
          description: `${file.name} is larger than 15MB.`,
          variant: "destructive",
        });
        return false;
      }
      
      return true;
    });

    const newFiles = validFiles.slice(0, maxFiles - value.length).map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type
    }));

    if (newFiles.length > 0) {
      setIsUploading(true);
      setUploadProgress(0);
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);
      
      // Complete upload after simulation
      setTimeout(() => {
        setUploadProgress(100);
        onChange([...value, ...newFiles]);
        setIsUploading(false);
        setUploadedSuccessfully(true);
        
        // Show success toast with green theme
        toast({
          title: "Files uploaded successfully!",
          description: `${newFiles.length} file(s) uploaded successfully.`,
        className: "border-green-600/60 bg-green-700 text-green-100 shadow-lg shadow-green-600/30",
        });
        
        setTimeout(() => setUploadedSuccessfully(false), 2000);
      }, 1000);
    }
  }, [value, maxFiles, onChange, toast]);

  const removeFile = useCallback((id: string) => {
    onChange(value.filter(file => file.id !== id));
    // Clear the file input to allow re-uploading the same file
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [value, onChange, fileInputRef]);

  const handleFileClick = useCallback((file: UploadedFile) => {
    setPreviewFile(file);
    setIsPreviewOpen(true);
  }, []);

  const handlePreviewClose = useCallback(() => {
    setIsPreviewOpen(false);
    setPreviewFile(null);
  }, []);

  const handleRemoveFromPreview = useCallback((fileId: string) => {
    removeFile(fileId);
    toast({
      title: "File removed",
      description: "File has been removed from the upload list.",
        className: "border-green-600/60 bg-green-700 text-green-100 shadow-lg shadow-green-600/30",
    });
  }, [removeFile, toast]);

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
        return <Code className="h-4 w-4" />;
      case 'html':
      case 'css':
      case 'json':
      case 'xml':
      case 'yaml':
      case 'yml':
      case 'sql':
        return <FileCode className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-foreground font-medium flex items-center gap-2">
          <Upload className="h-4 w-4" />
          Upload Files 
          <span className="text-red-500 ml-1">*</span>
        </Label>
        <p className="text-sm text-muted-foreground">
          Upload code files, documentation, or any text files to generate quiz questions from their content. <span className="text-red-500 font-medium">At least one file is required.</span>
        </p>
      </div>

      {/* Upload Area */}
      <Card className={cn(
        "border-2 transition-all duration-300 relative overflow-hidden",
        dragActive 
          ? 'border-green-500 bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 shadow-lg shadow-green-500/20' 
          : uploadedSuccessfully
          ? 'border-green-400 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30'
          : 'border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/30',
        isUploading && "opacity-75"
      )}>
        {uploadedSuccessfully && (
          <div className="absolute inset-0 flex items-center justify-center bg-green-500/10 backdrop-blur-sm z-10">
            <div className="flex flex-col items-center gap-2">
              <CheckCircle2 className="h-16 w-16 text-green-500 animate-pulse" />
              <span className="text-green-700 dark:text-green-400 font-medium">Upload Complete!</span>
            </div>
          </div>
        )}
        
        <CardContent className="p-8">
          <div
            className="text-center space-y-6"
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="flex justify-center">
              <div className={cn(
                "p-4 rounded-full transition-all duration-300",
                dragActive 
                  ? "bg-gradient-to-br from-green-500 to-blue-500 shadow-lg shadow-green-500/30 scale-110" 
                  : uploadedSuccessfully
                  ? "bg-gradient-to-br from-green-400 to-emerald-400 shadow-lg shadow-green-400/30"
                  : "bg-muted hover:bg-muted/80"
              )}>
                <Upload className={cn(
                  "h-8 w-8 transition-all duration-300",
                  dragActive || uploadedSuccessfully ? "text-white animate-bounce" : "text-muted-foreground"
                )} />
              </div>
            </div>
            
            <div className="space-y-3">
              <p className="text-lg font-semibold text-foreground">
                {isUploading ? "Uploading files..." : dragActive ? "Drop files here!" : "Drag & drop files here"}
              </p>
              <p className="text-sm text-muted-foreground">
                {isUploading ? "Please wait while we process your files" : "or click to browse your files"}
              </p>
            </div>
            
            <div className="flex flex-col items-center gap-4">
              <Button
                type="button"
                className={cn(
                  "px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-md",
                  dragActive || uploadedSuccessfully
                    ? "bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white border-0"
                    : "bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white border-0 hover:shadow-lg hover:shadow-green-500/25"
                )}
                onClick={() => document.getElementById('file-input')?.click()}
                disabled={value.length >= maxFiles || isUploading}
              >
                {isUploading ? (
                  <>
                    <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Select Files
                  </>
                )}
              </Button>
              
              <input
                ref={fileInputRef}
                id="file-input"
                type="file"
                multiple
                accept={accept}
                onChange={handleFileInput}
                className="hidden"
                disabled={value.length >= maxFiles || isUploading}
              />
            </div>
            
            <div className="space-y-2 text-xs text-muted-foreground">
              <p className="flex items-center justify-center gap-2">
                <span className="font-medium">Supported formats:</span>
                <span className="bg-muted/70 px-2 py-1 rounded">Code files</span>
                <span className="bg-muted/70 px-2 py-1 rounded">Text files</span>
                <span className="bg-muted/70 px-2 py-1 rounded">Config files</span>
              </p>
              <p className="flex items-center justify-center gap-4">
                <span>Max size: <strong>15MB</strong></span>
                <span>Max files: <strong>{maxFiles}</strong></span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Uploaded Files */}
      {value.length > 0 && (
        <div className="space-y-3">
          <Label className="text-foreground font-medium flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500 animate-pulse" />
            Uploaded Files ({value.length})
          </Label>
          <div className="space-y-2">
            {value.map((uploadedFile, index) => (
              <Card 
                key={uploadedFile.id} 
                className={cn(
                  "p-4 border transition-all duration-300 cursor-pointer group",
                  "hover:border-green-500/50 hover:shadow-md hover:shadow-green-500/10",
                  "animate-in slide-in-from-bottom-2 fade-in-0",
                  index === value.length - 1 && uploadedSuccessfully && "ring-2 ring-green-500/50 ring-offset-2"
                )}
                onClick={() => handleFileClick(uploadedFile)}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900/30 dark:to-blue-900/30 flex-shrink-0">
                      <div className="text-green-600 dark:text-green-400">
                        {getFileIcon(uploadedFile.name)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground truncate">
                          {uploadedFile.name}
                        </p>
                        {index === value.length - 1 && uploadedSuccessfully && (
                          <div className="flex items-center gap-1 text-green-500">
                            <CheckCircle2 className="h-3 w-3 animate-pulse" />
                            <span className="text-xs font-medium">New</span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(uploadedFile.size)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-950/20 transition-all duration-200 opacity-0 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFileClick(uploadedFile);
                      }}
                      title="Preview file"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(uploadedFile.id);
                      }}
                      className="text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-200"
                      title="Remove file"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <div className="space-y-3">
          <Label className="text-foreground font-medium flex items-center gap-2">
            <Sparkles className="h-4 w-4 animate-spin text-green-500" />
            Upload Progress
          </Label>
          <div className="space-y-2">
            <Progress 
              value={uploadProgress} 
              className="w-full h-2 bg-muted" 
            />
            <p className="text-xs text-muted-foreground text-center">
              {uploadProgress}% complete...
            </p>
          </div>
        </div>
      )}

      {/* File Preview Modal */}
      <FilePreviewModal
        isOpen={isPreviewOpen}
        onClose={handlePreviewClose}
        file={previewFile}
        onRemove={handleRemoveFromPreview}
      />
    </div>
  );
}
