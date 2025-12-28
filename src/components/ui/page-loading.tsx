import { Loader2 } from "lucide-react";

export function PageLoading() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[50vh]">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-white/10 rounded-full" />
          <div className="w-16 h-16 border-4 border-transparent rounded-full border-t-green-400 border-r-blue-400 animate-spin absolute top-0 left-0" />
        </div>
        <p className="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent font-semibold">
          Loading...
        </p>
      </div>
    </div>
  );
}
