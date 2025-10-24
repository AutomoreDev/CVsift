import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Upload, Filter, BarChart3, CheckCircle2, Zap, Shield, FileText, Search, Users, Download, Sparkles, Folder, Clock, TrendingUp, Star, Menu, X } from 'lucide-react';

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
      price: 'R0',
      period: 'forever',
      cvLimit: '10 CVs',
      description: 'Perfect for small teams getting started',
      features: [
        'Up to 10 CVs per month',
        'Basic filtering (skills, location)',
        '7-day data retention',
        'Email support',
        'Export to CSV'
      ],
      cta: 'Get Started Free',
      popular: false,
      color: 'gray'
    },
    {
      name: 'Starter',
      price: 'R199',
      period: 'per month',
      cvLimit: '50 CVs',
      description: 'For small teams with regular hiring',
      features: [
        'Up to 50 CVs per month',
        'Advanced filtering',
        '30-day data retention',
        'Bulk upload',
        'Job spec creation',
        'Email notifications'
      ],
      cta: 'Get Started',
      popular: false,
      color: 'blue'
    },
    {
      name: 'Basic',
      price: 'R399',
      period: 'per month',
      cvLimit: '150 CVs',
      description: 'For growing teams with regular hiring needs',
      features: [
        'Up to 150 CVs per month',
        'All filtering options',
        '90-day data retention',
        'Priority email support',
        'Advanced export options',
        'Bulk upload'
      ],
      cta: 'Get Started',
      popular: true,
      color: 'orange'
    },
    {
      name: 'Professional',
      price: 'R999',
      period: 'per month',
      cvLimit: '600 CVs',
      description: 'For scaling organizations',
      features: [
        'Up to 600 CVs per month',
        'AI Chatbot Assistant',
        'API access',
        '1-year data retention',
        'Advanced analytics',
        'Team collaboration (3 users)',
        'Priority support'
      ],
      cta: 'Get Started',
      popular: false,
      color: 'purple'
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: 'tailored pricing',
      cvLimit: 'Unlimited',
      description: 'For large organizations with complex needs',
      features: [
        'Unlimited CVs',
        'Everything in Professional',
        'Custom integrations',
        'SSO & advanced security',
        'White-label option',
        'Custom SLA',
        'Dedicated account manager',
        'Unlimited users'
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
    { value: '98%', label: 'Accuracy Rate' }
  ];

  const testimonials = [
    {
      quote: "CVSift reduced our time-to-hire from 6 weeks to just 2 weeks. The AI filtering is incredibly accurate."
    },
    {
      quote: "We processed 2,000 CVs in under an hour. This tool is a game-changer for high-volume recruitment."
    },
    {
      quote: "The analytics dashboard gives us insights we never had before. We can now make data-driven hiring decisions."
    },
    {
      quote: "The automated screening saved our team countless hours. We can now focus on interviewing the right candidates."
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
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-lg shadow-sm' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-3 cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
                <div className="w-9 h-9 lg:w-10 lg:h-10 bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg lg:text-xl">CV</span>
                </div>
                <span className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Sift</span>
              </div>
              <div className="hidden sm:block text-xs text-gray-400">
                by{' '}
                <a
                  href="https://www.automore.co.za"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-500 hover:text-orange-600 transition-colors"
                >
                  Automore
                </a>
              </div>
            </div>
            
            <div className="hidden lg:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-orange-600 transition-colors font-medium text-sm">Features</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-orange-600 transition-colors font-medium text-sm">How It Works</a>
              <a href="#pricing" className="text-gray-600 hover:text-orange-600 transition-colors font-medium text-sm">Pricing</a>
              <a href="#testimonials" className="text-gray-600 hover:text-orange-600 transition-colors font-medium text-sm">Testimonials</a>
            </div>

            <div className="flex items-center space-x-3 lg:space-x-4">
              <button 
                onClick={() => navigate('/signin')}
                className="hidden sm:block text-gray-700 hover:text-orange-600 font-medium transition-colors text-sm lg:text-base"
              >
                Sign In
              </button>
              <button 
                onClick={() => navigate('/signup')}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 lg:px-6 py-2 lg:py-2.5 rounded-lg font-medium transition-all hover:shadow-lg hover:shadow-orange-500/30 text-sm lg:text-base"
              >
                Get Started
              </button>
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 text-gray-600 hover:text-orange-600"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-gray-100 shadow-lg">
            <div className="px-4 py-4 space-y-3">
              <a href="#features" className="block text-gray-600 hover:text-orange-600 font-medium py-2" onClick={() => setMobileMenuOpen(false)}>Features</a>
              <a href="#how-it-works" className="block text-gray-600 hover:text-orange-600 font-medium py-2" onClick={() => setMobileMenuOpen(false)}>How It Works</a>
              <a href="#pricing" className="block text-gray-600 hover:text-orange-600 font-medium py-2" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
              <a href="#testimonials" className="block text-gray-600 hover:text-orange-600 font-medium py-2" onClick={() => setMobileMenuOpen(false)}>Testimonials</a>
              <button 
                onClick={() => navigate('/signin')}
                className="block w-full text-left text-gray-700 hover:text-orange-600 font-medium py-2"
              >
                Sign In
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-24 lg:pt-32 pb-16 lg:pb-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-orange-50/30 via-white to-white">
        <div className="max-w-7xl mx-auto">
          <div className={`text-center max-w-4xl mx-auto transition-all duration-1000 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-orange-100 to-orange-50 text-orange-700 px-4 py-2 rounded-full mb-6 lg:mb-8 border border-orange-200/50">
              <Sparkles size={16} className="animate-pulse" />
              <span className="text-xs lg:text-sm font-semibold">Powered by Claude AI</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-4 lg:mb-6 leading-tight">
              Screen <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-orange-500">Thousands</span> of CVs<br className="hidden sm:block" /> in{' '}
              <span className="relative inline-block">
                <span className="relative z-10">Minutes</span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 -rotate-1 rounded-xl opacity-20 blur-sm"></div>
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 mb-8 lg:mb-12 leading-relaxed px-4">
              AI-powered CV screening that saves you 20+ hours per week. Upload, filter, and hire the best candidates faster.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 lg:mb-16">
              <button
                onClick={() => navigate('/signup')}
                className="w-full sm:w-auto bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white px-8 py-4 rounded-xl font-semibold text-base lg:text-lg transition-all hover:scale-105 flex items-center justify-center space-x-2 shadow-xl shadow-orange-500/30"
              >
                <span>Get Started Free</span>
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8 mb-12 lg:mb-16">
              {stats.map((stat, idx) => (
                <div key={idx} className="text-center">
                  <div className="text-2xl lg:text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                  <div className="text-xs lg:text-sm text-gray-600">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Hero Visual */}
            <div className="relative">
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl lg:rounded-3xl p-4 lg:p-8 shadow-2xl border border-gray-200/50">
                <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-6 shadow-inner">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex space-x-2">
                      <div className="w-2.5 h-2.5 lg:w-3 lg:h-3 bg-red-400 rounded-full"></div>
                      <div className="w-2.5 h-2.5 lg:w-3 lg:h-3 bg-yellow-400 rounded-full"></div>
                      <div className="w-2.5 h-2.5 lg:w-3 lg:h-3 bg-green-400 rounded-full"></div>
                    </div>
                    <div className="text-xs lg:text-sm text-gray-400 font-medium">CVSift Dashboard</div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-3 lg:h-4 bg-gradient-to-r from-gray-200 to-gray-100 rounded-full w-3/4 animate-pulse"></div>
                    <div className="h-3 lg:h-4 bg-gradient-to-r from-orange-200 to-orange-100 rounded-full w-1/2 animate-pulse" style={{animationDelay: '150ms'}}></div>
                    <div className="h-3 lg:h-4 bg-gradient-to-r from-purple-200 to-purple-100 rounded-full w-2/3 animate-pulse" style={{animationDelay: '300ms'}}></div>
                    <div className="grid grid-cols-3 gap-3 lg:gap-4 mt-6">
                      <div className="h-20 lg:h-24 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl shadow-sm"></div>
                      <div className="h-20 lg:h-24 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl shadow-sm"></div>
                      <div className="h-20 lg:h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl shadow-sm"></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-orange-400 rounded-full blur-3xl opacity-40 animate-pulse"></div>
              <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-purple-400 rounded-full blur-3xl opacity-40 animate-pulse" style={{animationDelay: '1s'}}></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 lg:py-24 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <div className="inline-flex items-center space-x-2 bg-orange-100 text-orange-700 px-4 py-2 rounded-full mb-4">
              <Star size={16} />
              <span className="text-sm font-semibold">Powerful Features</span>
            </div>
            <h2 className="text-3xl lg:text-5xl font-bold mb-4 lg:mb-6">
              Everything You Need for{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-orange-500">Smarter Hiring</span>
            </h2>
            <p className="text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto">
              Built for modern recruitment teams who want to move fast without compromising quality
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {features.map((feature, idx) => (
              <div key={idx} className="group bg-white p-6 lg:p-8 rounded-2xl shadow-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100 hover:border-orange-200">
                <div className="w-12 h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-orange-100 to-orange-50 rounded-xl flex items-center justify-center mb-4 lg:mb-6 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                  <feature.icon className="text-orange-600" size={24} />
                </div>
                <h3 className="text-lg lg:text-xl font-bold mb-2 lg:mb-3 text-gray-900">{feature.title}</h3>
                <p className="text-sm lg:text-base text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Workflow Section */}
      <section id="how-it-works" className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <div className="inline-flex items-center space-x-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full mb-4">
              <Zap size={16} />
              <span className="text-sm font-semibold">Interactive Demo</span>
            </div>
            <h2 className="text-3xl lg:text-5xl font-bold mb-4 lg:mb-6">
              See <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-orange-500">CVSift</span> in Action
            </h2>
            <p className="text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto mb-4">
              Try our interactive demo - drag the folder to Step 1 to begin
            </p>
            {completedSteps.length > 0 && (
              <button
                onClick={resetDemo}
                className="text-sm text-orange-600 hover:text-orange-700 font-semibold underline"
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
                className="cursor-move bg-gradient-to-br from-orange-100 to-orange-200 p-6 lg:p-8 rounded-2xl border-2 border-orange-300 shadow-xl hover:scale-110 transition-all duration-300 animate-pulse"
              >
                <Folder size={48} className="text-orange-600 mx-auto mb-2" />
                <p className="text-sm font-bold text-orange-700 text-center">CVs Folder</p>
                <p className="text-xs text-orange-600 text-center mt-1">Drag me to Step 1!</p>
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-4 gap-6 lg:gap-8">
            {/* Step 1: Upload */}
            <div
              className={`relative transition-all duration-300 ${completedSteps.includes(1) ? 'opacity-60' : ''}`}
              onMouseEnter={() => setHoveredStep(0)}
              onMouseLeave={() => setHoveredStep(null)}
            >
              <div className={`bg-gradient-to-br from-orange-50 to-orange-100 p-6 lg:p-8 rounded-2xl border-2 relative overflow-hidden h-full ${
                completedSteps.includes(1) ? 'border-green-400' : 'border-orange-200'
              }`}>
                {(hoveredStep === 0 || isProcessing) && (
                  <div className="absolute top-0 right-0 w-32 h-32 bg-orange-400 rounded-full blur-3xl opacity-40 animate-pulse"></div>
                )}
                {completedSteps.includes(1) && (
                  <div className="absolute top-4 right-4">
                    <CheckCircle2 size={24} className="text-green-500" />
                  </div>
                )}
                <div className="relative z-10">
                  <div className={`w-14 h-14 lg:w-16 lg:h-16 bg-orange-500 rounded-2xl flex items-center justify-center mb-4 lg:mb-6 shadow-lg transition-transform duration-300 ${hoveredStep === 0 || isProcessing ? 'scale-110 rotate-6' : ''}`}>
                    <Upload className="text-white" size={28} />
                  </div>
                  <div className="mb-4">
                    <span className="text-xs lg:text-sm font-bold text-orange-600 bg-orange-200 px-3 py-1 rounded-full">Step 1</span>
                  </div>
                  <h3 className="text-xl lg:text-2xl font-bold mb-2 lg:mb-3 text-gray-900">Upload CVs</h3>
                  <p className="text-sm lg:text-base text-gray-600 leading-relaxed mb-4">
                    Bulk upload hundreds of CVs instantly
                  </p>

                  {!isProcessing && uploadedFiles.length === 0 ? (
                    <div
                      className={`mt-6 border-2 border-dashed rounded-xl p-4 lg:p-6 text-center cursor-pointer transition-all duration-300 ${
                        isDragging
                          ? 'border-orange-500 bg-orange-100 scale-105'
                          : 'border-orange-300 bg-white hover:border-orange-400 hover:bg-orange-50'
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={handleClick}
                    >
                      <Upload size={28} className={`mx-auto mb-3 transition-colors ${isDragging ? 'text-orange-600' : 'text-orange-400'}`} />
                      <p className="text-xs lg:text-sm font-semibold text-gray-700 mb-1">
                        {isDragging ? 'Drop here!' : 'Drop folder here'}
                      </p>
                      <p className="text-xs text-gray-500">or click to try</p>
                    </div>
                  ) : (
                    <div className="mt-6 space-y-2">
                      {uploadedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 text-xs lg:text-sm text-gray-700 bg-white p-2 rounded-lg shadow-sm animate-fadeIn"
                          style={{animationDelay: `${index * 100}ms`}}
                        >
                          <FileText size={14} className="text-orange-500 flex-shrink-0" />
                          <span className="truncate flex-1">{file.name}</span>
                          {file.status === 'completed' ? (
                            <CheckCircle2 size={14} className="text-green-500 flex-shrink-0" />
                          ) : (
                            <div className="w-12 h-1.5 bg-orange-200 rounded-full overflow-hidden flex-shrink-0">
                              <div className="h-full bg-orange-500 animate-progress"></div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className={`absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-10 h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center text-white font-bold shadow-lg z-20 transition-all duration-300 text-sm lg:text-base ${
                completedSteps.includes(1) ? 'bg-green-500' : 'bg-orange-500'
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
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-400 rounded-full blur-3xl opacity-40 animate-pulse"></div>
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
                      <span className="text-xs lg:text-sm font-bold text-purple-600 bg-purple-200 px-3 py-1 rounded-full">Step 2</span>
                    </div>
                    <h3 className="text-xl lg:text-2xl font-bold mb-2 lg:mb-3 text-gray-900">AI Processing</h3>
                    <p className="text-sm lg:text-base text-gray-600 leading-relaxed mb-4">
                      Claude AI extracts data automatically
                    </p>

                    <div className="mt-6">
                      <div className="bg-white p-4 rounded-lg shadow-md">
                        <div className="flex items-center gap-2 text-xs text-gray-600 mb-3">
                          {!completedSteps.includes(2) && <div className="w-2 h-2 bg-purple-500 rounded-full animate-ping"></div>}
                          <Sparkles size={14} className="text-purple-500" />
                          <span className={`font-semibold ${!completedSteps.includes(2) ? 'animate-pulse' : ''}`}>
                            {!completedSteps.includes(2) ? 'Analyzing...' : 'Complete'}
                          </span>
                        </div>
                        <div className="space-y-2 text-xs">
                          <div className="flex items-center gap-2 animate-fadeIn">
                            <CheckCircle2 size={12} className="text-green-500 flex-shrink-0" />
                            <span className="text-gray-700"><strong>Skills:</strong> React, Node.js</span>
                          </div>
                          <div className="flex items-center gap-2 animate-fadeIn" style={{animationDelay: '150ms'}}>
                            <CheckCircle2 size={12} className="text-green-500 flex-shrink-0" />
                            <span className="text-gray-700"><strong>Experience:</strong> 5 years</span>
                          </div>
                          <div className="flex items-center gap-2 animate-fadeIn" style={{animationDelay: '300ms'}}>
                            <CheckCircle2 size={12} className="text-green-500 flex-shrink-0" />
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
                      <span className="text-xs lg:text-sm font-bold text-blue-600 bg-blue-200 px-3 py-1 rounded-full">Step 3</span>
                    </div>
                    <h3 className="text-xl lg:text-2xl font-bold mb-2 lg:mb-3 text-gray-900">Filter & Match</h3>
                    <p className="text-sm lg:text-base text-gray-600 leading-relaxed mb-4">
                      Apply filters or job specifications
                    </p>

                    <div className="mt-6 space-y-2">
                      {!selectedFilter ? (
                        <>
                          <p className="text-xs text-gray-600 mb-2 font-semibold">Click to apply:</p>
                          <button
                            onClick={() => handleFilterClick('skills')}
                            className="w-full bg-white p-2.5 rounded-lg shadow-sm border-2 border-blue-200 hover:border-blue-400 hover:scale-105 transition-all duration-300"
                          >
                            <div className="flex items-center gap-2 text-xs">
                              <Filter size={14} className="text-blue-500 flex-shrink-0" />
                              <span className="font-semibold">Skills:</span>
                              <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">React</span>
                            </div>
                          </button>
                          <button
                            onClick={() => handleFilterClick('experience')}
                            className="w-full bg-white p-2.5 rounded-lg shadow-sm border-2 border-blue-200 hover:border-blue-400 hover:scale-105 transition-all duration-300"
                          >
                            <div className="flex items-center gap-2 text-xs">
                              <Filter size={14} className="text-blue-500 flex-shrink-0" />
                              <span className="font-semibold">Experience:</span>
                              <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">3+ years</span>
                            </div>
                          </button>
                          <button
                            onClick={() => handleFilterClick('jobspec')}
                            className="w-full bg-gradient-to-r from-purple-50 to-purple-100 p-2.5 rounded-lg shadow-sm border-2 border-purple-300 hover:border-purple-400 hover:scale-105 transition-all duration-300"
                          >
                            <div className="flex items-center gap-2 text-xs">
                              <Sparkles size={14} className="text-purple-500 flex-shrink-0" />
                              <span className="font-semibold text-purple-700">Job Match</span>
                            </div>
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="bg-white p-2.5 rounded-lg shadow-md border-2 border-blue-400 animate-fadeIn">
                            <div className="flex items-center gap-2 text-xs">
                              <Filter size={14} className="text-blue-500 flex-shrink-0" />
                              <span className="font-semibold">Applied: {selectedFilter}</span>
                              <CheckCircle2 size={14} className="text-green-500 ml-auto" />
                            </div>
                          </div>
                          {showMatches && (
                            <div className="mt-4 text-center animate-fadeIn">
                              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 px-4 py-2 rounded-full text-xs font-bold shadow-lg scale-110">
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
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 lg:p-8 rounded-2xl border-2 border-green-200 relative overflow-hidden h-full">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-green-400 rounded-full blur-3xl opacity-40 animate-pulse"></div>
                  <div className="relative z-10">
                    <div className="w-14 h-14 lg:w-16 lg:h-16 bg-green-500 rounded-2xl flex items-center justify-center mb-4 lg:mb-6 shadow-lg scale-110 rotate-6 animate-pulse">
                      <Download className="text-white" size={28} />
                    </div>
                    <div className="mb-4">
                      <span className="text-xs lg:text-sm font-bold text-green-600 bg-green-200 px-3 py-1 rounded-full">Step 4</span>
                    </div>
                    <h3 className="text-xl lg:text-2xl font-bold mb-2 lg:mb-3 text-gray-900">Export & Hire</h3>
                    <p className="text-sm lg:text-base text-gray-600 leading-relaxed mb-4">
                      Export and analyze results
                    </p>

                    <div className="mt-6 space-y-3">
                      <button className="w-full bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-lg text-sm font-bold transition-all shadow-lg flex items-center justify-center gap-2 scale-105">
                        <Download size={16} />
                        <span>Downloading...</span>
                        <CheckCircle2 size={16} className="animate-fadeIn" />
                      </button>
                      <div className="bg-white p-3 rounded-lg shadow-md animate-fadeIn">
                        <div className="flex items-center justify-between text-xs mb-3">
                          <span className="text-gray-700 font-semibold">Skills Distribution</span>
                          <BarChart3 size={14} className="text-green-500" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-700 w-14 font-medium">React</span>
                            <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-green-500 rounded-full transition-all duration-700 w-[85%]"></div>
                            </div>
                            <span className="text-xs text-gray-600 w-8 text-right">85%</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-700 w-14 font-medium">Node.js</span>
                            <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-green-400 rounded-full transition-all duration-700 w-[70%]"></div>
                            </div>
                            <span className="text-xs text-gray-600 w-8 text-right">70%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-10 h-10 lg:w-12 lg:h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg z-20 animate-pulse scale-125 text-sm lg:text-base">
                  4
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-16 lg:py-24 bg-gradient-to-b from-gray-50 to-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <div className="inline-flex items-center space-x-2 bg-green-100 text-green-700 px-4 py-2 rounded-full mb-4">
              <TrendingUp size={16} />
              <span className="text-sm font-semibold">Loved by HR Teams</span>
            </div>
            <h2 className="text-3xl lg:text-5xl font-bold mb-4 lg:mb-6">
              Trusted by <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-orange-500">500+</span> Companies
            </h2>
            <p className="text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto">
              See what recruitment teams are saying about CVSift
            </p>
          </div>

          <div className="relative">
            <div className="testimonial-ticker">
              <div className="testimonial-track">
                {[...testimonials, ...testimonials].map((testimonial, idx) => (
                  <div key={idx} className="testimonial-card bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex-shrink-0">
                    <div className="flex mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={16} className="text-yellow-400 fill-yellow-400" />
                      ))}
                    </div>
                    <p className="text-gray-700 leading-relaxed italic">"{testimonial.quote}"</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full mb-4">
              <CheckCircle2 size={16} />
              <span className="text-sm font-semibold">Flexible Plans</span>
            </div>
            <h2 className="text-3xl lg:text-5xl font-bold mb-4 lg:mb-6">
              Simple, <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-orange-500">Transparent</span> Pricing
            </h2>
            <p className="text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto">
              Choose the perfect plan for your team. Start free and upgrade anytime.
            </p>
          </div>

          {/* Main 3 Tiers */}
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-12">
            {pricingTiers.filter(t => ['Free', 'Basic', 'Professional'].includes(t.name)).map((tier, idx) => (
              <div key={idx} className={`relative bg-white rounded-xl p-6 border transition-all hover:shadow-xl ${
                tier.popular
                  ? 'border-orange-500 shadow-lg ring-2 ring-orange-500 ring-opacity-50'
                  : 'border-gray-200'
              }`}>
                {tier.popular && (
                  <div className="absolute -top-3 left-6 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                    MOST POPULAR
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold mb-3">{tier.name}</h3>
                  <div className="mb-4">
                    <span className="text-3xl font-bold">{tier.price}</span>
                    {tier.period === 'per month' && <span className="text-gray-500 ml-1">/mo</span>}
                  </div>
                  <div className="inline-block bg-orange-50 border border-orange-200 px-4 py-1.5 rounded-full">
                    <span className="text-sm font-bold text-orange-700">{tier.cvLimit}/month</span>
                  </div>
                </div>

                <ul className="space-y-2.5 mb-6 min-h-[100px]">
                  {tier.features.slice(0, 3).map((feature, fidx) => (
                    <li key={fidx} className="flex items-start space-x-2">
                      <CheckCircle2 className="text-orange-500 flex-shrink-0 mt-0.5" size={16} />
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </li>
                  ))}
                  {tier.features.length > 3 && (
                    <li className="text-sm text-gray-500 italic">+ {tier.features.length - 3} more</li>
                  )}
                </ul>

                <button
                  onClick={() => navigate('/signup')}
                  className={`w-full py-2.5 rounded-lg font-semibold transition-all ${
                    tier.popular
                      ? 'bg-orange-500 text-white hover:bg-orange-600'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  {tier.cta}
                </button>
              </div>
            ))}
          </div>

          {/* Enterprise Banner */}
          {pricingTiers.filter(t => t.name === 'Enterprise').map((tier, idx) => (
            <div key={idx} className="max-w-4xl mx-auto">
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-8 text-white">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                    <p className="text-gray-300 mb-4">For large organizations with complex needs</p>
                    <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                      <span className="px-3 py-1 bg-white/10 rounded-full text-sm">Unlimited CVs</span>
                      <span className="px-3 py-1 bg-white/10 rounded-full text-sm">Custom Integrations</span>
                      <span className="px-3 py-1 bg-white/10 rounded-full text-sm">Dedicated Support</span>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/signup')}
                    className="px-8 py-3 bg-white text-gray-900 rounded-lg font-bold hover:bg-gray-100 transition-all"
                  >
                    {tier.cta}
                  </button>
                </div>
              </div>
            </div>
          ))}

          <div className="text-center mt-8 lg:mt-12">
            <p className="text-sm lg:text-base text-gray-600">
              Need more capacity? <a href="/pricing" className="text-orange-600 font-semibold hover:underline">Purchase CV packs</a> to add extra processing capacity to any plan
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24 bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLW9wYWNpdHk9Ii4xIi8+PC9nPjwvc3ZnPg==')] opacity-10"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl lg:text-5xl font-bold mb-4 lg:mb-6">
            Ready to Hire Smarter?
          </h2>
          <p className="text-lg lg:text-xl mb-8 lg:mb-12 opacity-90">
            Join 500+ companies using CVSift to find top talent faster. Get started today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate('/signup')}
              className="w-full sm:w-auto bg-white text-orange-600 px-8 py-4 rounded-xl font-semibold text-base lg:text-lg hover:scale-105 transition-all shadow-2xl hover:shadow-white/50"
            >
              Start Free
            </button>
            <button className="w-full sm:w-auto border-2 border-white text-white px-8 py-4 rounded-xl font-semibold text-base lg:text-lg hover:bg-white/10 transition-all">
              Schedule a Demo
            </button>
          </div>
          <p className="mt-6 text-sm opacity-80">Free plan included • No credit card required • Upgrade anytime</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12 mb-8 lg:mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-sm">CV</span>
                </div>
                <span className="text-white text-xl font-bold">Sift</span>
              </div>
              <p className="text-sm leading-relaxed mb-4">Making hiring faster and smarter with AI-powered CV screening.</p>
              <p className="text-xs text-gray-500 mb-2">
                Support: <a href="mailto:emma@automore.co.za" className="text-orange-500 hover:text-orange-400 transition-colors font-semibold">emma@automore.co.za</a>
              </p>
              <p className="text-xs text-gray-500 mb-4">
                Developed and designed by{' '}
                <a
                  href="https://www.automore.co.za"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-500 hover:text-orange-400 transition-colors font-semibold"
                >
                  Automore
                </a>
              </p>
              <div className="flex space-x-3">
                <a href="#" className="w-8 h-8 bg-gray-800 hover:bg-orange-600 rounded-lg flex items-center justify-center transition-colors">
                  <span className="sr-only">Twitter</span>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path></svg>
                </a>
                <a href="#" className="w-8 h-8 bg-gray-800 hover:bg-orange-600 rounded-lg flex items-center justify-center transition-colors">
                  <span className="sr-only">LinkedIn</span>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"></path></svg>
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Product</h4>
              <ul className="space-y-2.5 text-sm">
                <li><a href="#features" className="hover:text-orange-500 transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-orange-500 transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-orange-500 transition-colors">API Docs</a></li>
                <li><a href="#" className="hover:text-orange-500 transition-colors">Integrations</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Company</h4>
              <ul className="space-y-2.5 text-sm">
                <li><a href="/about" className="hover:text-orange-500 transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-orange-500 transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-orange-500 transition-colors">Careers</a></li>
                <li><a href="/contact" className="hover:text-orange-500 transition-colors">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Legal</h4>
              <ul className="space-y-2.5 text-sm">
                <li><a href="/privacy-policy" className="hover:text-orange-500 transition-colors">Privacy Policy</a></li>
                <li><a href="/terms-of-service" className="hover:text-orange-500 transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-orange-500 transition-colors">GDPR</a></li>
                <li><a href="#" className="hover:text-orange-500 transition-colors">Security</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-center md:text-left mb-4 md:mb-0">&copy; 2025 CVSift. All rights reserved.</p>
            <div className="flex items-center space-x-6 text-sm">
              <a href="/privacy-policy" className="hover:text-orange-500 transition-colors">Privacy Policy</a>
              <a href="/terms-of-service" className="hover:text-orange-500 transition-colors">Terms of Service</a>
              <a href="https://www.automore.co.za" target="_blank" rel="noopener noreferrer" className="hover:text-orange-500 transition-colors">About Automore</a>
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