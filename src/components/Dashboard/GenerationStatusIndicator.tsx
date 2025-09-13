import { Loader2 } from "lucide-react";
import { useQuizGeneration } from "@/contexts/QuizGenerationContext";

export function GenerationStatusIndicator() {
  const { isGenerating, currentTopic, generationProgress } = useQuizGeneration();

  if (!isGenerating) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-gray-900/90 backdrop-blur-md rounded-lg shadow-lg border border-gray-700 p-4 w-72">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Loader2 className="h-5 w-5 text-blue-400 animate-spin" />
            </div>
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-400 animate-spin" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {currentTopic || 'Generating quiz...'}
            </p>
            <div className="w-full bg-gray-700 rounded-full h-1.5 mt-1">
              <div 
                className="bg-blue-500 h-1.5 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${generationProgress}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {generationProgress}% complete
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
