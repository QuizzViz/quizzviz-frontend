import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Code, Upload, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type InputMode = 'tech_stack' | 'file_upload';

interface InputModeToggleProps {
  mode: InputMode;
  onModeChange: (mode: InputMode) => void;
  className?: string;
}

export function InputModeToggle({ mode, onModeChange, className }: InputModeToggleProps) {
  return (
    <div className={cn("relative bg-muted/50 rounded-lg p-1 border border-border/50", className)}>
      <div className="relative flex">
        {/* Sliding indicator */}
        <div 
          className={cn(
            "absolute top-1 bottom-1 rounded-md shadow-sm transition-all duration-300 ease-out bg-gradient-to-r from-green-500 to-blue-500",
            mode === 'tech_stack' 
              ? "left-1 right-[50%]" 
              : "left-[50%] right-1"
          )}
        />
        
        {/* Tech Stack Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onModeChange('tech_stack')}
          className={cn(
            "relative z-10 flex-1 transition-all duration-200",
            mode === 'tech_stack'
              ? "text-white hover:text-white/90"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          <span className="font-medium">Tech Stack</span>
        </Button>
        
        {/* File Upload Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onModeChange('file_upload')}
          className={cn(
            "relative z-10 flex-1 transition-all duration-200",
            mode === 'file_upload'
              ? "text-white hover:text-white/90"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Upload className="h-4 w-4 mr-2" />
          <span className="font-medium">File Upload</span>
        </Button>
      </div>
      
      {/* Mode Description */}
      <div className="mt-3 text-center">
        <p className="text-xs text-muted-foreground">
          {mode === 'tech_stack' 
            ? 'Select technologies to generate quiz questions from predefined topics'
            : 'Upload files to generate quiz questions from your content'
          }
        </p>
      </div>
    </div>
  );
}
