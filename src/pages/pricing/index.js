import { useState } from 'react';
import { Check, X, Zap, BarChart3, Shield, Users, Briefcase, Award, ChevronRight, Sparkles, Star,Crown, Building2, TrendingUp, Rocket, CheckCircle } from 'lucide-react';

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '0',
    yearlyPrice: '0',
    description: 'Perfect for trying out',
    features: [
      '2 quizzes/month',
      '2 questions max',
      'Unlimited attempts',
      'Basic security',
      'Community support',
    ],
    icon: Sparkles,
    gradient: 'from-gray-600 to-gray-700',
  },
  {
    id: 'consumer',
    name: 'Consumer',
    price: '2.99',
    yearlyPrice: '28.70',
    description: 'For regular users',
    features: [
      '10 quizzes/month',
      '60 questions max',
      'View answers',
      'Basic security',
      'Email support',
    ],
    icon: Star,
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'consumer-elite',
    name: 'Elite',
    price: '9.99',
    yearlyPrice: '95.90',
    description: 'For power users',
    features: [
      '30 quizzes/month',
      '150 questions max',
      'View answers',
      'Advanced security',
      'Priority support (24h)',
      'Performance insights',
    ],
    icon: Crown,
    gradient: 'from-purple-500 to-pink-500',
    featured: true,
  },
  {
    id: 'business',
    name: 'Business',
    price: '99',
    yearlyPrice: '950',
    description: 'For teams',
    features: [
      '10 quizzes/month',
      '100 questions max',
      'Quiz customization',
      'Advanced proctoring',
      'Analytics dashboard',
      'Priority support (12h)',
    ],
    icon: Building2,
    gradient: 'from-orange-500 to-red-500',
  },
  {
    id: 'business-elite',
    name: 'Business+',
    price: '199',
    yearlyPrice: '1910',
    description: 'For growing teams',
    features: [
      '30 quizzes/month',
      '200 questions max',
      'All Business features',
      'Advanced analytics',
      'Data export (CSV/Excel)',
      'Priority support (6h)'
    ],
    icon: TrendingUp,
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    yearlyPrice: 'Custom',
    description: 'For organizations',
    features: [
      'Unlimited everything',
      'Custom integrations',
      'White-label solution',
      'Dedicated manager',
      '24/7 support (1h)',
      'SLA guarantees',
    ],
    icon: Rocket,
    gradient: 'from-violet-500 to-indigo-500',
  },
];

const PricingPage = () => {
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [hoveredCard, setHoveredCard] = useState(null);

  return (
    <div className="min-h-screen bg-black">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-6">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-400">Simple & Transparent Pricing</span>
          </div>
          
          <h1 className="text-6xl md:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
              Choose Your Plan
            </span>
          </h1>
          
          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10">
            Flexible pricing that scales with your needs
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-3 p-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-white text-black shadow-lg'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all relative ${
                billingCycle === 'yearly'
                  ? 'bg-white text-black shadow-lg'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Yearly
              <span className="absolute -top-2 -right-2 px-1.5 py-0.5 bg-green-500 text-white text-xs rounded-full">-20%</span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-20">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            const displayPrice = billingCycle === 'yearly' ? plan.yearlyPrice : plan.price;
            const displayPeriod = billingCycle === 'yearly' ? '/yr' : '/mo';
            
            return (
              <div
                key={plan.id}
                onMouseEnter={() => setHoveredCard(index)}
                onMouseLeave={() => setHoveredCard(null)}
                className={`relative group transition-all duration-500 ${
                  hoveredCard === index ? 'scale-105 z-10' : ''
                } ${plan.featured ? 'md:col-span-1' : ''}`}
              >
                {plan.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                    <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${plan.gradient} text-white text-xs font-bold shadow-lg`}>
                      POPULAR
                    </div>
                  </div>
                )}

                <div className={`h-full p-6 rounded-2xl border backdrop-blur-xl transition-all duration-500 ${
                  plan.featured
                    ? 'bg-gradient-to-br from-white/10 to-white/5 border-white/20 shadow-2xl'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                } ${hoveredCard === index ? 'shadow-2xl shadow-purple-500/20' : ''}`}>
                  
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>

                  {/* Plan Name */}
                  <h3 className="text-lg font-bold text-white mb-1">{plan.name}</h3>
                  <p className="text-xs text-gray-500 mb-4">{plan.description}</p>

                  {/* Price */}
                  <div className="mb-6">
                    {displayPrice === "Custom" ? (
                      <div className="text-2xl font-bold text-white">Custom</div>
                    ) : (
                      <div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-bold text-white">${displayPrice}</span>
                          <span className="text-gray-500 text-sm">{displayPeriod}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-2.5 mb-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-gray-400">
                        <Check className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <button className={`w-full py-2.5 rounded-lg font-medium text-sm transition-all duration-300 ${
                    plan.featured
                      ? `bg-gradient-to-r ${plan.gradient} text-white shadow-lg hover:shadow-xl hover:scale-105`
                      : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                  }`}>
                    {plan.id === 'free' ? 'Get Started' : plan.id.includes('enterprise') ? 'Contact Us' : 'Subscribe'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Comparison Table */}
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-3">Feature Comparison</h2>
            <p className="text-gray-500">Everything you need to know</p>
          </div>

          <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="py-4 px-6 text-left text-xs font-semibold text-gray-400 uppercase">Feature</th>
                    <th className="py-4 px-4 text-center text-xs font-semibold text-gray-400 uppercase">Free</th>
                    <th className="py-4 px-4 text-center text-xs font-semibold text-gray-400 uppercase">Consumer</th>
                    <th className="py-4 px-4 text-center text-xs font-semibold text-purple-400 uppercase">Elite</th>
                    <th className="py-4 px-4 text-center text-xs font-semibold text-gray-400 uppercase">Business</th>
                    <th className="py-4 px-4 text-center text-xs font-semibold text-gray-400 uppercase">Business+</th>
                    <th className="py-4 px-4 text-center text-xs font-semibold text-gray-400 uppercase">Enterprise</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <tr className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-6 text-sm text-white">Monthly Quizzes</td>
                    <td className="py-3 px-4 text-sm text-center text-gray-400">2</td>
                    <td className="py-3 px-4 text-sm text-center text-gray-400">10</td>
                    <td className="py-3 px-4 text-sm text-center text-purple-400 font-medium">30</td>
                    <td className="py-3 px-4 text-sm text-center text-gray-400">10</td>
                    <td className="py-3 px-4 text-sm text-center text-gray-400">30</td>
                    <td className="py-3 px-4 text-sm text-center text-gray-400">Unlimited</td>
                  </tr>
                  <tr className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-6 text-sm text-white">Questions/Quiz</td>
                    <td className="py-3 px-4 text-sm text-center text-gray-400">2</td>
                    <td className="py-3 px-4 text-sm text-center text-gray-400">60</td>
                    <td className="py-3 px-4 text-sm text-center text-purple-400 font-medium">150</td>
                    <td className="py-3 px-4 text-sm text-center text-gray-400">100</td>
                    <td className="py-3 px-4 text-sm text-center text-gray-400">200</td>
                    <td className="py-3 px-4 text-sm text-center text-gray-400">Unlimited</td>
                  </tr>
                  <tr className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-6 text-sm text-white">View Answers</td>
                    <td className="py-3 px-4"><X className="w-4 h-4 mx-auto text-red-500/50" /></td>
                    <td className="py-3 px-4"><Check className="w-4 h-4 mx-auto text-green-500" /></td>
                    <td className="py-3 px-4"><Check className="w-4 h-4 mx-auto text-green-500" /></td>
                    <td className="py-3 px-4"><Check className="w-4 h-4 mx-auto text-green-500" /></td>
                    <td className="py-3 px-4"><Check className="w-4 h-4 mx-auto text-green-500" /></td>
                    <td className="py-3 px-4"><Check className="w-4 h-4 mx-auto text-green-500" /></td>
                  </tr>
                  <tr className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-6 text-sm text-white">Advanced Security</td>
                    <td className="py-3 px-4"><X className="w-4 h-4 mx-auto text-red-500/50" /></td>
                    <td className="py-3 px-4"><X className="w-4 h-4 mx-auto text-red-500/50" /></td>
                    <td className="py-3 px-4"><Check className="w-4 h-4 mx-auto text-green-500" /></td>
                    <td className="py-3 px-4"><Check className="w-4 h-4 mx-auto text-green-500" /></td>
                    <td className="py-3 px-4"><Check className="w-4 h-4 mx-auto text-green-500" /></td>
                    <td className="py-3 px-4"><Check className="w-4 h-4 mx-auto text-green-500" /></td>
                  </tr>
                  <tr className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-6 text-sm text-white">Analytics</td>
                    <td className="py-3 px-4"><X className="w-4 h-4 mx-auto text-red-500/50" /></td>
                    <td className="py-3 px-4"><X className="w-4 h-4 mx-auto text-red-500/50" /></td>
                    <td className="py-3 px-4"><X className="w-4 h-4 mx-auto text-red-500/50" /></td>
                    <td className="py-3 px-4 text-xs text-gray-400">Basic</td>
                    <td className="py-3 px-4 text-xs text-gray-400">Advanced</td>
                    <td className="py-3 px-4 text-xs text-gray-400">Custom</td>
                  </tr>
                  <tr className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-6 text-sm text-white">Data Export</td>
                    <td className="py-3 px-4"><X className="w-4 h-4 mx-auto text-red-500/50" /></td>
                    <td className="py-3 px-4"><X className="w-4 h-4 mx-auto text-red-500/50" /></td>
                    <td className="py-3 px-4"><X className="w-4 h-4 mx-auto text-red-500/50" /></td>
                    <td className="py-3 px-4"><X className="w-4 h-4 mx-auto text-red-500/50" /></td>
                    <td className="py-3 px-4"><Check className="w-4 h-4 mx-auto text-green-500" /></td>
                    <td className="py-3 px-4"><Check className="w-4 h-4 mx-auto text-green-500" /></td>
                  </tr>
                  <tr className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-6 text-sm text-white">Support Response</td>
                    <td className="py-3 px-4 text-xs text-center text-gray-500">Community</td>
                    <td className="py-3 px-4 text-xs text-center text-gray-500">Email</td>
                    <td className="py-3 px-4 text-xs text-center text-purple-400 font-medium">24h</td>
                    <td className="py-3 px-4 text-xs text-center text-gray-500">12h</td>
                    <td className="py-3 px-4 text-xs text-center text-gray-500">6h</td>
                    <td className="py-3 px-4 text-xs text-center text-gray-500">1h (24/7)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <div className="inline-block p-8 rounded-2xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 backdrop-blur-xl">
            <h3 className="text-2xl font-bold text-white mb-3">Need help choosing?</h3>
            <p className="text-gray-400 mb-6 max-w-md">Our team is ready to help you find the perfect plan</p>
            <button className="px-8 py-3 bg-white text-black rounded-lg font-medium hover:scale-105 transition-transform">
              Talk to Sales
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default PricingPage;