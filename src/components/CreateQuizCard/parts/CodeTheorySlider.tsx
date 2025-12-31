"use client";

import * as React from "react";
import { Code, BookOpen } from "lucide-react";

interface CodeTheorySliderProps {
  codePercentage: number;
  onCodePercentageChange: (value: number) => void;
}

export function CodeTheorySlider({ codePercentage, onCodePercentageChange }: CodeTheorySliderProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const sliderRef = React.useRef<HTMLDivElement>(null);
  const thumbRef = React.useRef<HTMLDivElement>(null);
  const theoryPercentage = 100 - codePercentage;

  const handleSliderChange = (clientX: number) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    let percentage = ((clientX - rect.left) / rect.width) * 100;
    
    // Ensure percentage is within bounds and round to nearest 5 for better UX
    percentage = Math.max(0, Math.min(100, percentage));
    const roundedPercentage = Math.round(percentage / 5) * 5;
    
    console.log('Slider moved to:', { raw: percentage, rounded: roundedPercentage });
    onCodePercentageChange(roundedPercentage);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    handleSliderChange(e.clientX);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      handleSliderChange(e.clientX);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging]);

  return (
    <div className="w-full">
      <div className="space-y-3">
        <p className="text-md text-muted-foreground text-center mt-5">
          Drag to choose how many MCQs from Code vs Theory
        </p>

        {/* Allocation Display */}
        <div className="flex justify-between items-center mb-2">
          <div className="text-center">
            <div className="flex items-center gap-2 text-white">
              <Code className="w-4 h-4" />
              <span className="font-medium">Code</span>
            </div>
            <div className="text-xl font-bold text-foreground">{codePercentage}%</div>
          </div>

          <div className="text-center">
            <div className="flex items-center gap-2 text-white">
              <BookOpen className="w-4 h-4" />
              <span className="font-medium">Theory</span>
            </div>
            <div className="text-xl font-bold text-foreground">{theoryPercentage}%</div>
          </div>
        </div>

        {/* Custom Slider */}
        <div className="relative">
          <div
            ref={sliderRef}
            className="relative h-3 bg-muted rounded-full cursor-pointer shadow-inner"
            onMouseDown={handleMouseDown}
          >
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-500 to-blue-500 rounded-full transition-all duration-150 ease-out shadow-sm"
              style={{ width: `${codePercentage}%` }}
            >
              <div className="absolute right-0 h-6 w-1 bg-white/80 -mr-1 transform translate-x-1/2 top-1/2 -translate-y-1/2 rounded-full" />
            </div>

            {/* Theory section (remaining percentage) */}
            <div
              className="absolute top-0 right-0 h-full bg-gradient-to-l from-muted-foreground/20 to-muted-foreground/30 rounded-full transition-all duration-150 ease-out shadow-sm"
              style={{ width: `${theoryPercentage}%` }}
            />
          </div>
          
          {/* Slider Thumb */}
          <div
            ref={thumbRef}
            className="absolute top-1/2 w-7 h-7 bg-background border-3 border-foreground rounded-full shadow-lg cursor-grab
              transform -translate-y-1/2 -translate-x-1/2 transition-all duration-150 ease-out
              hover:scale-110 hover:shadow-xl"
            style={{ left: `${codePercentage}%` }}
            onMouseDown={handleMouseDown}
          />
        </div>
      </div>
    </div>
  );
}

export default CodeTheorySlider;
