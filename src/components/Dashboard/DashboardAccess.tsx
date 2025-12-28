'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Loader2, Zap, Lock, ArrowRight, Building2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Company {
  company_id: string;
  plan_name: string;
  // Add other company fields as needed
}

export function DashboardAccess({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoadingCompany, setIsLoadingCompany] = useState(true);

  useEffect(() => {
    const fetchCompany = async () => {
      if (!isLoaded || !user) {
        setIsLoadingCompany(false);
        return;
      }
      
      try {
        // Check if user has a company
        const checkResponse = await fetch(`/api/company/check?owner_id=${user.id}`);
        
        if (!checkResponse.ok) {
          console.error('Failed to check company status');
          setCompany(null);
          setIsLoadingCompany(false);
          return;
        }

        const checkData = await checkResponse.json();
        
        // If company exists in the response, use it
        if (checkData.exists && checkData.companies && checkData.companies.length > 0) {
          setCompany(checkData.companies[0]);
        } else {
          setCompany(null);
        }
      } catch (error) {
        console.error('Error fetching company:', error);
        setCompany(null);
      } finally {
        setIsLoadingCompany(false);
      }
    };

    fetchCompany();
  }, [isLoaded, user]);

  // Show loading state in the page content instead
  if (!isLoaded || isLoadingCompany) {
    return <>{children}</>;
  }

  // Check if user needs to create a company
  if (!company) {
    return (
      <div className="min-h-screen bg-background text-white flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-black/30 backdrop-blur-lg border border-white/10 rounded-2xl p-8 shadow-2xl">
            <div className="text-center space-y-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-green-500/20 to-blue-500/20 flex items-center justify-center">
                <Building2 className="h-10 w-10 text-blue-400" />
              </div>
              <div className="space-y-3">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-teal-300 via-blue-400 to-blue-500 bg-clip-text text-transparent">
                  Welcome to QuizzViz
                </h2>
                <p className="text-gray-300 text-base">
                  Create your company to start building and sharing technical assessments with candidates.
                </p>
              </div>
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
      </div>
    );
  }

  // Show subscription prompt for non-Business plans
  if (company.plan_name !== 'Business') {
    return (
      <div className="min-h-screen bg-background text-white flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-black/30 backdrop-blur-lg border border-white/10 rounded-2xl p-8 shadow-2xl">
            <div className="text-center space-y-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-blue-500/20 to-green-500/20 flex items-center justify-center">
                <Zap className="h-10 w-10 text-blue-400" />
              </div>
              <div className="space-y-3">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-teal-300 via-blue-400 to-blue-500 bg-clip-text text-transparent">
                  Subscribe to Continue
                </h2>
                <p className="text-gray-300 text-base">
                  Unlock all features and create quizzes by subscribing to our service.
                </p>
              </div>
              <Button 
                onClick={() => router.push('/pricing')}
                className="w-full h-14 text-base font-bold bg-gradient-to-r from-green-500 to-blue-500 text-white hover:brightness-110 transition-all duration-300 shadow-md hover:shadow-xl group rounded-xl"
              >
                <Zap className="w-5 h-5 mr-2" />
                Subscribe Now
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}