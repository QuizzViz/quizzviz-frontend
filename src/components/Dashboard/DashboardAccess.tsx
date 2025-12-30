'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useUser, useClerk } from '@clerk/nextjs';
import { Loader2, Zap, Lock, ArrowRight, Building2, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from '@/hooks/use-toast';

interface Company {
  company_id: string;
  plan_name: string;
  question_limit: number;
  quiz_limit: number;
  questions_used: number;
  quizzes_used: number;
}

interface DashboardAccessProps {
  children: React.ReactNode;
  showFullAccess?: boolean;
}

export function DashboardAccess({ children, showFullAccess = false }: DashboardAccessProps) {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPath, setCurrentPath] = useState('');
  const [usage, setUsage] = useState({
    questions: { used: 0, limit: 100 },
    quizzes: { used: 0, limit: 20 }
  });

  // Set current path on client-side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentPath(window.location.pathname);
    }
  }, []);

  // Fetch company and usage data
  useEffect(() => {
    const fetchData = async () => {
      if (!isLoaded || !user) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch company data
        const companyRes = await fetch('/api/company/check');
        if (companyRes.ok) {
          const data = await companyRes.json();
          if (data.exists && data.companies && data.companies.length > 0) {
            const companyData = data.companies[0];
            setCompany(companyData);
            
            // Update usage state with company data
            setUsage({
              questions: {
                used: companyData.questions_used || 0,
                limit: companyData.question_limit || 100
              },
              quizzes: {
                used: companyData.quizzes_used || 0,
                limit: companyData.quiz_limit || 20
              }
            });
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load dashboard data. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isLoaded, user]);

  // Show loading state
  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // Case 1: User has no company
  if (!company) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-gray-800/80 backdrop-blur-lg border border-gray-700/50 rounded-2xl p-8 shadow-2xl">
            <div className="text-center space-y-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                <Building2 className="h-10 w-10 text-blue-400" />
              </div>
              <div className="space-y-3">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Welcome to QuizzViz
                </h2>
                <p className="text-gray-300 text-base">
                  You need to create a company to get started.
                </p>
              </div>
              <div className="flex flex-col space-y-3">
                <Button
                  onClick={() => router.push('/onboarding')}
                  className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white transition-all duration-300"
                >
                  <Building2 className="w-4 h-4 mr-2" />
                  Create Company
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => signOut(() => router.push('/'))}
                  className="text-gray-400 hover:text-white hover:bg-gray-700/50"
                >
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Case 2: User has company but no Business plan
  if (company.plan_name !== 'Business') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-gray-800/80 backdrop-blur-lg border border-amber-500/30 rounded-2xl p-8 shadow-2xl">
            <div className="text-center space-y-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                <Lock className="h-10 w-10 text-amber-400" />
              </div>
              <div className="space-y-3">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                  Upgrade Required
                </h2>
                <p className="text-gray-300 text-base">
                  You need to upgrade to the Business plan to access all features.
                </p>
                <div className="text-left space-y-2 text-sm text-gray-400 mt-4">
                  <div className="flex items-center">
                    <span className="text-green-400 mr-2">✓</span>
                    <span>Access to all quiz templates</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-green-400 mr-2">✓</span>
                    <span>Advanced analytics</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-green-400 mr-2">✓</span>
                    <span>Priority support</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col space-y-3">
                <Button
                  onClick={() => router.push('/pricing')}
                  className="w-full h-12 text-base font-semibold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white transition-all duration-300"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Upgrade to Business Plan
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => signOut(() => router.push('/'))}
                  className="text-gray-400 hover:text-white hover:bg-gray-700/50"
                >
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Case 3: User has Business plan - show full access
  return (
    <>
      {children}
      {/* Usage limit indicators */}
      {(usage.questions.used >= usage.questions.limit || 
        usage.quizzes.used >= usage.quizzes.limit) && (
        <div className="fixed bottom-4 right-4 bg-amber-500/10 border border-amber-500/30 text-amber-300 px-4 py-2 rounded-lg shadow-lg backdrop-blur-sm flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-amber-400" />
          <span>You've reached your monthly limit. </span>
          <button 
            onClick={() => router.push('/pricing')}
            className="font-semibold text-amber-300 hover:text-white underline"
          >
            Upgrade
          </button>
        </div>
      )}
    </>
  );
}