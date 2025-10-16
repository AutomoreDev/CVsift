import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Upload, Filter, BarChart3, CheckCircle2, Zap, Shield } from 'lucide-react';

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const pricingTiers = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      cvLimit: '10 CVs',
      features: [
        'Basic filtering (skills, location)',
        '7-day data retention',
        'Email support',
        'Export to CSV'
      ],
      cta: 'Get Started',
      popular: false,
      color: 'gray'
    },
    {
      name: 'Basic',
      price: '$29',
      period: 'per month',
      cvLimit: '500 CVs',
      features: [
        'All filtering options',
        '90-day data retention',
        'Priority email support',
        'Advanced export options',
        'Bulk upload',
        'Email notifications'
      ],
      cta: 'Start Free Trial',
      popular: true,
      color: 'orange'
    },
    {
      name: 'Professional',
      price: '$79',
      period: 'per month',
      cvLimit: '2,000 CVs',
      features: [
        'Everything in Basic',
        'API access',
        '1-year data retention',
        'Advanced analytics dashboard',
        'Team collaboration (3 users)',
        'Custom fields',
        'Priority support'
      ],
      cta: 'Start Free Trial',
      popular: false,
      color: 'purple'
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: 'contact us',
      cvLimit: 'Unlimited',
      features: [
        'Everything in Professional',
        'Custom integrations',
        'Dedicated account manager',
        'SSO & advanced security',
        'White-label option',
        'Custom data retention',
        'SLA guarantee'
      ],
      cta: 'Contact Sales',
      popular: false,
      color: 'lime'
    }
  ];

  const features = [
    {
      icon: Upload,
      title: 'Bulk Upload',
      description: 'Upload hundreds of CVs at once. Support for PDF, Word, and multiple formats.'
    },
    {
      icon: Filter,
      title: 'Smart Filtering',
      description: 'Filter by skills, experience, location, education, and custom criteria.'
    },
    {
      icon: BarChart3,
      title: 'Analytics',
      description: 'Visualize candidate data with powerful charts and insights.'
    },
    {
      icon: Shield,
      title: 'Secure & Compliant',
      description: 'Enterprise-grade security with GDPR compliance built-in.'
    }
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white shadow-md' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">CV</span>
            </div>
            <span className="text-2xl font-bold">Sift</span>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-600 hover:text-orange-500 transition-colors font-medium">Features</a>
            <a href="#pricing" className="text-gray-600 hover:text-orange-500 transition-colors font-medium">Pricing</a>
            <a href="#" className="text-gray-600 hover:text-orange-500 transition-colors font-medium">About</a>
          </div>

          <div className="flex items-center space-x-4">
            <button 
              onClick={() => navigate('/signin')}
              className="text-gray-700 hover:text-orange-500 font-medium transition-colors"
            >
              Sign In
            </button>
            <button 
              onClick={() => navigate('/signup')}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-lg font-medium transition-all hover:scale-105"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center space-x-2 bg-orange-50 text-orange-600 px-4 py-2 rounded-full mb-8">
              <Zap size={16} />
              <span className="text-sm font-medium">Smart CV Filtering Powered by AI</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Filter <span className="text-orange-500">Thousands</span> of CVs in{' '}
              <span className="relative inline-block">
                <span className="relative z-10">Seconds</span>
                <div className="absolute inset-0 bg-purple-400 -rotate-1 rounded-lg opacity-20"></div>
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-12 leading-relaxed">
              Upload bulk CVs and instantly filter by skills, experience, location, and more. 
              Make hiring decisions faster with CVSift.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <button 
                onClick={() => navigate('/signup')}
                className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all hover:scale-105 flex items-center space-x-2 shadow-lg shadow-orange-500/30"
              >
                <span>Start Free Trial</span>
                <ChevronRight size={20} />
              </button>
              <button className="border-2 border-gray-300 hover:border-orange-500 text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg transition-all hover:scale-105">
                Watch Demo
              </button>
            </div>

            {/* Hero Image Placeholder */}
            <div className="relative">
              <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl p-8 shadow-2xl border border-gray-200">
                <div className="bg-white rounded-xl p-6 shadow-inner">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    </div>
                    <div className="text-sm text-gray-400">CVSift Dashboard</div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-orange-200 rounded w-1/2"></div>
                    <div className="h-4 bg-purple-200 rounded w-2/3"></div>
                    <div className="grid grid-cols-3 gap-4 mt-6">
                      <div className="h-24 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg"></div>
                      <div className="h-24 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg"></div>
                      <div className="h-24 bg-gradient-to-br from-lime-100 to-lime-200 rounded-lg"></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-orange-400 rounded-full blur-2xl opacity-50"></div>
              <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-purple-400 rounded-full blur-2xl opacity-50"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Everything You Need to{' '}
              <span className="text-orange-500">Streamline Hiring</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features designed to make CV screening effortless
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, idx) => (
              <div key={idx} className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 border border-gray-100">
                <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center mb-6">
                  <feature.icon className="text-orange-500" size={28} />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Simple, <span className="text-orange-500">Transparent</span> Pricing
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Choose the plan that fits your hiring needs. All plans include a 14-day free trial.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {pricingTiers.map((tier, idx) => (
              <div key={idx} className={`relative bg-white rounded-2xl p-8 border-2 transition-all hover:scale-105 ${
                tier.popular 
                  ? 'border-orange-500 shadow-2xl shadow-orange-500/20' 
                  : 'border-gray-200 hover:border-orange-300'
              }`}>
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </div>
                )}
                
                <div className="mb-6">
                  <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                  <div className="flex items-baseline mb-1">
                    <span className="text-4xl font-bold">{tier.price}</span>
                    {tier.period !== 'contact us' && tier.period !== 'forever' && (
                      <span className="text-gray-500 ml-2">/{tier.period}</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{tier.period === 'contact us' ? '' : tier.period}</p>
                  <div className="mt-4 inline-block bg-gray-100 px-3 py-1 rounded-full">
                    <span className="text-sm font-semibold text-gray-700">{tier.cvLimit}/month</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature, fidx) => (
                    <li key={fidx} className="flex items-start space-x-3">
                      <CheckCircle2 className="text-orange-500 flex-shrink-0 mt-0.5" size={18} />
                      <span className="text-gray-600 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button 
                  onClick={() => navigate('/signup')}
                  className={`w-full py-3 rounded-xl font-semibold transition-all ${
                    tier.popular
                      ? 'bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-500/30'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tier.cta}
                </button>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600">
              Need more CVs? <a href="#" className="text-orange-500 font-semibold hover:underline">Add extra capacity</a> for $15/500 CVs
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-orange-500 to-orange-600 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Transform Your Hiring Process?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join hundreds of companies already using CVSift to find the perfect candidates faster.
          </p>
          <button 
            onClick={() => navigate('/signup')}
            className="bg-white text-orange-500 px-8 py-4 rounded-xl font-semibold text-lg hover:scale-105 transition-all shadow-xl"
          >
            Start Your Free Trial
          </button>
          <p className="mt-4 text-sm opacity-75">No credit card required • 14-day free trial</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">CV</span>
                </div>
                <span className="text-white text-xl font-bold">Sift</span>
              </div>
              <p className="text-sm">Making hiring decisions faster with intelligent CV filtering.</p>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-orange-500 transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-orange-500 transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-orange-500 transition-colors">API</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-orange-500 transition-colors">About</a></li>
                <li><a href="#" className="hover:text-orange-500 transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-orange-500 transition-colors">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-orange-500 transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-orange-500 transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-orange-500 transition-colors">GDPR</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>&copy; 2024 CVSift. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}