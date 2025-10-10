import { useState } from 'react';
import { Check, X, Sparkles, Star, Crown, Building2, Rocket } from 'lucide-react';
import Head from 'next/head';
import {Footer} from '@/components/Footer';
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
      '60 questions per quiz',
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
      '150 questions per quiz',
      'View correct answers',
      'Advanced Proctoring',
      'Priority support'
    ],
    icon: Crown,
    gradient: 'from-purple-400 to-pink-500',
  },
  {
    id: 'business',
    name: 'Business',
    price: '99',
    yearlyPrice: '959',
    tagline: 'Most value for teams',
    recommended: true,
    features: [
      '30 quizzes per month',
      '200 questions per quiz',
      'Advanced Proctoring',
      'Advanced Analytics',
      'Data export (Excel, PDF)',
      'Priority support',
      'Customizable quiz settings'],
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
    <>
    <Head>
      <title>Pricing | QuizzViz</title>
    </Head>
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        {/* Header */}
        <div className="text-center mb-14">
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
              <span className="absolute -top-2.5 -right-2.5 px-2 py-0.5 bg-gradient-to-r from-green-400 to-emerald-500 text-white text-[11px] font-bold rounded-full shadow-lg ">
                -20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-16">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const displayPrice = billingCycle === 'yearly' ? plan.yearlyPrice : plan.price;
            const isEnterprise = plan.id === 'enterprise';
            
            return (
              <div
                key={plan.id}
                className="relative group transition-all duration-500 hover:scale-105"
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                    <div className="px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 bg-[length:200%_100%] animate-gradient text-white text-xs font-bold shadow-2xl shadow-purple-500/50 border border-white/20">
                      MOST POPULAR
                    </div>
                  </div>
                )}

                {plan.recommended && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                    <div className="px-4 py-1.5 rounded-full bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400 bg-[length:200%_100%] animate-gradient text-black text-xs font-bold shadow-2xl shadow-emerald-500/50">
                      RECOMMENDED
                    </div>
                  </div>
                )}

                <div
                  className={`relative h-full p-6 rounded-2xl border backdrop-blur-xl transition-all duration-500 overflow-hidden ${
                    plan.popular
                      ? 'bg-gradient-to-br from-purple-950/40 via-pink-950/30 to-purple-950/40 border-purple-700/50 shadow-2xl shadow-purple-500/20 ring-2 ring-purple-500/30'
                      : plan.recommended
                      ? 'bg-gradient-to-br from-emerald-950/50 via-teal-950/40 to-emerald-950/50 border-emerald-700/50 shadow-2xl shadow-emerald-500/20 ring-2 ring-emerald-500/30'
                      : 'bg-zinc-900/40 border-zinc-800/50 hover:bg-zinc-900/60 hover:border-zinc-700/50 hover:shadow-xl'
                  }`}
                >
                  {/* Gradient overlay */}
                  {plan.popular && (
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-pink-500/10 pointer-events-none"></div>
                  )}
                  {plan.recommended && (
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-teal-500/10 pointer-events-none"></div>
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
                            <div className="text-sm text-emerald-400">
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
                          ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 bg-[length:200%_100%] text-white shadow-lg shadow-purple-500/40 hover:shadow-purple-500/60 hover:scale-105 animate-gradient'
                          : plan.recommended
                          ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 bg-[length:200%_100%] text-black shadow-lg shadow-emerald-500/40 hover:shadow-emerald-500/60 hover:scale-105 animate-gradient'
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

        {/* Feature Comparison Table */}
        <div className="max-w-6xl mx-auto mb-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Compare All Features
            </h2>
            <p className="text-gray-400">See what's included in each plan at a glance</p>
          </div>

          <div className="rounded-2xl bg-zinc-900/40 border border-zinc-800/50 overflow-hidden backdrop-blur-xl">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="py-5 px-6 text-left text-sm font-bold text-white bg-zinc-900/60">Features</th>
                    <th className="py-5 px-4 text-center text-sm font-semibold text-gray-300 bg-zinc-900/40">Free</th>
                    <th className="py-5 px-4 text-center text-sm font-semibold text-gray-300 bg-zinc-900/40">Consumer</th>
                    <th className="py-5 px-4 text-center text-sm font-semibold text-gray-300 bg-zinc-900/40">Elite</th>
                    <th className="py-5 px-4 text-center text-sm font-semibold text-emerald-400 bg-emerald-950/20">Business</th>
                    <th className="py-5 px-4 text-center text-sm font-semibold text-gray-300 bg-zinc-900/40">Enterprise</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  <tr className="hover:bg-zinc-900/30 transition-colors">
                    <td className="py-4 px-6 text-sm font-medium text-white">Monthly Quizzes</td>
                    <td className="py-4 px-4 text-sm text-center text-gray-400">2</td>
                    <td className="py-4 px-4 text-sm text-center text-gray-400">10</td>
                    <td className="py-4 px-4 text-sm text-center text-gray-400">30</td>
                    <td className="py-4 px-4 text-sm text-center text-emerald-400 font-semibold bg-emerald-950/10">30</td>
                    <td className="py-4 px-4 text-sm text-center text-gray-400">Unlimited</td>
                  </tr>
                  <tr className="hover:bg-zinc-900/30 transition-colors">
                    <td className="py-4 px-6 text-sm font-medium text-white">Questions per Quiz</td>
                    <td className="py-4 px-4 text-sm text-center text-gray-400">10</td>
                    <td className="py-4 px-4 text-sm text-center text-gray-400">60</td>
                    <td className="py-4 px-4 text-sm text-center text-gray-400">150</td>
                    <td className="py-4 px-4 text-sm text-center text-emerald-400 font-semibold bg-emerald-950/10">200</td>
                    <td className="py-4 px-4 text-sm text-center text-gray-400">Unlimited</td>
                  </tr>
                  <tr className="hover:bg-zinc-900/30 transition-colors">
                    <td className="py-4 px-6 text-sm font-medium text-white">View Correct Answers</td>
                    <td className="py-4 px-4"><X className="w-5 h-5 mx-auto text-red-400/60" /></td>
                    <td className="py-4 px-4"><Check className="w-5 h-5 mx-auto text-green-400" /></td>
                    <td className="py-4 px-4"><Check className="w-5 h-5 mx-auto text-green-400" /></td>
                    <td className="py-4 px-4 bg-emerald-950/10"><Check className="w-5 h-5 mx-auto text-emerald-400" /></td>
                    <td className="py-4 px-4"><Check className="w-5 h-5 mx-auto text-green-400" /></td>
                  </tr>
                  <tr className="hover:bg-zinc-900/30 transition-colors">
                    <td className="py-4 px-6 text-sm font-medium text-white">Proctoring Level</td>
                    <td className="py-4 px-4 text-xs text-center text-gray-500">Intermediate</td>
                    <td className="py-4 px-4 text-xs text-center text-gray-500">Intermediate</td>
                    <td className="py-4 px-4 text-xs text-center text-gray-400">Advanced</td>
                    <td className="py-4 px-4 text-xs text-center text-emerald-400 font-semibold bg-emerald-950/10">Advanced</td>
                    <td className="py-4 px-4 text-xs text-center text-gray-400">Advanced</td>
                  </tr>
                  <tr className="hover:bg-zinc-900/30 transition-colors">
                    <td className="py-4 px-6 text-sm font-medium text-white">Analytics Dashboard</td>
                    <td className="py-4 px-4"><X className="w-5 h-5 mx-auto text-red-400/60" /></td>
                    <td className="py-4 px-4"><X className="w-5 h-5 mx-auto text-red-400/60" /></td>
                    <td className="py-4 px-4"><X className="w-5 h-5 mx-auto text-red-400/60" /></td>
                    <td className="py-4 px-4 text-xs text-center text-emerald-400 font-semibold bg-emerald-950/10">Advanced</td>
                    <td className="py-4 px-4 text-xs text-center text-gray-400">Custom</td>
                  </tr>
                  <tr className="hover:bg-zinc-900/30 transition-colors">
                    <td className="py-4 px-6 text-sm font-medium text-white">Data Export</td>
                    <td className="py-4 px-4"><X className="w-5 h-5 mx-auto text-red-400/60" /></td>
                    <td className="py-4 px-4"><X className="w-5 h-5 mx-auto text-red-400/60" /></td>
                    <td className="py-4 px-4"><X className="w-5 h-5 mx-auto text-red-400/60" /></td>
                    <td className="py-4 px-4 bg-emerald-950/10"><Check className="w-5 h-5 mx-auto text-emerald-400" /></td>
                    <td className="py-4 px-4"><Check className="w-5 h-5 mx-auto text-green-400" /></td>
                  </tr>
                  <tr className="hover:bg-zinc-900/30 transition-colors">
                    <td className="py-4 px-6 text-sm font-medium text-white">Customizable Settings</td>
                    <td className="py-4 px-4"><X className="w-5 h-5 mx-auto text-red-400/60" /></td>
                    <td className="py-4 px-4"><X className="w-5 h-5 mx-auto text-red-400/60" /></td>
                    <td className="py-4 px-4"><X className="w-5 h-5 mx-auto text-red-400/60" /></td>
                    <td className="py-4 px-4 bg-emerald-950/10"><Check className="w-5 h-5 mx-auto text-emerald-400" /></td>
                    <td className="py-4 px-4"><Check className="w-5 h-5 mx-auto text-green-400" /></td>
                  </tr>
                  <tr className="hover:bg-zinc-900/30 transition-colors">
                    <td className="py-4 px-6 text-sm font-medium text-white">Support Response</td>
                    <td className="py-4 px-4 text-xs text-center text-gray-500">Community</td>
                    <td className="py-4 px-4 text-xs text-center text-gray-500">Email</td>
                    <td className="py-4 px-4 text-xs text-center text-gray-400">Priority</td>
                    <td className="py-4 px-4 text-xs text-center text-emerald-400 font-semibold bg-emerald-950/10">Priority</td>
                    <td className="py-4 px-4 text-xs text-center text-gray-400">Dedicated</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="inline-block max-w-2xl p-10 rounded-2xl bg-gradient-to-br from-zinc-900/80 to-zinc-900/60 border border-zinc-800/50 shadow-2xl backdrop-blur-xl">
            <h3 className="text-3xl font-bold text-white mb-3">
              Need help choosing?
            </h3>
            <p className="text-base text-gray-400 mb-8 leading-relaxed">
              Our team is here to help you find the perfect plan for your organization
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
    <Footer />
    </>
  );
};

export default PricingPage;