import React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const FoundryHubLanding = () => {
  const [activeTab, setActiveTab] = useState('founder');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/signup');
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 relative overflow-hidden font-sans selection:bg-indigo-500/30 selection:text-white">
      {/* Ambient background glow effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[50%] rounded-full bg-indigo-500/10 blur-[130px] pointer-events-none"></div>
      <div className="absolute top-[30%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/10 blur-[130px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[40%] rounded-full bg-emerald-500/5 blur-[130px] pointer-events-none"></div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-[#030712]/75 backdrop-blur-md border-b border-slate-800/60 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center cursor-pointer" onClick={() => navigate('/')}>
                <svg className="h-8 w-8 text-indigo-500 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8 14C8 14 9.5 16 12 16C14.5 16 16 14 16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M15 9H15.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 9H9.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="ml-2.5 text-xl font-bold tracking-tight text-white font-display">FoundryHub</span>
              </div>
              <div className="hidden sm:ml-10 sm:flex sm:space-x-8">
                <a href="#" className="border-indigo-500 text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors">
                  Home
                </a>
                <a href="#how-it-works" className="border-transparent text-slate-400 hover:text-slate-200 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors">
                  How it works
                </a>
                <a href="#features" className="border-transparent text-slate-400 hover:text-slate-200 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors">
                  Features
                </a>
                <a href="#pricing" className="border-transparent text-slate-400 hover:text-slate-200 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors">
                  Pricing
                </a>
              </div>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              <button 
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-5 py-2 rounded-xl text-sm font-semibold shadow-md shadow-indigo-500/25 hover:shadow-indigo-500/35 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              >
                Get Started
              </button>
            </div>
            <div className="-mr-2 flex items-center sm:hidden">
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <span className="sr-only">Open main menu</span>
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden bg-[#030712]/95 border-b border-slate-800 px-4 pt-2 pb-4 space-y-1">
            <a href="#" className="bg-slate-900 text-white block px-3 py-2 rounded-lg text-base font-medium">Home</a>
            <a href="#how-it-works" className="text-slate-400 hover:bg-slate-800 hover:text-white block px-3 py-2 rounded-lg text-base font-medium">How it works</a>
            <a href="#features" className="text-slate-400 hover:bg-slate-800 hover:text-white block px-3 py-2 rounded-lg text-base font-medium">Features</a>
            <a href="#pricing" className="text-slate-400 hover:bg-slate-800 hover:text-white block px-3 py-2 rounded-lg text-base font-medium">Pricing</a>
            <div className="mt-4 px-3">
              <button 
                onClick={handleGetStarted}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white py-2.5 rounded-xl text-sm font-semibold shadow-md transition-all duration-200"
              >
                Get Started
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden pt-8 pb-16 lg:pt-16 lg:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-center">
            <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold tracking-wide">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
                Introducing FoundryHub Ecosystem
              </div>
              <h1 className="text-4xl tracking-tight font-extrabold text-white sm:text-5xl md:text-6xl font-display leading-[1.1]">
                <span className="block">Where ideas are</span>
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 drop-shadow-[0_2px_15px_rgba(168,85,247,0.15)]">
                  forged into reality
                </span>
              </h1>
              <p className="mt-3 text-base text-slate-450 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                Connect freelancers, startup founders, institutional investors, and product buyers in one unified, collaborative workspace designed to build, fund, and launch startups.
              </p>
              <div className="mt-8 sm:max-w-lg sm:mx-auto sm:text-center lg:text-left lg:mx-0 flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleGetStarted}
                  className="flex items-center justify-center px-8 py-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-purple-600 text-white text-base font-semibold rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                >
                  Get started
                </button>
                <a 
                  href="#features" 
                  className="flex items-center justify-center px-8 py-4 bg-slate-900 border border-slate-800 text-slate-350 hover:text-white rounded-xl hover:bg-slate-850 hover:border-slate-700/80 transition-all duration-200"
                >
                  Explore features
                </a>
              </div>
            </div>
            <div className="mt-12 sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 rounded-2xl blur-2xl"></div>
              <div className="relative mx-auto w-full rounded-2xl border border-slate-800 bg-slate-900/40 p-2 backdrop-blur-md shadow-2xl">
                <img 
                  className="w-full rounded-xl object-cover aspect-[4/3] opacity-80 filter brightness-95 contrast-105" 
                  src="https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80" 
                  alt="FoundryHub Workspace" 
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User Type Selection */}
      <div id="how-it-works" className="py-16 px-4 sm:px-6 lg:px-8 border-t border-slate-900 bg-slate-950/20 relative">
        <div className="absolute top-[40%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none"></div>
        
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              Who are you joining as?
            </h2>
            <p className="mt-4 text-lg text-slate-400">
              Select your role to explore the tailored tooling FoundryHub provides
            </p>
          </div>
          
          <div className="mt-10">
            <div className="border border-slate-850 rounded-2xl bg-slate-900/30 p-1.5 max-w-2xl mx-auto flex flex-wrap justify-between gap-1">
              {['founder', 'freelancer', 'investor', 'buyer'].map((role) => (
                <button
                  key={role}
                  onClick={() => setActiveTab(role)}
                  className={`flex-1 min-w-[100px] text-center py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-350 capitalize ${
                    activeTab === role 
                      ? 'bg-gradient-to-r from-indigo-500/20 to-purple-600/20 border border-indigo-500/30 text-indigo-400 shadow-md' 
                      : 'border border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="mt-10">
            {activeTab === 'founder' && (
              <div className="bg-gradient-to-b from-slate-900/80 to-slate-950/80 border border-slate-800/80 backdrop-blur-md p-8 rounded-2xl shadow-xl flex flex-col justify-between items-start space-y-6 hover:border-slate-700/60 transition-all duration-300">
                <div className="space-y-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-450/10 px-2.5 py-1 rounded-md border border-indigo-400/20">Startup Builder</span>
                  <h3 className="text-2xl font-bold text-white">Startup Founder</h3>
                  <p className="text-slate-400 leading-relaxed text-base">
                    Bring your ideas to life by assembling the perfect cross-functional team, attracting micro-investments, communicating with backers in real-time, and launching your completed product to buyers.
                  </p>
                </div>
                <button 
                  onClick={handleGetStarted}
                  className="w-full sm:w-auto bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 shadow-md shadow-indigo-500/20 hover:scale-[1.02]"
                >
                  Join as Founder
                </button>
              </div>
            )}
            
            {activeTab === 'freelancer' && (
              <div className="bg-gradient-to-b from-slate-900/80 to-slate-950/80 border border-slate-800/80 backdrop-blur-md p-8 rounded-2xl shadow-xl flex flex-col justify-between items-start space-y-6 hover:border-slate-700/60 transition-all duration-300">
                <div className="space-y-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-purple-400 bg-purple-450/10 px-2.5 py-1 rounded-md border border-purple-400/20">Skill Contributor</span>
                  <h3 className="text-2xl font-bold text-white">Freelancer</h3>
                  <p className="text-slate-400 leading-relaxed text-base">
                    Contribute your specialized skills to exciting startup pods, earn sweat equity or direct payouts, gain verifiable credentials, and collaborate dynamically on early stage development.
                  </p>
                </div>
                <button 
                  onClick={handleGetStarted}
                  className="w-full sm:w-auto bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 shadow-md shadow-indigo-500/20 hover:scale-[1.02]"
                >
                  Join as Freelancer
                </button>
              </div>
            )}
            
            {activeTab === 'investor' && (
              <div className="bg-gradient-to-b from-slate-900/80 to-slate-950/80 border border-slate-800/80 backdrop-blur-md p-8 rounded-2xl shadow-xl flex flex-col justify-between items-start space-y-6 hover:border-slate-700/60 transition-all duration-300">
                <div className="space-y-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-450/10 px-2.5 py-1 rounded-md border border-emerald-400/20">Capital Backer</span>
                  <h3 className="text-2xl font-bold text-white">Investor</h3>
                  <p className="text-slate-400 leading-relaxed text-base">
                    Discover promising startups early, track their progress transparently through workspace milestones, submit custom investment offers, communicate directly with founders, and finalize equity payouts.
                  </p>
                </div>
                <button 
                  onClick={handleGetStarted}
                  className="w-full sm:w-auto bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 shadow-md shadow-indigo-500/20 hover:scale-[1.02]"
                >
                  Join as Investor
                </button>
              </div>
            )}
            
            {activeTab === 'buyer' && (
              <div className="bg-gradient-to-b from-slate-900/80 to-slate-950/80 border border-slate-800/80 backdrop-blur-md p-8 rounded-2xl shadow-xl flex flex-col justify-between items-start space-y-6 hover:border-slate-700/60 transition-all duration-300">
                <div className="space-y-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-pink-400 bg-pink-450/10 px-2.5 py-1 rounded-md border border-pink-400/20">Early Supporter</span>
                  <h3 className="text-2xl font-bold text-white">Buyer / Early Adopter</h3>
                  <p className="text-slate-400 leading-relaxed text-base">
                    Browse fully formed MVPs and operational startups listed for purchase, buy innovative tools to accelerate your own operations, and help build active developer loops.
                  </p>
                </div>
                <button 
                  onClick={handleGetStarted}
                  className="w-full sm:w-auto bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 shadow-md shadow-indigo-500/20 hover:scale-[1.02]"
                >
                  Join as Buyer
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-20 bg-[#030712]/50 border-t border-slate-900 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center space-y-4">
            <h2 className="text-sm text-indigo-400 font-bold tracking-wider uppercase bg-indigo-500/5 border border-indigo-500/10 px-3 py-1.5 rounded-full inline-block">Features</h2>
            <p className="text-3xl leading-8 font-extrabold tracking-tight text-white sm:text-4xl">
              A better way to build startups
            </p>
            <p className="max-w-2xl text-xl text-slate-400 lg:mx-auto">
              FoundryHub replaces scattered tools with a single integrated ecosystem for collaboration, funding, and growth.
            </p>
          </div>

          <div className="mt-16">
            <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-12">
              <div className="flex gap-4 p-6 bg-slate-900/30 border border-slate-850 hover:border-slate-800 rounded-2xl backdrop-blur-sm transition-all duration-300">
                <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg leading-6 font-bold text-slate-100">AI Startup Co-Pilot</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Instantly analyze project feasibility. Our AI highlights required team competencies, recommends operational task lists, and templates key components for development speed.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-6 bg-slate-900/30 border border-slate-850 hover:border-slate-800 rounded-2xl backdrop-blur-sm transition-all duration-300">
                <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg leading-6 font-bold text-slate-100">Collaborative Workspace Pods</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Launch project workspaces containing task boards, chat, file logs, and direct access controls, allowing team members, founders, and backers to collaborate in real-time.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-6 bg-slate-900/30 border border-slate-850 hover:border-slate-800 rounded-2xl backdrop-blur-sm transition-all duration-300">
                <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg leading-6 font-bold text-slate-100">Dynamic Capital Offers</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Founders easily configured funding metrics. Backers review real-time milestones and make structured offers for direct payment using UPI or traditional wire systems.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-6 bg-slate-900/30 border border-slate-850 hover:border-slate-800 rounded-2xl backdrop-blur-sm transition-all duration-300">
                <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg leading-6 font-bold text-slate-100">Acquisition Marketplace</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Exit your operational project smoothly. List finished applications and operational MVPs for direct purchase by buyers looking to skip initial boilerplate construction.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div id="pricing" className="bg-[#030712] relative py-20 border-t border-slate-900 overflow-hidden">
        <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/5 blur-[120px] pointer-events-none"></div>
        <div className="max-w-4xl mx-auto text-center py-12 px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="bg-gradient-to-r from-indigo-950/40 via-purple-950/40 to-slate-950/40 border border-indigo-900/40 p-10 sm:p-14 rounded-3xl backdrop-blur-md shadow-2xl space-y-6">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl font-display leading-tight">
              <span className="block">Ready to launch your next big idea?</span>
              <span className="block text-indigo-400">Join FoundryHub today.</span>
            </h2>
            <p className="max-w-xl mx-auto text-base sm:text-lg leading-relaxed text-slate-450">
              Whether you are building, contributing code, investing funds, or buying completed platforms - FoundryHub has your workspace ready.
            </p>
            <div className="pt-4">
              <button
                onClick={handleGetStarted}
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 bg-white text-indigo-950 font-bold rounded-xl hover:bg-slate-100 hover:scale-[1.02] shadow-xl transition-all duration-200 text-base"
              >
                Sign up for free
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#030712] border-t border-slate-900">
        <div className="max-w-7xl mx-auto py-12 px-4 overflow-hidden sm:px-6 lg:px-8">
          <nav className="-mx-5 -my-2 flex flex-wrap justify-center" aria-label="Footer">
            <div className="px-5 py-2">
              <a href="#" className="text-sm text-slate-500 hover:text-slate-350 transition-colors">About</a>
            </div>
            <div className="px-5 py-2">
              <a href="#" className="text-sm text-slate-500 hover:text-slate-350 transition-colors">Blog</a>
            </div>
            <div className="px-5 py-2">
              <a href="#" className="text-sm text-slate-500 hover:text-slate-350 transition-colors">Jobs</a>
            </div>
            <div className="px-5 py-2">
              <a href="#" className="text-sm text-slate-500 hover:text-slate-350 transition-colors">Press</a>
            </div>
            <div className="px-5 py-2">
              <a href="#" className="text-sm text-slate-500 hover:text-slate-350 transition-colors">Partners</a>
            </div>
          </nav>
          <div className="mt-8 flex justify-center space-x-6">
            <a href="#" className="text-slate-600 hover:text-slate-400 transition-colors">
              <span className="sr-only">Twitter</span>
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
              </svg>
            </a>
            <a href="#" className="text-slate-600 hover:text-slate-400 transition-colors">
              <span className="sr-only">GitHub</span>
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
            </a>
            <a href="#" className="text-slate-600 hover:text-slate-400 transition-colors">
              <span className="sr-only">LinkedIn</span>
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
              </svg>
            </a>
          </div>
          <p className="mt-8 text-center text-sm text-slate-600">
            &copy; 2026 FoundryHub. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default FoundryHubLanding;