import React, { useState, useEffect } from 'react';
import { Upload, Zap, Target, ArrowRight, Check, Menu, X } from 'lucide-react';

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: <Upload className="w-8 h-8" />,
      title: "Upload & Parse",
      description: "Drop your CV and watch AI extract every detail instantly"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Smart Matching",
      description: "Get matched with perfect job opportunities in seconds"
    },
    {
      icon: <Target className="w-8 h-8" />,
      title: "Track Success",
      description: "Monitor applications and optimize your job search strategy"
    }
  ];

  const pricingTiers = [
    {
      name: "Starter",
      price: "Free",
      features: ["5 CV uploads/month", "Basic matching", "Email support"],
      cta: "Get Started",
      highlighted: false
    },
    {
      name: "Pro",
      price: "$19",
      period: "/month",
      features: ["Unlimited uploads", "Advanced AI matching", "Priority support", "Analytics dashboard"],
      cta: "Start Free Trial",
      highlighted: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      features: ["Custom solutions", "API access", "Dedicated support", "Team collaboration"],
      cta: "Contact Sales",
      highlighted: false
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-animated text-white overflow-x-hidden">
      {/* Navigation */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'nav-blur' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold gradient-text">
              CVsift
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="hover:text-[#06B6D4] transition-colors">Features</a>
              <a href="#pricing" className="hover:text-[#06B6D4] transition-colors">Pricing</a>
              <a href="#about" className="hover:text-[#06B6D4] transition-colors">About</a>
              <button className="px-6 py-2 bg-[#8B5CF6] hover:bg-[#7C3AED] rounded-lg transition-colors">
                Sign In
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden mt-4 pb-4 space-y-4 mobile-menu">
              <a href="#features" className="block hover:text-[#06B6D4] transition-colors">Features</a>
              <a href="#pricing" className="block hover:text-[#06B6D4] transition-colors">Pricing</a>
              <a href="#about" className="block hover:text-[#06B6D4] transition-colors">About</a>
              <button className="w-full px-6 py-2 bg-[#8B5CF6] hover:bg-[#7C3AED] rounded-lg transition-all hover-scale">Sign In</button>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 particles-bg">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-8 fade-in">
            <div className="inline-block px-4 py-2 bg-[#8B5CF6]/20 border border-[#8B5CF6]/30 rounded-full text-[#8B5CF6] text-sm font-medium animate-pulse-slow glow">
              ✨ AI-Powered CV Management
            </div>

            <h1 className="text-5xl md:text-7xl font-bold leading-tight hero-title text-shadow">
              Stop Searching.
              <br />
              <span className="gradient-text">
                Start Matching.
              </span>
            </h1>

            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Upload your CV once. Let AI do the heavy lifting. Get matched with your dream job faster than ever.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button className="group btn-primary flex items-center gap-2 glow-hover">
                Get Started Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="btn-secondary">
                Watch Demo
              </button>
            </div>

            {/* Stats */}
            <div className="pt-12 grid grid-cols-3 gap-8 max-w-3xl mx-auto">
              <div className="hover-lift">
                <div className="stat-number text-[#06B6D4]">50K+</div>
                <div className="text-gray-400 text-sm">CVs Processed</div>
              </div>
              <div className="hover-lift">
                <div className="stat-number text-[#8B5CF6]">95%</div>
                <div className="text-gray-400 text-sm">Match Accuracy</div>
              </div>
              <div className="hover-lift">
                <div className="stat-number text-[#06B6D4]">10K+</div>
                <div className="text-gray-400 text-sm">Happy Users</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-[#0F1F3A]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              How <span className="text-[#8B5CF6]">CVsift</span> Works
            </h2>
            <p className="text-gray-400 text-lg">Simple, fast, and incredibly powerful</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="feature-card"
              >
                <div className="feature-icon">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Simple, <span className="text-[#06B6D4]">Transparent</span> Pricing
            </h2>
            <p className="text-gray-400 text-lg">Choose the plan that fits your needs</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {pricingTiers.map((tier, index) => (
              <div
                key={index}
                className={`pricing-card ${
                  tier.highlighted
                    ? 'pricing-card-featured'
                    : 'pricing-card-standard'
                }`}
              >
                {tier.highlighted && (
                  <div className="text-[#06B6D4] text-sm font-bold mb-4">MOST POPULAR</div>
                )}
                <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                <div className="mb-6">
                  <span className="text-5xl font-bold">{tier.price}</span>
                  {tier.period && <span className="text-gray-400">{tier.period}</span>}
                </div>

                <ul className="space-y-4 mb-8">
                  {tier.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-[#06B6D4] flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button className={`w-full py-3 rounded-lg font-semibold transition-all ${
                  tier.highlighted
                    ? 'bg-[#06B6D4] hover:bg-[#0E7490] text-white'
                    : 'bg-[#8B5CF6] hover:bg-[#7C3AED] text-white'
                }`}>
                  {tier.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section py-20 px-6 bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4]">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-shadow">
            Ready to Transform Your Job Search?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of professionals who've found their dream jobs with CVsift
          </p>
          <button className="px-10 py-4 bg-white text-[#8B5CF6] hover:bg-gray-100 rounded-lg font-bold text-lg transition-all hover-scale shadow-2xl">
            Start Your Free Trial
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-[#0A1628] border-t border-[#8B5CF6]/20">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="text-2xl font-bold gradient-text mb-4">
                CVsift
              </div>
              <p className="text-gray-400">AI-powered CV management for modern job seekers</p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Product</h4>
              <ul className="space-y-2">
                <li><a href="#" className="footer-link">Features</a></li>
                <li><a href="#" className="footer-link">Pricing</a></li>
                <li><a href="#" className="footer-link">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="footer-link">About</a></li>
                <li><a href="#" className="footer-link">Blog</a></li>
                <li><a href="#" className="footer-link">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><a href="#" className="footer-link">Privacy</a></li>
                <li><a href="#" className="footer-link">Terms</a></li>
                <li><a href="#" className="footer-link">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-[#8B5CF6]/20 text-center text-gray-400">
            <p>© 2025 CVsift. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
