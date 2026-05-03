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
      {/* Header with icon and gradient */}
      <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20">
        <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-blue-500">
          <Layers className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-foreground">Quiz Content Source</h3>
          <p className="text-xs text-muted-foreground">Choose how you want to generate your quiz</p>
        </div>
      </div>
      
      {/* Toggle Container */}
      <div className="relative bg-gradient-to-r from-muted/50 to-muted/30 rounded-xl p-1.5 border border-border/50 shadow-sm">
        {/* Sliding indicator */}
        <div 
          className={cn(
            "absolute top-1.5 bottom-1.5 rounded-xl shadow-lg transition-all duration-500 ease-out bg-gradient-to-r",
            mode === 'tech_stack' 
              ? "left-1.5 right-[50%] from-green-500 to-green-600" 
              : "left-[50%] right-1.5 from-blue-500 to-blue-600"
          )}
        >
          <div className="absolute inset-0 rounded-xl bg-white/20 backdrop-blur-sm" />
          <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-white/10 to-transparent" />
        </div>
        
        {/* Buttons */}
        <div className="relative flex">
          {/* Tech Stack Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onModeChange('tech_stack')}
            className={cn(
              "relative z-10 flex-1 transition-all duration-300 py-4 rounded-xl",
              mode === 'tech_stack'
                ? "text-white hover:text-white/90 shadow-lg"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <div className="flex flex-col items-center gap-2">
              <div className={cn(
                "p-2 rounded-lg transition-all duration-300",
                mode === 'tech_stack' 
                  ? "bg-white/20 backdrop-blur-sm" 
                  : "bg-muted/50"
              )}>
                <BarChart3 className="h-5 w-5" />
              </div>
              <div className="text-center">
                <span className="font-semibold text-sm">Tech Stack</span>
                <div className="text-xs opacity-80 mt-0.5">Predefined topics</div>
              </div>
            </div>
          </Button>
          
          {/* File Upload Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onModeChange('file_upload')}
            className={cn(
              "relative z-10 flex-1 transition-all duration-300 py-4 rounded-xl",
              mode === 'file_upload'
                ? "text-white hover:text-white/90 shadow-lg"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <div className="flex flex-col items-center gap-2">
              <div className={cn(
                "p-2 rounded-lg transition-all duration-300",
                mode === 'file_upload' 
                  ? "bg-white/20 backdrop-blur-sm" 
                  : "bg-muted/50"
              )}>
                <FileText className="h-5 w-5" />
              </div>
              <div className="text-center">
                <span className="font-semibold text-sm">File Upload</span>
                <div className="text-xs opacity-80 mt-0.5">Your content</div>
              </div>
            </div>
          </Button>
        </div>
      </div>
      
      {/* Mode Description */}
      <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-green-50/50 to-blue-50/50 dark:from-green-950/20 dark:to-blue-950/20 border border-green-200/50 dark:border-green-800/30">
        <div className="flex items-start gap-3">
          <div className={cn(
            "p-2 rounded-lg transition-all duration-300",
            mode === 'tech_stack' 
              ? "bg-green-500 text-white" 
              : "bg-blue-500 text-white"
          )}>
            {mode === 'tech_stack' ? (
              <BarChart3 className="h-4 w-4" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
          </div>
          <div className="flex-1">
            <div className="font-semibold text-sm text-foreground mb-1">
              {mode === 'tech_stack' ? 'Tech Stack Mode' : 'File Upload Mode'}
            </div>
            <div className="text-xs leading-relaxed text-muted-foreground">
              {mode === 'tech_stack' ? (
                <>
                  Select technologies and topics to generate quiz questions from our comprehensive knowledge base. 
                  Perfect for technical interviews and skill assessments.
                </>
              ) : (
                <>
                  Upload your own code files, documentation, or text files to generate personalized quiz questions. 
                  Great for custom training materials and specific content.
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
