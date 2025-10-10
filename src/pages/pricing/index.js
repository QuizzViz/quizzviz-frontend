import { useState } from 'react';
import { Check, Sparkles, Star, Crown, Building2, Rocket } from 'lucide-react';

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '0',
    yearlyPrice: '0',
    tagline: 'Get started for free',
    features: [
      '2 quizzes per month',
      '10 questions per quiz',
      'Unlimited attempts',
      'Intermediate Proctoring',
      'Community support'
    ],
    icon: Sparkles,
    gradient: 'from-slate-400 to-slate-500',
  },
  {
    id: 'consumer',
    name: 'Consumer',
    price: '2.99',
    yearlyPrice: '28.70',
    tagline: 'Perfect for individuals',
    features: [
      '10 quizzes per month',
      'Up to 60 questions',
      'View correct answers',
      'Intermediate Proctoring',
      'Email support',
    ],
    icon: Star,
    gradient: 'from-blue-400 to-blue-600',
  },
  {
    id: 'elite',
    name: 'Elite',
    price: '9.99',
    yearlyPrice: '95.90',
    tagline: 'Best for power users',
    popular: true,
    features: [
      '30 quizzes per month',
      'Up to 150 questions',
      'View correct answers',
      'Advanced Proctoring',
      'Priority support',
      'Performance insights',
    ],
    icon: Crown,
    gradient: 'from-purple-400 to-pink-500',
  },
  {
    id: 'business',
    name: 'Business',
    price: '99',
    yearlyPrice: '959',
    tagline: 'For teams & companies',
    features: [
      '30 quizzes per month',
      'Up to 200 questions',
      'Advanced Proctoring',
      'Advanced Analytics',
      'Data export options (Excel, PDF)',
      'Priority support',
      'Customizable quiz settings: quiz key, time, attempts, questions'],
    icon: Building2,
    gradient: 'from-emerald-400 to-teal-500',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    yearlyPrice: 'Custom',
    tagline: 'Tailored to your needs',
    features: [
      'Unlimited quizzes',
      'Unlimited questions',
      'Custom integrations',
      'White-label solution',
      'Dedicated support',
      'SLA guarantees',
      'Custom Features'
    ],
    icon: Rocket,
    gradient: 'from-violet-400 to-indigo-500',
  },
];

const PricingPage = () => {
  const [billingCycle, setBillingCycle] = useState('monthly');

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl sm:text-6xl font-bold text-white mb-4 tracking-tight">
            Choose Your Plan
          </h1>
          
          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-10">
            Select the perfect plan for your needs
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-1 p-1.5 rounded-full bg-zinc-900/80 border border-zinc-800 backdrop-blur-sm shadow-xl">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                billingCycle === 'monthly'
                  ? 'bg-white text-black shadow-lg scale-105'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 relative ${
                billingCycle === 'yearly'
                  ? 'bg-white text-black shadow-lg scale-105'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Yearly
              <span className="absolute -top-2.5 -right-2.5 px-2 py-0.5 bg-gradient-to-r from-green-400 to-emerald-500 text-white text-[11px] font-bold rounded-full shadow-lg animate-pulse">
                -20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-20">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const displayPrice = billingCycle === 'yearly' ? plan.yearlyPrice : plan.price;
            const isEnterprise = plan.id === 'enterprise';
            
            return (
              <div
                key={plan.id}
                className={`relative group transition-all duration-500 ${
                  plan.popular ? 'lg:scale-110 lg:z-10' : 'hover:scale-105'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                    <div className="px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 bg-[length:200%_100%] animate-gradient text-white text-xs font-bold shadow-2xl shadow-purple-500/50 border border-white/20">
                      MOST POPULAR
                    </div>
                  </div>
                )}

                <div
                  className={`relative h-full p-6 rounded-2xl border backdrop-blur-xl transition-all duration-500 overflow-hidden ${
                    plan.popular
                      ? 'bg-gradient-to-br from-zinc-900/90 via-zinc-900/80 to-zinc-900/90 border-zinc-700/50 shadow-2xl shadow-purple-500/20'
                      : 'bg-zinc-900/40 border-zinc-800/50 hover:bg-zinc-900/60 hover:border-zinc-700/50 hover:shadow-xl'
                  }`}
                >
                  {/* Gradient overlay for popular card */}
                  {plan.popular && (
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5 pointer-events-none"></div>
                  )}

                  {/* Content */}
                  <div className="relative z-10">
                    {/* Icon */}
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>

                    {/* Plan Details */}
                    <h3 className="text-xl font-bold text-white mb-1.5">{plan.name}</h3>
                    <p className="text-sm text-gray-400 mb-6">{plan.tagline}</p>

                    {/* Price */}
                    <div className="mb-6">
                      {isEnterprise ? (
                        <div>
                          <div className="text-4xl font-bold text-white mb-1">Custom</div>
                          <div className="text-xs text-gray-500">Contact for pricing</div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-baseline gap-1 mb-1">
                            <span className="text-4xl font-bold text-white">${displayPrice}</span>
                            <span className="text-base text-gray-400">
                              {billingCycle === 'yearly' ? '/yr' : '/mo'}
                            </span>
                          </div>
                          {billingCycle === 'yearly' && !isEnterprise && (
                            <div className="text-sm text-gray-500">
                              ${(parseFloat(displayPrice) / 12).toFixed(2)}/month billed yearly
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* CTA Button */}
                    <button
                      className={`w-full py-3 rounded-xl text-sm font-bold transition-all duration-300 mb-6 ${
                        plan.popular
                          ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 bg-[length:200%_100%] text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105 animate-gradient'
                          : isEnterprise
                          ? 'bg-white text-black hover:bg-gray-100 shadow-lg hover:shadow-xl hover:scale-105'
                          : 'bg-zinc-800 text-white hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 hover:scale-105'
                      }`}
                    >
                      {isEnterprise ? 'Contact Sales' : plan.id === 'free' ? 'Get Started Free' : 'Get Started'}
                    </button>

                    {/* Features */}
                    <ul className="space-y-3">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${plan.gradient} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                            <Check className="w-3 h-3 text-white" />
                          </div>
                          <span className="text-sm text-gray-300 leading-relaxed">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="inline-block max-w-2xl p-10 rounded-2xl bg-gradient-to-br from-zinc-900/80 to-zinc-900/60 border border-zinc-800/50 shadow-2xl backdrop-blur-xl">
            <h3 className="text-3xl font-bold text-white mb-3">
              Questions about pricing?
            </h3>
            <p className="text-base text-gray-400 mb-8 leading-relaxed">
              Our sales team is ready to help you find the right plan for your needs
            </p>
            <button className="px-8 py-3.5 bg-white text-black rounded-xl text-sm font-bold hover:bg-gray-100 transition-all hover:scale-110 shadow-lg hover:shadow-xl">
              Contact Sales
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient {
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  );
};

export default PricingPage;