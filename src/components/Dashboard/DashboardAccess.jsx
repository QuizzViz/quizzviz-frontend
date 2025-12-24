'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { usePlanCheck } from '@/lib/planCheck';
import { Loader2, Zap, Lock, ArrowRight } from 'lucide-react';

export function DashboardAccess({ children }) {
  const { isLoading, hasAccess, needsOnboarding } = usePlanCheck();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
      </div>
    );
  }

  if (needsOnboarding) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-white/10 rounded-2xl p-8 shadow-2xl">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-green-500/20 to-blue-500/20 flex items-center justify-center mb-6">
              <Zap className="h-10 w-10 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-400" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">Welcome to QuizzViz</h2>
            <p className="text-gray-300 mb-8">
              Create your company to start building and sharing technical assessments with candidates.
            </p>
            <Button 
              onClick={() => router.push('/onboarding')}
              className="w-full h-14 text-base font-bold bg-gradient-to-r from-green-500 to-blue-500 text-white hover:brightness-110 transition-all duration-300 shadow-md hover:shadow-xl group rounded-xl"
            >
              <Zap className="w-5 h-5 mr-2" />
              Create Your Company
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-white/10 rounded-2xl p-8 shadow-2xl">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-blue-500/20 to-green-500/20 flex items-center justify-center mb-6">
              <Lock className="h-10 w-10 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-400" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">Upgrade Required</h2>
            <p className="text-gray-300 mb-8">
              Your current plan has limitations. Upgrade to unlock all features and create unlimited assessments.
            </p>
            <Button 
              onClick={() => router.push('/pricing')}
              className="w-full h-14 text-base font-bold bg-gradient-to-r from-green-500 to-blue-500 text-white hover:brightness-110 transition-all duration-300 shadow-md hover:shadow-xl group rounded-xl"
            >
              View Pricing Plans
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
