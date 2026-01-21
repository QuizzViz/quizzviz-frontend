import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useAuth } from '@clerk/nextjs';
import { Check, Building2, Sparkles, Zap, Users, Shield, BarChart3, Download, Loader2 } from 'lucide-react';
import Head from 'next/head';
import { Footer } from '@/components/Footer';
import { useToast } from '@/hooks/use-toast';
import { ArrowRight } from 'lucide-react';

const plans = [{
  id: 'basic',
  name: 'Basic',
  price: '199',
  yearlyPrice: '1910',
  tagline: 'Perfect for growing companies',
   monthlyLink: "https://quizzviz1.lemonsqueezy.com/buy/1339e755-d028-4b6e-adbb-8b048f7c8018",
  // Test Mode URL Below
  // monthlyLink: "https://quizzviz1.lemonsqueezy.com/checkout/buy/18300c31-94d2-44b1-9963-5fa31617fc0c",
  yearlyLink: "https://quizzviz1.lemonsqueezy.com/buy/efce1477-8c02-4490-b0b5-babd2730657c",
  features: [
    { text: '20 quizzes per month', icon: Zap },
    { text: '100 questions per quiz', icon: Sparkles },
    { text: 'Share with candidates', icon: Users },
    { text: 'Advanced proctoring', icon: Shield },
    { text: 'Detailed analytics', icon: BarChart3 },
    { text: 'Data export (Excel, PDF)', icon: Download },
    { text: 'Custom branding', icon: Building2 },
    { text: 'Priority support', icon: Check }
  ]
}];

const PricingPage = () => {
  const router = useRouter();
  const { user, isSignedIn } = useUser();
  const { getToken } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [isMounted, setIsMounted] = useState(false);

  const monthlyPrice = parseFloat(plans[0].price);
  const yearlyPrice = parseFloat(plans[0].yearlyPrice);
  const yearlySavings = Math.round(((monthlyPrice * 12 - yearlyPrice) / (monthlyPrice * 12)) * 100);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSubscribe = async (e, planLink) => {
    e.preventDefault();
    
    if (!isSignedIn) {
      router.push('/signin?redirect=/pricing');
      return;
    }

    setIsLoading(true);
    try {
      const token = await getToken();
      const response = await fetch(`/api/company/check?owner_id=${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      if (!data.exists || !data.companies || data.companies.length === 0) {
        router.push('/onboarding');
        return;
      }
      
      // If company exists, proceed to subscription
      window.location.href = planLink;
    } catch (error) {
      console.error('Error checking company:', error);
      toast({
        title: 'Error',
        description: 'Failed to verify company status',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
    <Head>
      <title>Pricing | QuizzViz</title>
      <meta name="description" content="Pricing | QuizzViz" />
      <link rel="icon" href="/favicon.ico" />
    </Head>
    <div className="min-h-screen bg-[#0a0a0a] relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <main className="relative mt-6 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header Section */}
        <div className="text-center mt-8 mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Choose Your Plan
          </h1>
          <p className="text-sm md:text-base text-gray-400 max-w-xl mx-auto">
            Unlock the full power of QuizzViz with our comprehensive solution
          </p>

           <div className="mt-5 inline-flex items-center bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-full p-1 shadow-lg">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-5 py-2 rounded-full text-xs font-semibold transition-all duration-300 ${
                billingCycle === 'monthly'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-5 py-2 rounded-full text-xs font-semibold transition-all duration-300 relative ${
                billingCycle === 'yearly'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Yearly
              <span className="absolute -top-2 -right-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg">
                -{yearlySavings}%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Card */}
        <div className="max-w-sm mx-auto">
          <div className="relative group">
            {/* Glow effect */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
            
            <div className="relative bg-gradient-to-br from-gray-900 to-gray-950 rounded-2xl shadow-2xl overflow-hidden border border-gray-800">
              <div className="p-5">
                {/* Plan Header */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-0.5">{plans[0].name}</h3>
                    <p className="text-gray-400 text-xs">{plans[0].tagline}</p>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 p-2.5 rounded-xl border border-emerald-500/30">
                    <Building2 className="w-6 h-6 text-emerald-400" />
                  </div>
                </div>

                {/* Pricing */}
                <div className="mb-4">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-400">
                      ${billingCycle === 'yearly' ? plans[0].yearlyPrice : plans[0].price}
                    </span>
                    <span className="text-gray-500 text-base font-medium">
                      /{billingCycle === 'yearly' ? 'year' : 'month'}
                    </span>
                  </div>
                  {billingCycle === 'yearly' && (
                    <div className="mt-2 inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-1">
                      <Sparkles className="w-3 h-3 text-emerald-400" />
                      <p className="text-xs text-emerald-400 font-medium">
                        Save ${(monthlyPrice * 12 - yearlyPrice).toFixed(0)}/year
                      </p>
                    </div>
                  )}
                </div>

                {/* CTA Button */}
                <button
                  onClick={(e) => handleSubscribe(e, billingCycle === 'monthly' ? plans[0].monthlyLink : plans[0].yearlyLink)}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold text-sm py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-500/30 active:scale-[0.98]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin mr-2 h-5 w-5" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Get Started
                      <ArrowRight className="inline-block ml-2" />
                    </>
                  )}
                </button>

                {/* Divider */}
                <div className="border-t border-gray-800 mb-5"></div>

                {/* Features */}
                <div className="space-y-2.5">
                  {plans[0].features.map((feature, index) => {
                    const Icon = feature.icon;
                    return (
                      <div 
                        key={index} 
                        className="flex items-center gap-2.5 group/item hover:translate-x-0.5 transition-transform duration-200"
                      >
                        <div className="flex-shrink-0 w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover/item:bg-emerald-500/20 transition-colors">
                          <Icon className="w-3.5 h-3.5 text-emerald-400" />
                        </div>
                        <span className="text-gray-300 text-xs font-medium">{feature.text}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Trust Badge */}
                <div className="mt-5 pt-4 border-t border-gray-800 flex items-center justify-center gap-1.5 text-gray-500 text-xs">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Secure checkout by Lemon Squeezy</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm">
            Need a custom plan? <a href="mailto:support@quizzviz.com" className="text-emerald-400 hover:text-emerald-300 underline decoration-emerald-400/30 hover:decoration-emerald-300 transition-colors">Contact sales</a>
          </p>
        </div>
      </main>
    </div>
    <Footer />
    </>
  );
};



export default PricingPage;