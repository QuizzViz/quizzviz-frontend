"use client";

import { Loader2 } from "lucide-react";

interface LoadingProps {
  fullScreen?: boolean;
  text?: string;
  className?: string;
}

export const LoadingSpinner = ({
  fullScreen = false,
  text = "Loading...",
  className = "",
}: LoadingProps) => {
  return (
    <div
      className={`flex flex-col items-center justify-center ${
        fullScreen ? "min-h-screen" : "py-20"
      } space-y-4 ${className}`}
    >
      <div className="relative">
        <div className="w-16 h-16 border-4 border-white/10 rounded-full" />
        <div className="w-16 h-16 border-4 border-transparent rounded-full border-t-green-400 border-r-blue-400 animate-spin absolute top-0 left-0" />
      </div>
      <p className="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent font-semibold">
        {text}
      </p>
    </div>
  );
};

export const LoadingCard = () => (
  <div className="bg-black/30 backdrop-blur-lg border border-white/10 rounded-lg p-6 animate-pulse">
    <div className="space-y-4">
      <div className="h-6 w-3/4 bg-white/10 rounded" />
      <div className="h-4 w-1/2 bg-white/10 rounded" />
      <div className="h-4 w-5/6 bg-white/10 rounded" />
      <div className="h-4 w-2/3 bg-white/10 rounded" />
    </div>
  </div>
);

export const LoadingButton = ({ text = "Loading..." }: { text?: string }) => (
  <button
    disabled
    className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground opacity-50 cursor-not-allowed"
  >
    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
    {text}
  </button>
);

export default LoadingSpinner;
