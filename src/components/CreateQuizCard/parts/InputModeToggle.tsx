import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { BarChart3, FileText, Layers, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export type InputMode = 'tech_stack' | 'file_upload';

interface InputModeToggleProps {
  mode: InputMode;
  onModeChange: (mode: InputMode) => void;
  className?: string;
}

export function InputModeToggle({ mode, onModeChange, className }: InputModeToggleProps) {
  const [hovered, setHovered] = useState<InputMode | null>(null);

  return (
    <div className={cn('relative w-full', className)}>
      {/* Section Label */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-green-500 to-blue-500 shadow-sm">
          <Layers className="h-3.5 w-3.5 text-white" />
        </div>
        <div>
          <span className="text-sm font-semibold text-foreground tracking-tight">Quiz Content Source</span>
          <span className="ml-2 text-xs text-muted-foreground">Choose how to generate your quiz</span>
        </div>
      </div>

      {/* Toggle Pills */}
      <div className="relative flex gap-2 p-1 rounded-2xl bg-muted/60 border border-border/40 shadow-inner backdrop-blur-sm">
        {/* Animated Background Pill */}
        <div
          className={cn(
            'absolute top-1 bottom-1 rounded-xl transition-all duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] shadow-md',
            mode === 'tech_stack'
              ? 'left-1 right-[50%] bg-gradient-to-r from-green-500 to-emerald-500'
              : 'left-[50%] right-1 bg-gradient-to-r from-blue-500 to-indigo-500'
          )}
        >
          {/* Gloss overlay */}
          <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/25 to-transparent" />
          {/* Subtle inner glow */}
          <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/20" />
        </div>

        {/* Tech Stack Button */}
        <button
          onClick={() => onModeChange('tech_stack')}
          onMouseEnter={() => setHovered('tech_stack')}
          onMouseLeave={() => setHovered(null)}
          className={cn(
            'relative z-10 flex-1 flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl',
            'transition-all duration-200 text-sm font-medium',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500/50',
            mode === 'tech_stack'
              ? 'text-white'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <div className={cn(
            'flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-200',
            mode === 'tech_stack'
              ? 'bg-white/20 text-white'
              : hovered === 'tech_stack'
                ? 'bg-green-500/10 text-green-500'
                : 'bg-muted text-muted-foreground'
          )}>
            <BarChart3 className="h-4 w-4" />
          </div>
          <div className="text-left leading-tight">
            <div className="font-semibold text-sm leading-none">Tech Stack</div>
            <div className={cn(
              'text-[11px] mt-0.5 transition-colors',
              mode === 'tech_stack' ? 'text-white/70' : 'text-muted-foreground'
            )}>
              Predefined topics
            </div>
          </div>
        </button>

        {/* File Upload Button */}
        <button
          onClick={() => onModeChange('file_upload')}
          onMouseEnter={() => setHovered('file_upload')}
          onMouseLeave={() => setHovered(null)}
          className={cn(
            'relative z-10 flex-1 flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl',
            'transition-all duration-200 text-sm font-medium',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50',
            mode === 'file_upload'
              ? 'text-white'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <div className={cn(
            'flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-200',
            mode === 'file_upload'
              ? 'bg-white/20 text-white'
              : hovered === 'file_upload'
                ? 'bg-blue-500/10 text-blue-500'
                : 'bg-muted text-muted-foreground'
          )}>
            <FileText className="h-4 w-4" />
          </div>
          <div className="text-left leading-tight">
            <div className="font-semibold text-sm leading-none">File Upload</div>
            <div className={cn(
              'text-[11px] mt-0.5 transition-colors',
              mode === 'file_upload' ? 'text-white/70' : 'text-muted-foreground'
            )}>
              Your content
            </div>
          </div>
        </button>
      </div>

      {/* Mode Description Card */}
      <div className={cn(
        'mt-3 p-3.5 rounded-xl border transition-all duration-300',
        mode === 'tech_stack'
          ? 'bg-green-500/5 border-green-500/20'
          : 'bg-blue-500/5 border-blue-500/20'
      )}>
        <div className="flex items-start gap-3">
          <div className={cn(
            'flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg shadow-sm transition-all duration-300',
            mode === 'tech_stack'
              ? 'bg-gradient-to-br from-green-400 to-emerald-500'
              : 'bg-gradient-to-br from-blue-400 to-indigo-500'
          )}>
            {mode === 'tech_stack'
              ? <BarChart3 className="h-4 w-4 text-white" />
              : <FileText className="h-4 w-4 text-white" />
            }
          </div>
          <div>
            <div className={cn(
              'text-xs font-semibold mb-0.5 transition-colors',
              mode === 'tech_stack' ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'
            )}>
              {mode === 'tech_stack' ? 'Tech Stack Mode' : 'File Upload Mode'}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {mode === 'tech_stack'
                ? 'Generate questions from our curated knowledge base. Ideal for technical interviews and skill assessments.'
                : 'Upload code files, docs, or text to create tailored questions from your own content.'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}