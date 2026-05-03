import { useState, useCallback } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, X, FileText, Code, FileCode } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

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
      onChange([...value, ...newFiles]);
      toast({
        title: "Files uploaded",
        description: `${newFiles.length} file(s) uploaded successfully.`,
      });
    }
  }, [value, maxFiles, onChange, toast]);

  const removeFile = useCallback((id: string) => {
    onChange(value.filter(file => file.id !== id));
  }, [value, onChange]);

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
        <Label className="text-foreground font-medium">Upload Files (Optional)</Label>
        <p className="text-sm text-muted-foreground">
          Upload code files, documentation, or any text files to generate quiz questions from their content.
        </p>
      </div>

      {/* Upload Area */}
      <Card className={`border-2 transition-colors ${
        dragActive 
          ? 'border-primary bg-primary/5' 
          : 'border-dashed border-muted-foreground/25 hover:border-muted-foreground/50'
      }`}>
        <CardContent className="p-6">
          <div
            className="text-center space-y-4"
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="flex justify-center">
              <Upload className="h-12 w-12 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <p className="text-lg font-medium text-foreground">
                Drag & drop files here
              </p>
              <p className="text-sm text-muted-foreground">
                or click to browse
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById('file-input')?.click()}
              disabled={value.length >= maxFiles}
            >
              Select Files
            </Button>
            <input
              id="file-input"
              type="file"
              multiple
              accept={accept}
              onChange={handleFileInput}
              className="hidden"
              disabled={value.length >= maxFiles}
            />
            <p className="text-xs text-muted-foreground">
              Supported formats: Code files (.js, .ts, .py, .java, etc.), text files (.txt, .md), and configuration files (.json, .yaml, etc.)
              <br />
              Maximum file size: 15MB | Maximum files: {maxFiles}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Uploaded Files */}
      {value.length > 0 && (
        <div className="space-y-2">
          <Label className="text-foreground font-medium">Uploaded Files</Label>
          <div className="space-y-2">
            {value.map((uploadedFile) => (
              <Card key={uploadedFile.id} className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-muted-foreground">
                      {getFileIcon(uploadedFile.name)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {uploadedFile.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(uploadedFile.size)}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(uploadedFile.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Upload Progress (if needed) */}
      {uploadProgress > 0 && uploadProgress < 100 && (
        <div className="space-y-2">
          <Label className="text-foreground font-medium">Upload Progress</Label>
          <Progress value={uploadProgress} className="w-full" />
        </div>
      )}
    </div>
  );
}
