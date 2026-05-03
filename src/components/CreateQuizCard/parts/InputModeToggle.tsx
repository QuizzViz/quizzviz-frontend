import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Code, Upload, BarChart3, Layers, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

export type InputMode = 'tech_stack' | 'file_upload';

interface InputModeToggleProps {
  mode: InputMode;
  onModeChange: (mode: InputMode) => void;
  className?: string;
}

export function InputModeToggle({ mode, onModeChange, className }: InputModeToggleProps) {
  return (
    <div className={cn("relative w-full z-0", className)}>
      {/* Header with icon */}
      <div className="flex items-center gap-2 mb-3">
        <Layers className="h-4 w-4 text-green-500" />
        <h3 className="text-sm font-medium text-foreground">Quiz Content Source</h3>
      </div>
      
      {/* Toggle Container */}
      <div className="relative bg-gradient-to-r from-muted/50 to-muted/30 rounded-xl p-1 border border-border/50 shadow-sm">
        {/* Sliding indicator */}
        <div 
          className={cn(
            "absolute top-1 bottom-1 rounded-lg shadow-lg transition-all duration-300 ease-out bg-gradient-to-r from-green-500 to-blue-500",
            mode === 'tech_stack' 
              ? "left-1 right-[50%]" 
              : "left-[50%] right-1"
          )}
        >
          <div className="absolute inset-0 rounded-lg bg-white/20 backdrop-blur-sm" />
        </div>
        
        {/* Buttons */}
        <div className="relative flex">
          {/* Tech Stack Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onModeChange('tech_stack')}
            className={cn(
              "relative z-10 flex-1 transition-all duration-200 py-3 rounded-lg",
              mode === 'tech_stack'
                ? "text-white hover:text-white/90"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <div className="flex flex-col items-center gap-1">
              <BarChart3 className="h-4 w-4" />
              <span className="font-medium text-xs">Tech Stack</span>
              <span className="text-[10px] opacity-70">Predefined topics</span>
            </div>
          </Button>
          
          {/* File Upload Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onModeChange('file_upload')}
            className={cn(
              "relative z-10 flex-1 transition-all duration-200 py-3 rounded-lg",
              mode === 'file_upload'
                ? "text-white hover:text-white/90"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <div className="flex flex-col items-center gap-1">
              <FileText className="h-4 w-4" />
              <span className="font-medium text-xs">File Upload</span>
              <span className="text-[10px] opacity-70">Your content</span>
            </div>
          </Button>
        </div>
      </div>
      
      {/* Mode Description */}
      <div className="mt-3 p-3 rounded-lg bg-gradient-to-r from-green-50/50 to-blue-50/50 dark:from-green-950/20 dark:to-blue-950/20 border border-green-200/50 dark:border-green-800/30">
        <div className="flex items-start gap-2">
          {mode === 'tech_stack' ? (
            <BarChart3 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
          ) : (
            <FileText className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
          )}
          <div className="text-xs leading-relaxed">
            {mode === 'tech_stack' ? (
              <div>
                <p className="font-medium text-foreground mb-1">Tech Stack Mode</p>
                <p className="text-muted-foreground">
                  Select technologies and topics to generate quiz questions from our comprehensive knowledge base. 
                  Perfect for technical interviews and skill assessments.
                </p>
              </div>
            ) : (
              <div>
                <p className="font-medium text-foreground mb-1">File Upload Mode</p>
                <p className="text-muted-foreground">
                  Upload your own code files, documentation, or text files to generate personalized quiz questions. 
                  Great for custom training materials and specific content.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
