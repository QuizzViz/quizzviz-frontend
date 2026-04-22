import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useAuth } from '@clerk/nextjs';
import { Check, Building2, Sparkles, Zap, Users, Shield, BarChart3, Download, Loader2 } from 'lucide-react';
import Head from 'next/head';
import { Footer } from '@/components/Footer';
import { useToast } from '@/hooks/use-toast';
import { ArrowRight } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

const plans = [
  {
    id: 'growth',
    name: 'Growth',
    price: '99',
    quarterlyPrice: '282',
    yearlyPrice: '1010',
    tagline: 'Perfect for growing teams',
    monthlyLink: "https://quizzviz1.lemonsqueezy.com/checkout/buy/2cbc34b9-8d5d-4c22-8914-2cf33f8165e6",
    quarterlyLink: "https://quizzviz1.lemonsqueezy.com/checkout/buy/f9215dd2-ff70-4299-a967-d765f37cc708",
    yearlyLink: "https://quizzviz1.lemonsqueezy.com/checkout/buy/acaeddc9-da1d-4539-8cc5-d130eca8363c",
    features: [
      { text: 'Up to 3 team members', icon: Users },
      { text: '500 candidates per month', icon: Users },
      { text: '30 quizzes per month', icon: Zap },
      { text: 'Max 50 questions per quiz', icon: Sparkles },
      { text: 'Advanced proctoring', icon: Shield },
      { text: 'Detailed analytics', icon: BarChart3 },
      { text: 'Data export (Excel, PDF)', icon: Download },
      { text: 'Email support', icon: Check }
    ]
  },
  {
    id: 'scale',
    name: 'Scale',
    price: '249',
    quarterlyPrice: '710',
    yearlyPrice: '2537',
    tagline: 'Most Popular',
    popular: true,
    monthlyLink: "https://quizzviz1.lemonsqueezy.com/checkout/buy/87871d63-d0db-419d-a089-a75a0bda83a4",
    quarterlyLink: "https://quizzviz1.lemonsqueezy.com/checkout/buy/e039b54f-295d-4891-8087-53f983db1dfb",
    yearlyLink: "https://quizzviz1.lemonsqueezy.com/checkout/buy/18432203-777a-4a83-aca9-d2302e7ed6a0",
    features: [
      { text: 'Up to 7 team members', icon: Users },
      { text: '2000 candidates per month', icon: Users },
      { text: '70 quizzes per month', icon: Zap },
      { text: 'Max 100 questions per quiz', icon: Sparkles },
      { text: 'Advanced proctoring', icon: Shield },
      { text: 'Detailed analytics', icon: BarChart3 },
      { text: 'Data export (Excel, PDF)', icon: Download },
      { text: 'Priority support', icon: Check }
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '399',
    quarterlyPrice: '1137',
    yearlyPrice: '4069',
    tagline: 'For large organizations',
    monthlyLink: "https://quizzviz1.lemonsqueezy.com/checkout/buy/8d067c96-a869-4829-98ba-b1bb03a6a96f",
    quarterlyLink: "https://quizzviz1.lemonsqueezy.com/checkout/buy/6658ae54-0233-4145-9dd7-894c18746c77",
    yearlyLink: "https://quizzviz1.lemonsqueezy.com/checkout/buy/fa9e1eb9-fb3e-47a1-af4e-a50b0c70bfad",
    features: [
      { text: 'Up to 20 team members', icon: Users },
      { text: '6000 candidates per month', icon: Users },
      { text: 'Unlimited quizzes', icon: Zap },
      { text: 'Max 150 questions per quiz', icon: Sparkles },
      { text: 'Advanced proctoring', icon: Shield },
      { text: 'Detailed analytics', icon: BarChart3 },
      { text: 'Data export (Excel, PDF)', icon: Download },
      { text: 'Dedicated support', icon: Check }
    ]
  }
];

const PricingPage = () => {
  const router = useRouter();
  const { user, isSignedIn } = useUser();
  const { getToken } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [isMounted, setIsMounted] = useState(false);

  // Calculate savings for display
  const getSavings = (plan) => {
    const monthly = parseFloat(plan.price);
    const quarterly = parseFloat(plan.quarterlyPrice);
    const yearly = parseFloat(plan.yearlyPrice);
    
    const quarterlySavings = Math.round(((monthly * 3 - quarterly) / (monthly * 3)) * 100);
    const yearlySavings = Math.round(((monthly * 12 - yearly) / (monthly * 12)) * 100);
    
    return { quarterlySavings, yearlySavings };
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSubscribe = async (e, planLink) => {
    e.preventDefault();
    
    if (!isSignedIn) {
      router.push('/signup?redirect=/pricing');
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
      
      // Company exists - navigate to checkout for subscription
      // Invalidate user plan cache to ensure fresh data after subscription
      queryClient.invalidateQueries({ queryKey: ['userPlan', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['companyInfo', user?.id] });
      
      toast({
        title: 'Success!',
        description: 'Company verified. Redirecting to checkout...',
        className: 'bg-green-500 border-green-500 text-white',
      });
        
      setTimeout(() => {
        window.location.href = planLink;
      }, 1000);
      return;
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

      <main className="relative mt-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300 ${
                billingCycle === 'monthly'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('quarterly')}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300 relative ${
                billingCycle === 'quarterly'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Quarterly
              <span className="absolute -top-2 -right-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg">
                -5%
              </span>
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300 relative ${
                billingCycle === 'yearly'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Yearly
              <span className="absolute -top-2 -right-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg">
                -15%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {plans.map((plan, index) => {
            const getPrice = () => {
              switch (billingCycle) {
                case 'quarterly': return plan.quarterlyPrice;
                case 'yearly': return plan.yearlyPrice;
                default: return plan.price;
              }
            };
            const getBillingPeriod = () => {
              switch (billingCycle) {
                case 'quarterly': return 'quarter';
                case 'yearly': return 'year';
                default: return 'month';
              }
            };
            const getLink = () => {
              switch (billingCycle) {
                case 'quarterly': return plan.quarterlyLink;
                case 'yearly': return plan.yearlyLink;
                default: return plan.monthlyLink;
              }
            };
            const getSavingsAmount = () => {
              const monthly = parseFloat(plan.price);
              const price = parseFloat(getPrice());
              const months = billingCycle === 'quarterly' ? 3 : 12;
              return (monthly * months - price).toFixed(0);
            };

            return (
              <div key={plan.id} className={`relative group ${plan.popular ? 'md:scale-105' : ''}`}>
                {/* Glow effect */}
                <div className={`absolute -inset-0.5 bg-gradient-to-r ${plan.popular ? 'from-amber-500 to-orange-500' : 'from-emerald-500 to-teal-500'} rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500`}></div>
                
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                    <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                      {plan.tagline}
                    </div>
                  </div>
                )}
                
                <div className="relative bg-gradient-to-br from-gray-900 to-gray-950 rounded-2xl shadow-2xl overflow-hidden border border-gray-800">
                  <div className="p-6">
                    {/* Plan Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className={`text-xl font-bold text-white mb-0.5 ${plan.popular ? 'bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent' : ''}`}>
                          {plan.name}
                        </h3>
                        <p className="text-gray-400 text-xs">{plan.tagline.replace('Most Popular', '')}</p>
                      </div>
                      <div className={`bg-gradient-to-br ${plan.popular ? 'from-amber-500/20 to-orange-500/20 border-amber-500/30' : 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30'} p-2.5 rounded-xl border`}>
                        <Building2 className={`w-6 h-6 ${plan.popular ? 'text-amber-400' : 'text-emerald-400'}`} />
                      </div>
                    </div>

                    {/* Pricing */}
                    <div className="mb-4">
                      <div className="flex items-baseline gap-1.5">
                        <span className={`text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r ${plan.popular ? 'from-amber-400 to-orange-400' : 'from-emerald-400 to-teal-400'}`}>
                          ${getPrice()}
                        </span>
                        <span className="text-gray-500 text-base font-medium">
                          /{getBillingPeriod()}
                        </span>
                      </div>
                      {(billingCycle === 'quarterly' || billingCycle === 'yearly') && (
                        <div className={`mt-2 inline-flex items-center gap-1.5 ${plan.popular ? 'bg-amber-500/10 border-amber-500/20' : 'bg-emerald-500/10 border-emerald-500/20'} rounded-full px-2.5 py-1`}>
                          <Sparkles className={`w-3 h-3 ${plan.popular ? 'text-amber-400' : 'text-emerald-400'}`} />
                          <p className={`text-xs ${plan.popular ? 'text-amber-400' : 'text-emerald-400'} font-medium`}>
                            Save ${getSavingsAmount()}/{getBillingPeriod()}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* CTA Button */}
                    <button
                      onClick={(e) => handleSubscribe(e, getLink())}
                      disabled={isLoading}
                      className={`w-full font-bold text-sm py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] ${
                        plan.popular 
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-amber-500/30'
                          : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-emerald-500/30'
                      }`}
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
                    <div className="border-t border-gray-800 mb-5 mt-5"></div>

                    {/* Features */}
                    <div className="space-y-2.5">
                      {plan.features.map((feature, featureIndex) => {
                        const Icon = feature.icon;
                        return (
                          <div 
                            key={featureIndex} 
                            className="flex items-center gap-2.5 group/item hover:translate-x-0.5 transition-transform duration-200"
                          >
                            <div className={`flex-shrink-0 w-6 h-6 rounded-lg ${plan.popular ? 'bg-amber-500/10 border-amber-500/20 group-hover/item:bg-amber-500/20' : 'bg-emerald-500/10 border-emerald-500/20 group-hover/item:bg-emerald-500/20'} transition-colors flex items-center justify-center`}>
                              <Icon className={`w-3.5 h-3.5 ${plan.popular ? 'text-amber-400' : 'text-emerald-400'}`} />
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
            );
          })}
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
