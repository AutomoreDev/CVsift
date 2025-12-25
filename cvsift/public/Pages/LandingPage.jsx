import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Upload, Filter, BarChart3, CheckCircle2, Zap, Shield, FileText, Search, Users, Download, Sparkles, Folder, Clock, TrendingUp, Star, Menu, X, Scale, Palette } from 'lucide-react';
import useCurrency from '../hooks/useCurrency';
import { CompactCurrencySelector } from '../components/CurrencySelector';

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [hoveredStep, setHoveredStep] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState(null);
  const [showMatches, setShowMatches] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [heroVisible, setHeroVisible] = useState(false);
  const navigate = useNavigate();
  const { convertAndFormat, loading: currencyLoading } = useCurrency();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    setHeroVisible(true);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const dummyFiles = [
      { name: 'CV_John_Doe.pdf', status: 'uploading' },
      { name: 'CV_Jane_Smith.docx', status: 'uploading' },
      { name: 'CV_Mike_Johnson.pdf', status: 'uploading' }
    ];

    setUploadedFiles(dummyFiles);
    setIsProcessing(true);

    dummyFiles.forEach((_, index) => {
      setTimeout(() => {
        setUploadedFiles(prev =>
          prev.map((file, i) =>
            i === index ? { ...file, status: 'completed' } : file
          )
        );

        if (index === dummyFiles.length - 1) {
          setTimeout(() => {
            setIsProcessing(false);
            setCompletedSteps([1]);
          }, 1000);
        }
      }, (index + 1) * 800);
    });
  };

  const handleClick = () => {
    if (!isProcessing && uploadedFiles.length === 0) {
      handleDrop({ preventDefault: () => {} });
    }
  };

  useEffect(() => {
    if (completedSteps.includes(1) && !completedSteps.includes(2)) {
      const timer = setTimeout(() => {
        setCompletedSteps([1, 2]);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [completedSteps]);

  const handleFilterClick = (filterType) => {
    if (completedSteps.includes(2) && !completedSteps.includes(3)) {
      setSelectedFilter(filterType);
      setShowMatches(true);

      setTimeout(() => {
        setCompletedSteps([1, 2, 3]);
      }, 1000);
    }
  };

  const resetDemo = () => {
    setUploadedFiles([]);
    setIsProcessing(false);
    setCompletedSteps([]);
    setSelectedFilter(null);
    setShowMatches(false);
  };

  const pricingTiers = [
    {
      name: 'Free',
      priceZAR: 0,
      period: 'forever',
      cvLimit: '10 CVs',
      description: 'Perfect for small teams getting started',
      features: [
        'Basic filtering (skills, location)',
        'Email support',
        'Advanced analytics'
      ],
      cta: 'Get Started Free',
      popular: false,
      color: 'gray'
    },
    {
      name: 'Starter',
      priceZAR: 199,
      period: 'per month',
      cvLimit: '50 CVs',
      description: 'For small teams with regular hiring',
      features: [
        'Basic + advanced filtering',
        'Email support',
        'Bulk upload',
        'Job spec creation',
        'Email notifications',
        'Advanced analytics'
      ],
      cta: 'Get Started',
      popular: false,
      color: 'blue'
    },
    {
      name: 'Basic',
      priceZAR: 399,
      period: 'per month',
      cvLimit: '150 CVs',
      description: 'For growing teams with regular hiring needs',
      features: [
        'All filtering options',
        'Priority email support',
        'Advanced analytics',
        'Bulk upload',
        'Email notifications',
        'Match CVs to job specs'
      ],
      cta: 'Get Started',
      popular: true,
      color: 'orange'
    },
    {
      name: 'Professional',
      priceZAR: 999,
      period: 'per month',
      cvLimit: '600 CVs',
      description: 'For scaling organizations',
      features: [
        'Everything in Basic',
        'EEA Compliance Tracking',
        'AI Chatbot Assistant',
        'API access',
        'Team collaboration (3 users)',
        'Custom fields',
        'Priority support'
      ],
      cta: 'Get Started',
      popular: false,
      color: 'purple'
    },
    {
      name: 'Business',
      priceZAR: 1999,
      period: 'per month',
      cvLimit: '1500 CVs',
      description: 'For high-volume recruitment',
      features: [
        'Everything in Professional',
        'Advanced EEA Analytics',
        'Higher volume (1,500 CVs)',
        'Team collaboration (10 users)',
        'Custom integrations',
        'Priority support'
      ],
      cta: 'Get Started',
      popular: false,
      color: 'indigo'
    },
    {
      name: 'Enterprise',
      priceZAR: null,
      period: 'tailored pricing',
      cvLimit: 'Unlimited',
      description: 'For large organizations with complex needs',
      features: [
        'Everything in Business',
        'Full EEA Compliance Suite',
        'Unlimited CV processing',
        'Custom integrations',
        'Dedicated account manager',
        'SSO & advanced security',
        'White-label option',
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
      title: 'Intelligent Upload',
      description: 'Drag and drop hundreds of CVs at once. Supports PDF, Word, Pages, and text formats with automatic parsing.'
    },
    {
      icon: Sparkles,
      title: 'AI-Powered Extraction',
      description: 'Claude AI automatically extracts skills, experience, education, and contact details with 98% accuracy.'
    },
    {
      icon: Palette,
      title: 'Professional CV Builder',
      description: 'Create beautiful, professional CVs with customizable templates, color themes, and AI-powered resume parsing. Free for all users.'
    },
    {
      icon: Filter,
      title: 'Advanced Filtering',
      description: 'Filter by skills, experience, location, education, salary expectations, and custom criteria instantly.'
    },
    {
      icon: BarChart3,
      title: 'Smart Analytics',
      description: 'Visualize candidate pools with interactive charts, skill distributions, and hiring insights.'
    },
    {
      icon: Scale,
      title: 'EEA Compliance Tracking',
      description: 'Comprehensive Employment Equity Act compliance monitoring with real-time reporting, workforce analytics, and automated EEA2 report generation.'
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'Bank-level encryption, GDPR compliance, and SOC 2 certification to protect sensitive candidate data.'
    },
    {
      icon: Clock,
      title: 'Save 20+ Hours/Week',
      description: 'Automate the screening process and reduce time-to-hire by up to 70% with intelligent automation.'
    }
  ];

  const stats = [
    { value: '10,000+', label: 'CVs Processed Daily' },
    { value: '500+', label: 'Companies Trust Us' },
    { value: '70%', label: 'Faster Hiring' },
    { value: '100%', label: 'EEA Compliant' }
  ];

  const testimonials = [
    {
      quote: "CVSift reduced our time-to-hire from 6 weeks to just 2 weeks. The AI filtering is incredibly accurate."
    },
    {
      quote: "The EEA compliance tracking has been a game-changer for our HR team. We finally have real-time visibility into our equity targets."
    },
    {
      quote: "We processed 2,000 CVs in under an hour. This tool is a game-changer for high-volume recruitment."
    },
    {
      quote: "As a South African company, the automated EEA reporting saved us countless hours during our DoL submission. Absolutely essential."
    },
    {
      quote: "The analytics dashboard gives us insights we never had before. We can now make data-driven hiring decisions."
    },
    {
      quote: "The automated screening saved our team countless hours. We can now focus on interviewing the right candidates."
    },
    {
      quote: "The EEA2 report generation is flawless. What used to take our team 2 weeks now takes 10 minutes. Incredible."
    },
    {
      quote: "Implementation was seamless and the ROI was evident within the first month. Highly recommend!"
    },
    {
      quote: "The skill extraction accuracy is phenomenal. It picks up technical skills we would have missed manually."
    },
    {
      quote: "We've increased our candidate quality significantly while reducing screening time by 80%."
    },
    {
      quote: "The best investment we've made in our recruitment process. The AI understands context remarkably well."
    },
    {
      quote: "Real-time EEA compliance monitoring helps us make strategic hiring decisions that align with our transformation goals."
    },
    {
      quote: "Customer support is exceptional and the platform is incredibly intuitive to use."
    },
    {
      quote: "Finally, a tool that actually delivers on its promises. Our hiring pipeline has never been more efficient."
    },
    {
      quote: "The filtering capabilities are exactly what we needed for our high-volume recruitment campaigns."
    },
    {
      quote: "Game-changing technology. We've cut our cost-per-hire in half while improving candidate quality."
    }
  ];

  return (
    <div className="min-h-screen overflow-x-hidden text-gray-900 bg-white">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-lg shadow-sm' : 'bg-transparent'
      }`}>
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-3 cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
                <div className="flex items-center justify-center shadow-lg w-9 h-9 lg:w-10 lg:h-10 bg-gradient-to-br from-accent-500 via-accent-600 to-accent-700 rounded-xl">
                  <span className="text-lg font-bold text-white lg:text-xl">CV</span>
                </div>
                <span className="text-xl font-bold text-transparent lg:text-2xl bg-gradient-to-r from-secondary-900 to-secondary-700 bg-clip-text font-heading">Sift</span>
              </div>
              <div className="hidden text-xs text-gray-400 sm:block">
                by{' '}
                <a
                  href="https://www.automore.co.za"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-500 transition-colors hover:text-accent-600"
                >
                  Automore
                </a>
              </div>
            </div>
            
            <div className="items-center hidden space-x-8 lg:flex">
              <a href="#features" className="text-sm font-medium text-secondary-600 transition-colors hover:text-accent-600">Features</a>
              <a href="#how-it-works" className="text-sm font-medium text-secondary-600 transition-colors hover:text-accent-600">How It Works</a>
              <a href="#pricing" className="text-sm font-medium text-secondary-600 transition-colors hover:text-accent-600">Pricing</a>
              <a href="#testimonials" className="text-sm font-medium text-secondary-600 transition-colors hover:text-accent-600">Testimonials</a>
            </div>

            <div className="flex items-center space-x-3 lg:space-x-4">
              <button 
                onClick={() => navigate('/signin')}
                className="hidden text-sm font-medium text-gray-700 transition-colors sm:block hover:text-accent-600 lg:text-base"
              >
                Sign In
              </button>
              <button 
                onClick={() => navigate('/signup')}
                className="bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white px-4 lg:px-6 py-2 lg:py-2.5 rounded-lg font-medium transition-all hover:shadow-lg hover:shadow-accent-500/30 text-sm lg:text-base"
              >
                Get Started
              </button>
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-gray-600 lg:hidden hover:text-accent-600"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="bg-white border-t border-gray-100 shadow-lg lg:hidden">
            <div className="px-4 py-4 space-y-3">
              <a href="#features" className="block py-2 font-medium text-gray-600 hover:text-accent-600" onClick={() => setMobileMenuOpen(false)}>Features</a>
              <a href="#how-it-works" className="block py-2 font-medium text-gray-600 hover:text-accent-600" onClick={() => setMobileMenuOpen(false)}>How It Works</a>
              <a href="#pricing" className="block py-2 font-medium text-gray-600 hover:text-accent-600" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
              <a href="#testimonials" className="block py-2 font-medium text-gray-600 hover:text-accent-600" onClick={() => setMobileMenuOpen(false)}>Testimonials</a>
              <button 
                onClick={() => navigate('/signin')}
                className="block w-full py-2 font-medium text-left text-gray-700 hover:text-accent-600"
              >
                Sign In
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="px-4 pt-24 pb-16 lg:pt-32 lg:pb-24 sm:px-6 lg:px-8 bg-gradient-to-b from-accent-50/30 via-white to-white">
        <div className="mx-auto max-w-7xl">
          <div className={`text-center max-w-4xl mx-auto transition-all duration-1000 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="inline-flex items-center px-4 py-2 mb-6 space-x-2 text-accent-700 border rounded-full bg-gradient-to-r from-accent-100 to-accent-50 lg:mb-8 border-accent-200/50">
              <Sparkles size={16} className="animate-pulse" />
              <span className="text-xs font-semibold lg:text-sm">Powered by Claude AI</span>
            </div>
            
            <h1 className="mb-4 text-4xl font-bold leading-tight sm:text-5xl lg:text-7xl lg:mb-6 font-heading">
              Transform Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-600 to-accent-500">Recruitment</span><br className="hidden sm:block" /> with{' '}
              <span className="relative inline-block">
                <span className="relative z-10">AI-Powered</span>
                <div className="absolute inset-0 bg-gradient-to-r from-accent-400 to-secondary-400 -rotate-1 rounded-xl opacity-20 blur-sm"></div>
              </span>{' '}CV Screening
            </h1>

            <p className="px-4 mb-8 text-lg leading-relaxed text-gray-600 sm:text-xl lg:text-2xl lg:mb-12">
              Intelligent CV screening, advanced filtering, and EEA compliance tracking. Save 20+ hours per week and hire the best candidates faster.
            </p>

            <div className="flex flex-col items-center justify-center gap-4 mb-12 sm:flex-row lg:mb-16">
              <button
                onClick={() => navigate('/signup')}
                className="flex items-center justify-center w-full px-8 py-4 space-x-2 text-base font-semibold text-white transition-all shadow-xl sm:w-auto bg-gradient-to-r from-accent-600 to-accent-500 hover:from-accent-700 hover:to-accent-600 rounded-xl lg:text-lg hover:scale-105 shadow-accent-500/30"
              >
                <span>Get Started Free</span>
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 gap-4 mb-12 lg:grid-cols-4 lg:gap-8 lg:mb-16">
              {stats.map((stat, idx) => (
                <div key={idx} className="text-center">
                  <div className="mb-1 text-2xl font-bold text-gray-900 lg:text-3xl">{stat.value}</div>
                  <div className="text-xs text-gray-600 lg:text-sm">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Hero Visual */}
            <div className="relative">
              <div className="p-4 border shadow-2xl bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl lg:rounded-3xl lg:p-8 border-gray-200/50">
                <div className="p-4 bg-white shadow-inner rounded-xl lg:rounded-2xl lg:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex space-x-2">
                      <div className="w-2.5 h-2.5 lg:w-3 lg:h-3 bg-red-400 rounded-full"></div>
                      <div className="w-2.5 h-2.5 lg:w-3 lg:h-3 bg-yellow-400 rounded-full"></div>
                      <div className="w-2.5 h-2.5 lg:w-3 lg:h-3 bg-green-400 rounded-full"></div>
                    </div>
                    <div className="text-xs font-medium text-gray-400 lg:text-sm">CVSift Dashboard</div>
                  </div>
                  <div className="space-y-3">
                    <div className="w-3/4 h-3 rounded-full lg:h-4 bg-gradient-to-r from-gray-200 to-gray-100 animate-pulse"></div>
                    <div className="w-1/2 h-3 rounded-full lg:h-4 bg-gradient-to-r from-accent-200 to-accent-100 animate-pulse" style={{animationDelay: '150ms'}}></div>
                    <div className="w-2/3 h-3 rounded-full lg:h-4 bg-gradient-to-r from-purple-200 to-purple-100 animate-pulse" style={{animationDelay: '300ms'}}></div>
                    <div className="grid grid-cols-3 gap-3 mt-6 lg:gap-4">
                      <div className="h-20 shadow-sm lg:h-24 bg-gradient-to-br from-accent-100 to-accent-200 rounded-xl"></div>
                      <div className="h-20 shadow-sm lg:h-24 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl"></div>
                      <div className="h-20 shadow-sm lg:h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl"></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute w-24 h-24 bg-accent-400 rounded-full -top-4 -right-4 blur-3xl opacity-40 animate-pulse"></div>
              <div className="absolute w-24 h-24 bg-secondary-400 rounded-full -bottom-4 -left-4 blur-3xl opacity-40 animate-pulse" style={{animationDelay: '1s'}}></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 lg:py-24 bg-gradient-to-b from-white to-gray-50">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="mb-12 text-center lg:mb-16">
            <div className="inline-flex items-center px-4 py-2 mb-4 space-x-2 text-accent-700 bg-accent-100 rounded-full">
              <Star size={16} />
              <span className="text-sm font-semibold">Powerful Features</span>
            </div>
            <h2 className="mb-4 text-3xl font-bold lg:text-5xl lg:mb-6 font-heading">
              Everything You Need for{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-600 to-accent-500">Smarter Hiring</span>
            </h2>
            <p className="max-w-2xl mx-auto text-lg text-gray-600 lg:text-xl">
              Built for modern recruitment teams who want to move fast without compromising quality
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            {features.map((feature, idx) => (
              <div key={idx} className="p-6 transition-all duration-300 bg-white border border-gray-100 shadow-sm group lg:p-8 rounded-2xl hover:shadow-2xl hover:-translate-y-2 hover:border-accent-200">
                <div className="flex items-center justify-center w-12 h-12 mb-4 transition-transform duration-300 shadow-sm lg:w-14 lg:h-14 bg-gradient-to-br from-accent-100 to-accent-50 rounded-xl lg:mb-6 group-hover:scale-110">
                  <feature.icon className="text-accent-600" size={24} />
                </div>
                <h3 className="mb-2 text-lg font-bold text-secondary-900 lg:text-xl lg:mb-3 font-heading">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-gray-600 lg:text-base">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EEA Compliance Section */}
      <section className="py-16 bg-white lg:py-24">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            {/* Left: Content */}
            <div>
              <div className="inline-flex items-center px-4 py-2 mb-4 space-x-2 text-green-700 bg-green-100 rounded-full">
                <Scale size={16} />
                <span className="text-sm font-semibold">South African Compliance</span>
              </div>
              <h2 className="mb-4 text-3xl font-bold lg:text-5xl lg:mb-6 font-heading">
                Real-Time{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600">EEA Compliance</span>{' '}
                Tracking
              </h2>
              <p className="mb-6 text-lg text-gray-600 lg:text-xl">
                Built specifically for South African companies. Monitor Employment Equity Act compliance in real-time, track workforce demographics, and generate automated EEA2 reports.
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-1">
                    <CheckCircle2 size={14} className="text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">Automated EEA2 Report Generation</h3>
                    <p className="text-sm text-gray-600">Generate DoL-compliant EEA2 reports instantly with all required workforce demographics and occupational level breakdowns.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-1">
                    <CheckCircle2 size={14} className="text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">Real-Time Compliance Dashboard</h3>
                    <p className="text-sm text-gray-600">Track compliance by occupational level, monitor disability representation, and visualize gaps against sector-specific EAP targets.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-1">
                    <CheckCircle2 size={14} className="text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">Strategic Hiring Calculator</h3>
                    <p className="text-sm text-gray-600">Plan future hires with our intelligent calculator that shows exactly how each hire impacts your compliance targets.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-1">
                    <CheckCircle2 size={14} className="text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">National & Provincial EAP Support</h3>
                    <p className="text-sm text-gray-600">Choose between national or provincial EAP targets, with automatic calculation of compliance gaps for all designated groups.</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => navigate('/signup')}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all font-semibold shadow-lg hover:shadow-xl"
                >
                  Start Tracking Compliance
                </button>
                <button
                  onClick={() => navigate('/signup')}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all font-semibold"
                >
                  View Demo
                </button>
              </div>
            </div>

            {/* Right: Visual */}
            <div className="relative">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 shadow-xl border-2 border-green-200">
                {/* Mock Dashboard */}
                <div className="bg-white rounded-xl shadow-md p-6 mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                      <Scale size={20} className="text-green-600" />
                      EEA Compliance Overview
                    </h3>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">Live</span>
                  </div>

                  {/* Compliance Meter */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-700">Overall Compliance</span>
                      <span className="text-2xl font-bold text-green-600">78%</span>
                    </div>
                    <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-1000" style={{width: '78%'}}></div>
                    </div>
                  </div>

                  {/* Level Breakdown */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-xs font-medium text-gray-700">Top Management</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-yellow-500 rounded-full" style={{width: '65%'}}></div>
                        </div>
                        <span className="text-xs font-bold text-gray-900 w-8 text-right">65%</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-xs font-medium text-gray-700">Senior Management</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full" style={{width: '82%'}}></div>
                        </div>
                        <span className="text-xs font-bold text-gray-900 w-8 text-right">82%</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-xs font-medium text-gray-700">Skilled Technical</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full" style={{width: '89%'}}></div>
                        </div>
                        <span className="text-xs font-bold text-gray-900 w-8 text-right">89%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white rounded-lg shadow-sm p-4 text-center">
                    <div className="text-2xl font-bold text-gray-900 mb-1">156</div>
                    <div className="text-xs text-gray-600">Total Employees</div>
                  </div>
                  <div className="bg-white rounded-lg shadow-sm p-4 text-center">
                    <div className="text-2xl font-bold text-green-600 mb-1">12</div>
                    <div className="text-xs text-gray-600">On Target</div>
                  </div>
                  <div className="bg-white rounded-lg shadow-sm p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-600 mb-1">3</div>
                    <div className="text-xs text-gray-600">Need Focus</div>
                  </div>
                </div>
              </div>

              {/* Floating Badge */}
              <div className="absolute -top-4 -right-4 bg-green-600 text-white px-6 py-3 rounded-xl shadow-xl transform rotate-3">
                <div className="text-xs font-semibold mb-1">DoL Compliant</div>
                <div className="text-2xl font-bold">EEA2</div>
              </div>

              {/* Decorative Elements */}
              <div className="absolute w-32 h-32 bg-green-400 rounded-full -bottom-6 -left-6 blur-3xl opacity-30 animate-pulse"></div>
              <div className="absolute w-32 h-32 bg-emerald-400 rounded-full -top-6 -right-6 blur-3xl opacity-30 animate-pulse" style={{animationDelay: '1s'}}></div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Workflow Section */}
      <section id="how-it-works" className="py-16 bg-white lg:py-24">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="mb-12 text-center lg:mb-16">
            <div className="inline-flex items-center px-4 py-2 mb-4 space-x-2 text-purple-700 bg-purple-100 rounded-full">
              <Zap size={16} />
              <span className="text-sm font-semibold">Interactive Demo</span>
            </div>
            <h2 className="mb-4 text-3xl font-bold lg:text-5xl lg:mb-6 font-heading">
              See <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-600 to-accent-500">CVSift</span> in Action
            </h2>
            <p className="max-w-2xl mx-auto mb-4 text-lg text-gray-600 lg:text-xl">
              Try our interactive demo - drag the folder to Step 1 to begin
            </p>
            {completedSteps.length > 0 && (
              <button
                onClick={resetDemo}
                className="text-sm font-semibold text-accent-600 underline hover:text-accent-700"
              >
                Reset Demo
              </button>
            )}
          </div>

          {/* Draggable Folder */}
          {uploadedFiles.length === 0 && (
            <div className="flex justify-center mb-8 lg:mb-12">
              <div
                draggable="true"
                onDragStart={(e) => e.dataTransfer.effectAllowed = 'move'}
                className="p-6 transition-all duration-300 border-2 border-accent-300 shadow-xl cursor-move bg-gradient-to-br from-accent-100 to-accent-200 lg:p-8 rounded-2xl hover:scale-110 animate-pulse"
              >
                <Folder size={48} className="mx-auto mb-2 text-accent-600" />
                <p className="text-sm font-bold text-center text-accent-700">CVs Folder</p>
                <p className="mt-1 text-xs text-center text-accent-600">Drag me to Step 1!</p>
              </div>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-4 lg:gap-8">
            {/* Step 1: Upload */}
            <div
              className={`relative transition-all duration-300 ${completedSteps.includes(1) ? 'opacity-60' : ''}`}
              onMouseEnter={() => setHoveredStep(0)}
              onMouseLeave={() => setHoveredStep(null)}
            >
              <div className={`bg-gradient-to-br from-accent-50 to-accent-100 p-6 lg:p-8 rounded-2xl border-2 relative overflow-hidden h-full ${
                completedSteps.includes(1) ? 'border-green-400' : 'border-accent-200'
              }`}>
                {(hoveredStep === 0 || isProcessing) && (
                  <div className="absolute top-0 right-0 w-32 h-32 bg-accent-400 rounded-full blur-3xl opacity-40 animate-pulse"></div>
                )}
                {completedSteps.includes(1) && (
                  <div className="absolute top-4 right-4">
                    <CheckCircle2 size={24} className="text-green-500" />
                  </div>
                )}
                <div className="relative z-10">
                  <div className={`w-14 h-14 lg:w-16 lg:h-16 bg-accent-500 rounded-2xl flex items-center justify-center mb-4 lg:mb-6 shadow-lg transition-transform duration-300 ${hoveredStep === 0 || isProcessing ? 'scale-110 rotate-6' : ''}`}>
                    <Upload className="text-white" size={28} />
                  </div>
                  <div className="mb-4">
                    <span className="px-3 py-1 text-xs font-bold text-accent-600 bg-accent-200 rounded-full lg:text-sm">Step 1</span>
                  </div>
                  <h3 className="mb-2 text-xl font-bold text-secondary-900 lg:text-2xl lg:mb-3 font-heading">Upload CVs</h3>
                  <p className="mb-4 text-sm leading-relaxed text-gray-600 lg:text-base">
                    Bulk upload hundreds of CVs instantly
                  </p>

                  {!isProcessing && uploadedFiles.length === 0 ? (
                    <div
                      className={`mt-6 border-2 border-dashed rounded-xl p-4 lg:p-6 text-center cursor-pointer transition-all duration-300 ${
                        isDragging
                          ? 'border-accent-500 bg-accent-100 scale-105'
                          : 'border-accent-300 bg-white hover:border-accent-400 hover:bg-accent-50'
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={handleClick}
                    >
                      <Upload size={28} className={`mx-auto mb-3 transition-colors ${isDragging ? 'text-accent-600' : 'text-accent-400'}`} />
                      <p className="mb-1 text-xs font-semibold text-gray-700 lg:text-sm">
                        {isDragging ? 'Drop here!' : 'Drop folder here'}
                      </p>
                      <p className="text-xs text-gray-500">or click to try</p>
                    </div>
                  ) : (
                    <div className="mt-6 space-y-2">
                      {uploadedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 p-2 text-xs text-gray-700 bg-white rounded-lg shadow-sm lg:text-sm animate-fadeIn"
                          style={{animationDelay: `${index * 100}ms`}}
                        >
                          <FileText size={14} className="flex-shrink-0 text-accent-500" />
                          <span className="flex-1 truncate">{file.name}</span>
                          {file.status === 'completed' ? (
                            <CheckCircle2 size={14} className="flex-shrink-0 text-green-500" />
                          ) : (
                            <div className="w-12 h-1.5 bg-accent-200 rounded-full overflow-hidden flex-shrink-0">
                              <div className="h-full bg-accent-500 animate-progress"></div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className={`absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-10 h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center text-white font-bold shadow-lg z-20 transition-all duration-300 text-sm lg:text-base ${
                completedSteps.includes(1) ? 'bg-green-500' : 'bg-accent-500'
              } ${hoveredStep === 0 || isProcessing ? 'scale-125' : ''}`}>
                1
              </div>
            </div>

            {/* Step 2: AI Processing */}
            {completedSteps.includes(1) && (
              <div
                className={`relative transition-all duration-300 animate-fadeIn ${completedSteps.includes(2) ? 'opacity-60' : ''}`}
                onMouseEnter={() => setHoveredStep(1)}
                onMouseLeave={() => setHoveredStep(null)}
              >
                <div className={`bg-gradient-to-br from-purple-50 to-purple-100 p-6 lg:p-8 rounded-2xl border-2 relative overflow-hidden h-full ${
                  completedSteps.includes(2) ? 'border-green-400' : 'border-purple-200'
                }`}>
                  {!completedSteps.includes(2) && (
                    <div className="absolute top-0 right-0 w-32 h-32 bg-secondary-400 rounded-full blur-3xl opacity-40 animate-pulse"></div>
                  )}
                  {completedSteps.includes(2) && (
                    <div className="absolute top-4 right-4">
                      <CheckCircle2 size={24} className="text-green-500" />
                    </div>
                  )}
                  <div className="relative z-10">
                    <div className={`w-14 h-14 lg:w-16 lg:h-16 bg-purple-500 rounded-2xl flex items-center justify-center mb-4 lg:mb-6 shadow-lg transition-transform duration-300 ${!completedSteps.includes(2) ? 'scale-110 rotate-12 animate-pulse' : ''}`}>
                      <Sparkles className="text-white" size={28} />
                    </div>
                    <div className="mb-4">
                      <span className="px-3 py-1 text-xs font-bold text-purple-600 bg-purple-200 rounded-full lg:text-sm">Step 2</span>
                    </div>
                    <h3 className="mb-2 text-xl font-bold text-gray-900 lg:text-2xl lg:mb-3">AI Processing</h3>
                    <p className="mb-4 text-sm leading-relaxed text-gray-600 lg:text-base">
                      Claude AI extracts data automatically
                    </p>

                    <div className="mt-6">
                      <div className="p-4 bg-white rounded-lg shadow-md">
                        <div className="flex items-center gap-2 mb-3 text-xs text-gray-600">
                          {!completedSteps.includes(2) && <div className="w-2 h-2 bg-purple-500 rounded-full animate-ping"></div>}
                          <Sparkles size={14} className="text-purple-500" />
                          <span className={`font-semibold ${!completedSteps.includes(2) ? 'animate-pulse' : ''}`}>
                            {!completedSteps.includes(2) ? 'Analyzing...' : 'Complete'}
                          </span>
                        </div>
                        <div className="space-y-2 text-xs">
                          <div className="flex items-center gap-2 animate-fadeIn">
                            <CheckCircle2 size={12} className="flex-shrink-0 text-green-500" />
                            <span className="text-gray-700"><strong>Skills:</strong> React, Node.js</span>
                          </div>
                          <div className="flex items-center gap-2 animate-fadeIn" style={{animationDelay: '150ms'}}>
                            <CheckCircle2 size={12} className="flex-shrink-0 text-green-500" />
                            <span className="text-gray-700"><strong>Experience:</strong> 5 years</span>
                          </div>
                          <div className="flex items-center gap-2 animate-fadeIn" style={{animationDelay: '300ms'}}>
                            <CheckCircle2 size={12} className="flex-shrink-0 text-green-500" />
                            <span className="text-gray-700"><strong>Education:</strong> BSc CS</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className={`absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-10 h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center text-white font-bold shadow-lg z-20 transition-all duration-300 text-sm lg:text-base ${
                  completedSteps.includes(2) ? 'bg-green-500' : 'bg-purple-500 animate-pulse'
                }`}>
                  2
                </div>
              </div>
            )}

            {/* Step 3: Smart Filtering */}
            {completedSteps.includes(2) && (
              <div
                className={`relative transition-all duration-300 animate-fadeIn ${completedSteps.includes(3) ? 'opacity-60' : ''}`}
                onMouseEnter={() => setHoveredStep(2)}
                onMouseLeave={() => setHoveredStep(null)}
              >
                <div className={`bg-gradient-to-br from-blue-50 to-blue-100 p-6 lg:p-8 rounded-2xl border-2 relative overflow-hidden h-full ${
                  completedSteps.includes(3) ? 'border-green-400' : 'border-blue-200'
                }`}>
                  {!completedSteps.includes(3) && (
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400 rounded-full blur-3xl opacity-40 animate-pulse"></div>
                  )}
                  {completedSteps.includes(3) && (
                    <div className="absolute top-4 right-4">
                      <CheckCircle2 size={24} className="text-green-500" />
                    </div>
                  )}
                  <div className="relative z-10">
                    <div className={`w-14 h-14 lg:w-16 lg:h-16 bg-blue-500 rounded-2xl flex items-center justify-center mb-4 lg:mb-6 shadow-lg transition-transform duration-300 ${!completedSteps.includes(3) ? 'scale-110 -rotate-6' : ''}`}>
                      <Search className="text-white" size={28} />
                    </div>
                    <div className="mb-4">
                      <span className="px-3 py-1 text-xs font-bold text-blue-600 bg-blue-200 rounded-full lg:text-sm">Step 3</span>
                    </div>
                    <h3 className="mb-2 text-xl font-bold text-gray-900 lg:text-2xl lg:mb-3">Filter & Match</h3>
                    <p className="mb-4 text-sm leading-relaxed text-gray-600 lg:text-base">
                      Apply filters or job specifications
                    </p>

                    <div className="mt-6 space-y-2">
                      {!selectedFilter ? (
                        <>
                          <p className="mb-2 text-xs font-semibold text-gray-600">Click to apply:</p>
                          <button
                            onClick={() => handleFilterClick('skills')}
                            className="w-full bg-white p-2.5 rounded-lg shadow-sm border-2 border-blue-200 hover:border-blue-400 hover:scale-105 transition-all duration-300"
                          >
                            <div className="flex items-center gap-2 text-xs">
                              <Filter size={14} className="flex-shrink-0 text-blue-500" />
                              <span className="font-semibold">Skills:</span>
                              <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">React</span>
                            </div>
                          </button>
                          <button
                            onClick={() => handleFilterClick('experience')}
                            className="w-full bg-white p-2.5 rounded-lg shadow-sm border-2 border-blue-200 hover:border-blue-400 hover:scale-105 transition-all duration-300"
                          >
                            <div className="flex items-center gap-2 text-xs">
                              <Filter size={14} className="flex-shrink-0 text-blue-500" />
                              <span className="font-semibold">Experience:</span>
                              <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">3+ years</span>
                            </div>
                          </button>
                          <button
                            onClick={() => handleFilterClick('jobspec')}
                            className="w-full bg-gradient-to-r from-purple-50 to-purple-100 p-2.5 rounded-lg shadow-sm border-2 border-purple-300 hover:border-purple-400 hover:scale-105 transition-all duration-300"
                          >
                            <div className="flex items-center gap-2 text-xs">
                              <Sparkles size={14} className="flex-shrink-0 text-purple-500" />
                              <span className="font-semibold text-purple-700">Job Match</span>
                            </div>
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="bg-white p-2.5 rounded-lg shadow-md border-2 border-blue-400 animate-fadeIn">
                            <div className="flex items-center gap-2 text-xs">
                              <Filter size={14} className="flex-shrink-0 text-blue-500" />
                              <span className="font-semibold">Applied: {selectedFilter}</span>
                              <CheckCircle2 size={14} className="ml-auto text-green-500" />
                            </div>
                          </div>
                          {showMatches && (
                            <div className="mt-4 text-center animate-fadeIn">
                              <div className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-green-700 scale-110 rounded-full shadow-lg bg-gradient-to-r from-green-100 to-emerald-100">
                                <Users size={16} />
                                <span className="animate-pulse">47 matches!</span>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className={`absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-10 h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center text-white font-bold shadow-lg z-20 transition-all duration-300 text-sm lg:text-base ${
                  completedSteps.includes(3) ? 'bg-green-500' : 'bg-blue-500 animate-pulse'
                }`}>
                  3
                </div>
              </div>
            )}

            {/* Step 4: Export */}
            {completedSteps.includes(3) && (
              <div
                className="relative transition-all duration-300 animate-fadeIn"
                onMouseEnter={() => setHoveredStep(3)}
                onMouseLeave={() => setHoveredStep(null)}
              >
                <div className="relative h-full p-6 overflow-hidden border-2 border-green-200 bg-gradient-to-br from-green-50 to-green-100 lg:p-8 rounded-2xl">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-green-400 rounded-full blur-3xl opacity-40 animate-pulse"></div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-center mb-4 scale-110 bg-green-500 shadow-lg w-14 h-14 lg:w-16 lg:h-16 rounded-2xl lg:mb-6 rotate-6 animate-pulse">
                      <Download className="text-white" size={28} />
                    </div>
                    <div className="mb-4">
                      <span className="px-3 py-1 text-xs font-bold text-green-600 bg-green-200 rounded-full lg:text-sm">Step 4</span>
                    </div>
                    <h3 className="mb-2 text-xl font-bold text-gray-900 lg:text-2xl lg:mb-3">Export & Hire</h3>
                    <p className="mb-4 text-sm leading-relaxed text-gray-600 lg:text-base">
                      Export and analyze results
                    </p>

                    <div className="mt-6 space-y-3">
                      <button className="w-full bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-lg text-sm font-bold transition-all shadow-lg flex items-center justify-center gap-2 scale-105">
                        <Download size={16} />
                        <span>Downloading...</span>
                        <CheckCircle2 size={16} className="animate-fadeIn" />
                      </button>
                      <div className="p-3 bg-white rounded-lg shadow-md animate-fadeIn">
                        <div className="flex items-center justify-between mb-3 text-xs">
                          <span className="font-semibold text-gray-700">Skills Distribution</span>
                          <BarChart3 size={14} className="text-green-500" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-700 w-14">React</span>
                            <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-green-500 rounded-full transition-all duration-700 w-[85%]"></div>
                            </div>
                            <span className="w-8 text-xs text-right text-gray-600">85%</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-700 w-14">Node.js</span>
                            <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-green-400 rounded-full transition-all duration-700 w-[70%]"></div>
                            </div>
                            <span className="w-8 text-xs text-right text-gray-600">70%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute z-20 flex items-center justify-center w-10 h-10 text-sm font-bold text-white transform scale-125 -translate-x-1/2 bg-green-500 rounded-full shadow-lg -bottom-2 left-1/2 lg:w-12 lg:h-12 animate-pulse lg:text-base">
                  4
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-16 overflow-hidden lg:py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="mb-12 text-center lg:mb-16">
            <div className="inline-flex items-center px-4 py-2 mb-4 space-x-2 text-green-700 bg-green-100 rounded-full">
              <TrendingUp size={16} />
              <span className="text-sm font-semibold">Loved by HR Teams</span>
            </div>
            <h2 className="mb-4 text-3xl font-bold lg:text-5xl lg:mb-6 font-heading">
              Trusted by <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-600 to-accent-500">500+</span> Companies
            </h2>
            <p className="max-w-2xl mx-auto text-lg text-gray-600 lg:text-xl">
              See what recruitment teams are saying about CVSift
            </p>
          </div>

          <div className="relative">
            <div className="testimonial-ticker">
              <div className="testimonial-track">
                {[...testimonials, ...testimonials].map((testimonial, idx) => (
                  <div key={idx} className="flex-shrink-0 p-6 bg-white border border-gray-100 shadow-sm testimonial-card rounded-2xl">
                    <div className="flex mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={16} className="text-yellow-400 fill-yellow-400" />
                      ))}
                    </div>
                    <p className="italic leading-relaxed text-gray-700">"{testimonial.quote}"</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 bg-white lg:py-24">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="mb-12 text-center lg:mb-16">
            <div className="inline-flex items-center px-4 py-2 mb-4 space-x-2 text-blue-700 bg-blue-100 rounded-full">
              <CheckCircle2 size={16} />
              <span className="text-sm font-semibold">Flexible Plans</span>
            </div>
            <h2 className="mb-4 text-3xl font-bold lg:text-5xl lg:mb-6 font-heading">
              Simple, <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-600 to-accent-500">Transparent</span> Pricing
            </h2>
            <p className="max-w-2xl mx-auto mb-6 text-lg text-gray-600 lg:text-xl">
              Choose the perfect plan for your team. Start free and upgrade anytime.
            </p>
            <div className="flex justify-center">
              <CompactCurrencySelector />
            </div>
          </div>

          {/* All Pricing Plans - Cleaner 3-column layout */}
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
            {pricingTiers.filter(t => t.name !== 'Enterprise').map((tier, idx) => (
              <div key={idx} className={`relative bg-white rounded-xl p-6 border transition-all hover:shadow-xl ${
                tier.popular
                  ? 'border-accent-500 shadow-lg ring-2 ring-accent-500 ring-opacity-50'
                  : 'border-gray-200'
              }`}>
                {tier.popular && (
                  <div className="absolute px-3 py-1 text-xs font-bold text-white bg-accent-500 rounded-full -top-3 left-6">
                    MOST POPULAR
                  </div>
                )}

                {/* Header */}
                <div className="mb-6 text-center">
                  <h3 className="mb-3 text-xl font-bold text-secondary-900 font-heading">{tier.name}</h3>
                  <div className="mb-4">
                    <div className="flex items-baseline justify-center">
                      {currencyLoading ? (
                        <span className="text-3xl font-bold text-gray-400">Loading...</span>
                      ) : (
                        <>
                          <span className="text-3xl font-bold text-gray-900">
                            {tier.priceZAR === null ? 'Custom' : convertAndFormat(tier.priceZAR)}
                          </span>
                          {tier.period === 'per month' && <span className="ml-2 text-gray-500">/mo</span>}
                        </>
                      )}
                    </div>
                  </div>
                  <div className="inline-block px-4 py-1.5 bg-accent-50 border border-accent-200 rounded-full">
                    <span className="text-sm font-bold text-accent-700">
                      {tier.cvLimit}/month
                    </span>
                  </div>
                </div>

                {/* Key Features - Show only top 3 */}
                <ul className="mb-6 space-y-2.5 min-h-[120px]">
                  {tier.features.slice(0, 3).map((feature, fidx) => (
                    <li key={fidx} className="flex items-start space-x-2">
                      <CheckCircle2 className="text-accent-500 flex-shrink-0 mt-0.5" size={16} />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                  {tier.features.length > 3 && (
                    <li className="text-sm text-gray-500 italic">+ {tier.features.length - 3} more features</li>
                  )}
                </ul>

                {/* CTA Button */}
                <button
                  onClick={() => navigate('/signup')}
                  className={`w-full py-2.5 rounded-lg font-semibold transition-all ${
                    tier.popular
                      ? 'bg-accent-500 text-white hover:bg-accent-600'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  {tier.cta}
                </button>
                {tier.priceZAR !== 0 && (
                  <p className="text-xs text-gray-500 text-center mt-2">
                    Billed monthly. Cancel anytime.
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Enterprise Card - Separate */}
          {pricingTiers.filter(t => t.name === 'Enterprise').map((tier, idx) => (
            <div key={idx} className="max-w-4xl mx-auto mt-12">
              <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-8 text-white">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-2xl font-bold mb-2 font-heading">{tier.name}</h3>
                    <p className="text-gray-300 mb-4">For large organizations with complex needs</p>
                    <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                      <span className="px-3 py-1 bg-white/10 rounded-full text-sm">Unlimited CVs</span>
                      <span className="px-3 py-1 bg-white/10 rounded-full text-sm">Custom Integrations</span>
                      <span className="px-3 py-1 bg-white/10 rounded-full text-sm">Dedicated Support</span>
                    </div>
                  </div>
                  <button
                    onClick={() => window.location.href = 'mailto:sales@cvsift.com'}
                    className="px-8 py-3 bg-white text-gray-900 rounded-lg font-bold hover:bg-gray-100 transition-all"
                  >
                    {tier.cta}
                  </button>
                </div>
              </div>
            </div>
          ))}

          <div className="mt-8 text-center lg:mt-12">
            <p className="text-sm text-gray-600 lg:text-base">
              Need help choosing a plan? <button onClick={() => navigate('/signup')} className="font-semibold text-accent-600 hover:underline">Get started</button> or <a href="mailto:sales@cvsift.com" className="font-semibold text-accent-600 hover:underline">contact sales</a>
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-16 overflow-hidden text-white lg:py-24 bg-gradient-to-br from-accent-500 via-accent-600 to-accent-700">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLW9wYWNpdHk9Ii4xIi8+PC9nPjwvc3ZnPg==')] opacity-10"></div>
        <div className="relative z-10 max-w-4xl px-4 mx-auto text-center sm:px-6 lg:px-8">
          <h2 className="mb-4 text-3xl font-bold lg:text-5xl lg:mb-6 font-heading">
            Ready to Hire Smarter?
          </h2>
          <p className="mb-8 text-lg lg:text-xl lg:mb-12 opacity-90">
            Join 500+ companies using CVSift to find top talent faster. Get started today.
          </p>
          <div className="flex items-center justify-center">
            <button
              onClick={() => navigate('/signup')}
              className="px-8 py-4 text-base font-semibold text-accent-600 transition-all bg-white shadow-2xl rounded-xl lg:text-lg hover:scale-105 hover:shadow-white/50"
            >
              Start Free
            </button>
          </div>
          <p className="mt-6 text-sm opacity-80">Free plan included • No credit card required • Upgrade anytime</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 text-gray-400 bg-gray-900 lg:py-16">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 mb-8 md:grid-cols-4 lg:gap-12 lg:mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center mb-4 space-x-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg shadow-lg bg-gradient-to-br from-accent-500 to-accent-600">
                  <span className="text-sm font-bold text-white">CV</span>
                </div>
                <span className="text-xl font-bold text-white">Sift</span>
              </div>
              <p className="mb-4 text-sm leading-relaxed">Making hiring faster and smarter with AI-powered CV screening.</p>
              <p className="mb-2 text-xs text-gray-500">
                Support: <a href="mailto:emma@automore.co.za" className="font-semibold text-accent-500 transition-colors hover:text-accent-400">emma@automore.co.za</a>
              </p>
              <p className="mb-4 text-xs text-gray-500">
                Developed and designed by{' '}
                <a
                  href="https://www.automore.co.za"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-accent-500 transition-colors hover:text-accent-400"
                >
                  Automore
                </a>
              </p>
              <div className="flex space-x-3">
                <a href="#" className="flex items-center justify-center w-8 h-8 transition-colors bg-gray-800 rounded-lg hover:bg-accent-600">
                  <span className="sr-only">Twitter</span>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path></svg>
                </a>
                <a href="#" className="flex items-center justify-center w-8 h-8 transition-colors bg-gray-800 rounded-lg hover:bg-accent-600">
                  <span className="sr-only">LinkedIn</span>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"></path></svg>
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="mb-4 text-sm font-semibold text-white font-heading">Product</h4>
              <ul className="space-y-2.5 text-sm">
                <li><a href="#features" className="transition-colors hover:text-accent-500">Features</a></li>
                <li><a href="#pricing" className="transition-colors hover:text-accent-500">Pricing</a></li>
                <li><a href="#how-it-works" className="transition-colors hover:text-accent-500">How It Works</a></li>
                <li><a href="#testimonials" className="transition-colors hover:text-accent-500">Testimonials</a></li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4 text-sm font-semibold text-white font-heading">Company</h4>
              <ul className="space-y-2.5 text-sm">
                <li><a href="/about" className="transition-colors hover:text-accent-500">About Us</a></li>
                <li><a href="/blog" className="transition-colors hover:text-accent-500">Blog</a></li>
                <li><a href="/contact" className="transition-colors hover:text-accent-500">Contact</a></li>
                <li><a href="https://www.automore.co.za" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-accent-500">About Automore</a></li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4 text-sm font-semibold text-white font-heading">Legal</h4>
              <ul className="space-y-2.5 text-sm">
                <li><a href="/privacy-policy" className="transition-colors hover:text-accent-500">Privacy Policy</a></li>
                <li><a href="/terms-of-service" className="transition-colors hover:text-accent-500">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="flex flex-col items-center justify-between pt-8 border-t border-gray-800 md:flex-row">
            <p className="mb-4 text-sm text-center md:text-left md:mb-0">&copy; 2025 CVSift. All rights reserved.</p>
            <div className="flex items-center space-x-6 text-sm">
              <a href="/privacy-policy" className="transition-colors hover:text-accent-500">Privacy Policy</a>
              <a href="/terms-of-service" className="transition-colors hover:text-accent-500">Terms of Service</a>
              <a href="https://www.automore.co.za" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-accent-500">About Automore</a>
            </div>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes progress {
          from {
            width: 0;
          }
          to {
            width: 100%;
          }
        }

        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }

        .animate-progress {
          animation: progress 1.5s ease-out forwards;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        @keyframes ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }

        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        .animate-ping {
          animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
        }

        .testimonial-ticker {
          overflow: hidden;
          width: 100%;
          position: relative;
        }

        .testimonial-track {
          display: flex;
          gap: 1.5rem;
          animation: scroll 60s linear infinite;
          width: fit-content;
        }

        .testimonial-track:hover {
          animation-play-state: paused;
        }

        .testimonial-card {
          width: 400px;
          max-width: 400px;
          min-height: 180px;
        }

        @media (max-width: 768px) {
          .testimonial-card {
            width: 320px;
            max-width: 320px;
          }
        }

        html {
          scroll-behavior: smooth;
        }
      `}</style>
    </div>
  );
}