import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

/* ── Animated counter hook ── */
function useCounter(target, duration = 2000, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
}

/* ── Intersection observer hook ── */
function useInView(threshold = 0.2) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setInView(true); observer.disconnect(); }
    }, { threshold });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);
  return [ref, inView];
}

/* ── Logo SVG ── */
const Logo = ({ size = 8 }) => (
  <svg className={`h-${size} w-${size} text-indigo-500 drop-shadow-[0_0_10px_rgba(99,102,241,0.6)]`} viewBox="0 0 24 24" fill="none">
    <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
    <path d="M2 17l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
    <path d="M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
  </svg>
);

const roles = [
  {
    key: 'founder',
    label: 'Founder',
    icon: '🚀',
    color: 'from-indigo-500 to-purple-600',
    badge: 'bg-indigo-500/20 text-indigo-300',
    heading: 'Turn Your Vision Into Reality',
    desc: 'Create your startup project, recruit top talent with sweat-equity deals, pitch to investors, and launch your product — all in one place.',
    points: ['Post your project & define roles', 'Attract freelancers via equity deals', 'One-click investor pitching', 'Real-time collaboration pods'],
  },
  {
    key: 'freelancer',
    label: 'Freelancer',
    icon: '💻',
    color: 'from-teal-500 to-emerald-600',
    badge: 'bg-teal-500/20 text-teal-300',
    heading: 'Build Your Startup Portfolio',
    desc: 'Join early-stage startups, earn equity for your contributions, and build a reputation that opens doors.',
    points: ['Browse curated startup opportunities', 'Negotiate equity + salary hybrid deals', 'Track your contribution & vesting', 'Build your founder-ready reputation'],
  },
  {
    key: 'investor',
    label: 'Investor',
    icon: '📈',
    color: 'from-blue-500 to-cyan-600',
    badge: 'bg-blue-500/20 text-blue-300',
    heading: 'Access Curated Deal Flow',
    desc: 'Discover vetted startups, review AI-generated pitch analyses, and invest directly through secure, transparent channels.',
    points: ['Filter startups by sector & stage', 'AI-assisted pitch deck analysis', 'Secure direct investment channels', 'Real-time portfolio tracking'],
  },
  {
    key: 'buyer',
    label: 'Early Adopter',
    icon: '🛒',
    color: 'from-orange-500 to-rose-500',
    badge: 'bg-orange-500/20 text-orange-300',
    heading: 'Discover Tomorrow\'s Products Today',
    desc: 'Access MVPs before they go mainstream, provide feedback that shapes products, and earn rewards for early support.',
    points: ['Early access to innovative MVPs', 'Shape products with direct feedback', 'Exclusive early-adopter pricing', 'Direct connection with founders'],
  },
];

const features = [
  { icon: '🤖', title: 'AI Co-Pilot', desc: 'Gemini-powered advisor helps you validate ideas, write pitches, and plan your launch strategy with contextual memory.', wide: true },
  { icon: '🏢', title: 'Collaboration Pods', desc: 'Secure, role-based project workspaces with real-time chat and task tracking.' },
  { icon: '💰', title: 'Hour Staking', desc: 'Transparent sweat equity tracking. Contribute time, earn ownership.' },
  { icon: '📊', title: 'Live Analytics', desc: 'Real-time dashboards for every role.' },
  { icon: '🛒', title: 'MVP Marketplace', desc: 'Launch directly to early adopters.' },
  { icon: '🔒', title: 'Secure & Transparent', desc: 'Firebase-backed security with full audit trails.' },
];

const testimonials = [
  { name: 'Sarah Chen', role: 'Founder', text: 'FoundryHub cut our team assembly time by 3x. The AI Co-Pilot helped us refine our pitch and we closed our seed round in 6 weeks.', initials: 'SC', color: 'from-indigo-500 to-purple-500' },
  { name: 'Arjun Mehta', role: 'Investor', text: 'The deal flow quality is exceptional. I\'ve backed 4 companies through the platform in 2 months. The AI pitch analysis is a game-changer.', initials: 'AM', color: 'from-blue-500 to-cyan-500' },
  { name: 'Priya Sharma', role: 'Freelancer', text: 'I have 12% equity in a fintech startup from 3 months of part-time work. The transparency in contribution tracking made it a no-brainer.', initials: 'PS', color: 'from-teal-500 to-emerald-500' },
];

export default function FoundryHubLanding() {
  const [activeRole, setActiveRole] = useState('founder');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [statsRef, statsInView] = useInView();
  const navigate = useNavigate();

  const foundersCount = useCounter(2400, 2200, statsInView);
  const projectsCount = useCounter(890, 2000, statsInView);
  const investedCount = useCounter(12, 2400, statsInView);

  const activeRoleData = roles.find((r) => r.key === activeRole);

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 font-sans overflow-x-hidden selection:bg-indigo-500/30 selection:text-white">

      {/* ── Ambient Background ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-15%] left-[-10%] w-[70%] h-[60%] rounded-full bg-indigo-500/8 blur-[140px]" />
        <div className="absolute top-[20%] right-[-15%] w-[60%] h-[55%] rounded-full bg-purple-500/7 blur-[140px]" />
        <div className="absolute bottom-[-10%] left-[20%] w-[55%] h-[40%] rounded-full bg-emerald-500/4 blur-[140px]" />
      </div>

      {/* ── Navigation ── */}
      <nav className="sticky top-0 z-50 bg-[#030712]/80 backdrop-blur-xl border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo */}
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/')}>
              <Logo size={8} />
              <span className="text-xl font-bold tracking-tight text-white">FoundryHub</span>
            </div>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-8">
              {['Features', 'How it works', 'Pricing'].map((item) => (
                <a key={item} href={`#${item.toLowerCase().replace(/ /g, '-')}`}
                  className="text-sm text-slate-400 hover:text-white transition-colors font-medium">
                  {item}
                </a>
              ))}
            </div>

            {/* CTA */}
            <div className="hidden md:flex items-center gap-3">
              <button onClick={() => navigate('/login')}
                className="text-sm font-medium text-slate-300 hover:text-white transition-colors px-4 py-2">
                Sign in
              </button>
              <button onClick={() => navigate('/signup')}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-5 py-2 rounded-xl text-sm font-semibold shadow-lg shadow-indigo-500/25 hover:scale-[1.03] active:scale-[0.97] transition-all duration-200">
                Get Started Free
              </button>
            </div>

            {/* Mobile hamburger */}
            <button onClick={() => setMobileMenuOpen((p) => !p)}
              className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {mobileMenuOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800/60 bg-[#030712]/95 px-4 py-4 space-y-2 animate-slide-down">
            {['Features', 'How it works', 'Pricing'].map((item) => (
              <a key={item} href={`#${item.toLowerCase().replace(/ /g, '-')}`}
                onClick={() => setMobileMenuOpen(false)}
                className="block text-slate-300 hover:text-white px-3 py-2.5 rounded-lg hover:bg-slate-800/50 text-sm font-medium transition-colors">
                {item}
              </a>
            ))}
            <div className="pt-2 grid grid-cols-2 gap-2">
              <button onClick={() => navigate('/login')}
                className="border border-slate-700 text-slate-300 hover:text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all">
                Sign in
              </button>
              <button onClick={() => navigate('/signup')}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold">
                Get Started
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-20 pb-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/25 rounded-full px-4 py-1.5 text-xs text-indigo-300 font-medium mb-8 animate-fade-up">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            Now with Gemini AI Co-Pilot
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05] mb-6 animate-fade-up delay-100">
            Where{' '}
            <span className="gradient-text">Brilliant Minds</span>
            <br />
            Build the Future
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-up delay-200">
            FoundryHub connects <strong className="text-slate-200">founders</strong>, <strong className="text-slate-200">freelancers</strong>, <strong className="text-slate-200">investors</strong>, and <strong className="text-slate-200">early adopters</strong> in a single collaborative ecosystem powered by AI.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-up delay-300">
            <button onClick={() => navigate('/signup')}
              className="group relative bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-8 py-4 rounded-2xl text-base font-semibold shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.03] active:scale-[0.97] transition-all duration-300">
              <span className="flex items-center gap-2">
                Start Building Free
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </span>
            </button>
            <button onClick={() => navigate('/login')}
              className="border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white px-8 py-4 rounded-2xl text-base font-semibold hover:bg-slate-800/50 transition-all duration-200">
              Sign In
            </button>
          </div>

          <p className="mt-5 text-xs text-slate-600 animate-fade-up delay-400">No credit card required · Free forever plan available</p>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section ref={statsRef} className="py-12 px-4 border-y border-slate-800/60 bg-slate-900/20">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-4 sm:gap-8 text-center">
          {[
            { value: foundersCount, suffix: '+', label: 'Active Founders' },
            { value: projectsCount, suffix: '+', label: 'Projects Launched' },
            { value: investedCount, suffix: 'M+', prefix: '₹', label: 'Capital Facilitated' },
          ].map(({ value, suffix, prefix, label }) => (
            <div key={label} className="space-y-1">
              <p className="text-3xl sm:text-4xl font-extrabold text-white">
                {prefix}{value.toLocaleString()}{suffix}
              </p>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features Bento Grid ── */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400 mb-3">Everything You Need</p>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-white">Built for the Entire<br /><span className="gradient-text">Startup Lifecycle</span></h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <div key={f.title}
                className={`glass-card p-6 hover:scale-[1.02] transition-all duration-300 cursor-default group animate-fade-up ${f.wide ? 'sm:col-span-2 lg:col-span-1' : ''}`}
                style={{ animationDelay: `${i * 80}ms` }}>
                <div className="text-3xl mb-4 group-hover:scale-110 transition-transform duration-300 inline-block">{f.icon}</div>
                <h3 className="text-base font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Role Tabs ── */}
      <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-900/20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400 mb-3">For Every Stakeholder</p>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-white">One Platform,<br /><span className="gradient-text">Four Roles</span></h2>
          </div>

          {/* Role selector */}
          <div className="flex flex-wrap gap-2 justify-center mb-12">
            {roles.map((r) => (
              <button key={r.key}
                onClick={() => setActiveRole(r.key)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  activeRole === r.key
                    ? `bg-gradient-to-r ${r.color} text-white shadow-lg`
                    : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}>
                <span>{r.icon}</span> {r.label}
              </button>
            ))}
          </div>

          {/* Role card */}
          {activeRoleData && (
            <div key={activeRole} className="glass-card p-8 sm:p-10 animate-scale-in">
              <div className="grid sm:grid-cols-2 gap-8 items-center">
                <div>
                  <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full mb-4 ${activeRoleData.badge}`}>
                    {activeRoleData.icon} {activeRoleData.label}
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">{activeRoleData.heading}</h3>
                  <p className="text-slate-400 leading-relaxed mb-6">{activeRoleData.desc}</p>
                  <button onClick={() => navigate('/signup')}
                    className={`inline-flex items-center gap-2 bg-gradient-to-r ${activeRoleData.color} text-white px-6 py-3 rounded-xl text-sm font-semibold hover:opacity-90 active:scale-95 transition-all`}>
                    Join as {activeRoleData.label}
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </button>
                </div>
                <div className="space-y-3">
                  {activeRoleData.points.map((p, i) => (
                    <div key={p} className="flex items-start gap-3 animate-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
                      <div className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center bg-gradient-to-br ${activeRoleData.color} mt-0.5`}>
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      </div>
                      <span className="text-sm text-slate-300">{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400 mb-3">Social Proof</p>
            <h2 className="text-4xl font-extrabold text-white">Trusted by Builders</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={t.name} className="glass-card p-6 animate-fade-up" style={{ animationDelay: `${i * 120}ms` }}>
                <p className="text-slate-300 text-sm leading-relaxed mb-6">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-900/20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400 mb-3">Simple Pricing</p>
            <h2 className="text-4xl font-extrabold text-white">Start Free,<br /><span className="gradient-text">Scale as You Grow</span></h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { name: 'Starter', price: '₹0', period: 'forever', features: ['1 active project', '3 team members', 'Basic analytics', 'Community forum'], cta: 'Get Started Free', highlight: false },
              { name: 'Pro', price: '₹999', period: '/month', features: ['Unlimited projects', 'Unlimited team members', 'AI Co-Pilot access', 'Investor pitching', 'Advanced analytics', 'Priority support'], cta: 'Start Pro Trial', highlight: true },
              { name: 'Scale', price: '₹2,499', period: '/month', features: ['Everything in Pro', 'Custom integrations', 'Dedicated account manager', 'White-label option', 'API access', 'SLA guarantee'], cta: 'Contact Sales', highlight: false },
            ].map((plan) => (
              <div key={plan.name}
                className={`rounded-2xl p-6 flex flex-col ${plan.highlight
                  ? 'bg-gradient-to-b from-indigo-500/20 to-purple-500/10 border-2 border-indigo-500/50 relative overflow-hidden'
                  : 'glass-card'}`}>
                {plan.highlight && (
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500" />
                )}
                {plan.highlight && (
                  <span className="absolute -top-px left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-[10px] font-bold px-3 py-1 rounded-b-lg">
                    MOST POPULAR
                  </span>
                )}
                <h3 className="text-base font-semibold text-white mb-1 mt-2">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-extrabold text-white">{plan.price}</span>
                  <span className="text-slate-500 text-sm ml-1">{plan.period}</span>
                </div>
                <ul className="space-y-2.5 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-slate-300">
                      <svg className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <button onClick={() => navigate('/signup')}
                  className={`w-full py-3 rounded-xl text-sm font-semibold transition-all ${plan.highlight
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.02] active:scale-[0.98]'
                    : 'border border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white hover:bg-slate-800/50'}`}>
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <div className="glass-card p-10 sm:p-16 relative overflow-hidden animate-glow-pulse">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/8 to-purple-500/8 pointer-events-none" />
            <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-4 relative z-10">
              Ready to <span className="gradient-text">Launch?</span>
            </h2>
            <p className="text-slate-400 mb-8 relative z-10">Join thousands of founders building the next big thing.</p>
            <button onClick={() => navigate('/signup')}
              className="relative z-10 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-10 py-4 rounded-2xl text-base font-semibold shadow-xl shadow-indigo-500/30 hover:scale-[1.03] active:scale-[0.97] transition-all duration-300">
              Create Your Free Account
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-800/60 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Logo size={7} />
            <span className="font-bold text-white">FoundryHub</span>
          </div>
          <p className="text-xs text-slate-600 text-center">
            © 2025 FoundryHub. Built with ❤️ for the startup community.
          </p>
          <div className="flex gap-4 text-xs text-slate-500">
            <a href="#" className="hover:text-slate-300 transition-colors">Privacy</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Terms</a>
            <a href="mailto:omchauhan2026@gmail.com" className="hover:text-slate-300 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}