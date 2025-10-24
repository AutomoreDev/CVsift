import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Sparkles, ArrowLeft } from 'lucide-react';

export default function AboutUs() {
  const [heroVisible, setHeroVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setHeroVisible(true);
  }, []);

  const stats = [
    { value: '10,000+', label: 'CVs Processed Daily' },
    { value: '500+', label: 'Companies Trust Us' },
    { value: '70%', label: 'Faster Hiring' },
    { value: '98%', label: 'Accuracy Rate' }
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 text-gray-600 hover:text-orange-600 transition-colors"
            >
              <ArrowLeft size={20} />
              <span className="font-medium">Back to Home</span>
            </button>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm">CV</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Sift</span>
            </div>
          </div>
        </div>
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

      {/* About Section */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6 text-center">About CVSift</h2>
          <div className="prose prose-lg max-w-none text-gray-600 space-y-4">
            <p>
              CVSift is an AI-powered CV screening platform that helps recruitment teams process and filter thousands of CVs in minutes. Built with cutting-edge artificial intelligence technology, we make hiring faster, smarter, and more efficient.
            </p>
            <p>
              Our mission is to transform the recruitment process by eliminating the tedious manual work of CV screening, allowing HR professionals to focus on what truly matters: connecting with the right candidates and building exceptional teams.
            </p>
            <p>
              Powered by Claude AI and developed by <a href="https://www.automore.co.za" target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:text-orange-700 font-semibold">Automore</a>, CVSift combines advanced natural language processing with an intuitive interface to deliver unmatched accuracy and speed in CV processing.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
