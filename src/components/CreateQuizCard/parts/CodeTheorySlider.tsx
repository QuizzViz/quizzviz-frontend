"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Code, BookOpen } from "lucide-react";

// Only the allocation slider UI is kept in this file

export function InteractiveSlider() {
  const [codePercentage, setCodePercentage] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);

  const theoryPercentage = 100 - codePercentage;

  const handleSliderChange = (clientX: number) => {
    if (!sliderRef.current) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    setCodePercentage(Math.round(percentage));
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

  useEffect(() => {
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
    <div className="w-full max-w-4xl mx-auto space-y-8">
      <Card className="p-8 shadow-lg border-0">
        <div className="space-y-6">
          <div className="text-center">
            
            <p className="text-sm text-muted-foreground">Drag to choose how many MCQs from Code vs Theory</p>
          </div>

          {/* Allocation Display */}
          <div className="flex justify-between items-center mb-4">
            <div className="text-center">
              <div className="flex items-center gap-2 text-white">
                <Code className="w-4 h-4" />
                <span className="bold">Code</span>
              </div>
              <div className="text-2xl font-bold text-foreground mt-1">{codePercentage}%</div>
            </div>

            <div className="text-center text-muted-foreground">
      
            </div>

            <div className="text-center">
              <div className="flex items-center gap-2 text-white">
                <BookOpen className="w-4 h-4" />
                <span className="font-bold">Theory</span>
              </div>
              <div className="text-2xl font-bold text-foreground mt-1">{theoryPercentage}%</div>
            </div>
          </div>

          {/* Custom Slider */}
          <div className="relative">
            <div
              ref={sliderRef}
              className="relative h-4 bg-muted rounded-full cursor-pointer shadow-inner"
              onMouseDown={handleMouseDown}
            >
              <div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-150 ease-out shadow-sm"
                style={{ width: `${codePercentage}%` }}
              />

              {/* Theory section (remaining percentage) */}
              <div
                className="absolute top-0 right-0 h-full bg-gradient-to-l from-accent to-accent/80 rounded-full transition-all duration-150 ease-out shadow-sm"
                style={{ width: `${theoryPercentage}%` }}
              />

              {/* Slider Thumb */}
              <div
                ref={thumbRef}
                className={`
                  absolute top-1/2 w-7 h-7 bg-background border-3 border-foreground rounded-full shadow-lg cursor-grab
                  transform -translate-y-1/2 -translate-x-1/2 transition-all duration-150 ease-out
                  hover:scale-110 hover:shadow-xl
                  ${isDragging ? "scale-125 shadow-2xl animate-pulse-glow cursor-grabbing" : ""}
                  ${showTooltip ? "animate-pulse-glow" : ""}
                `}
                style={{ left: `${codePercentage}%` }}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
              >
                {(showTooltip || isDragging) && (
                  <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-foreground text-background px-3 py-2 rounded-md text-sm font-medium shadow-lg animate-slide-in whitespace-nowrap">
                    Code: {codePercentage}% | Theory: {theoryPercentage}%
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-foreground" />
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between mt-4 text-sm">
              
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default InteractiveSlider;
