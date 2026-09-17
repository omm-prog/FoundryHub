import { useState } from "react";
import { auth } from "../firebase/config";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";
import { getFirestore, doc, getDoc } from "firebase/firestore";

// ── Demo User Personas ────────────────────────────────────────────────────────
const DEMO_USERS = [
  {
    role: "founder",
    label: "Founder",
    name: "Alex Rivera",
    title: "Co-founder & CEO",
    company: "FoundryHub",
    tagline: "Build · Recruit · Raise",
    email: "demo.founder@foundryhub.dev",
    password: "Demo@1234",
    emoji: "🚀",
    gradient: "from-indigo-500 to-purple-600",
    border: "border-indigo-500/35",
    bg: "bg-indigo-500/8",
    avatarBg: "from-indigo-500 to-purple-600",
    stats: [
      { label: "Projects", value: "3" },
      { label: "Team Size", value: "12" },
      { label: "Raised", value: "$50K" },
    ],
    skills: ["Product", "Strategy", "Pitching"],
    activity: "Created a new project 2h ago",
  },
  {
    role: "freelancer",
    label: "Freelancer",
    name: "Priya Sharma",
    title: "Full-Stack Developer",
    company: "Available",
    tagline: "Code · Earn Equity · Grow",
    email: "demo.freelancer@foundryhub.dev",
    password: "Demo@1234",
    emoji: "💻",
    gradient: "from-cyan-500 to-blue-600",
    border: "border-cyan-500/35",
    bg: "bg-cyan-500/8",
    avatarBg: "from-cyan-500 to-blue-600",
    stats: [
      { label: "Projects", value: "7" },
      { label: "Equity Held", value: "8%" },
      { label: "Rate", value: "$45/hr" },
    ],
    skills: ["React", "Node.js", "UI/UX"],
    activity: "Joined FoundryHub team 1d ago",
  },
  {
    role: "investor",
    label: "Investor",
    name: "Marcus Chen",
    title: "Angel Investor",
    company: "Chen Capital",
    tagline: "Discover · Analyze · Invest",
    email: "demo.investor@foundryhub.dev",
    password: "Demo@1234",
    emoji: "💰",
    gradient: "from-emerald-500 to-teal-600",
    border: "border-emerald-500/35",
    bg: "bg-emerald-500/8",
    avatarBg: "from-emerald-500 to-teal-600",
    stats: [
      { label: "Portfolio", value: "14" },
      { label: "Invested", value: "$2.1M" },
      { label: "Avg IRR", value: "34%" },
    ],
    skills: ["Due Diligence", "SaaS", "Fintech"],
    activity: "Made an offer on FoundryHub 3h ago",
  },
  {
    role: "buyer",
    label: "Buyer",
    name: "Sofia Patel",
    title: "Startup Acquirer",
    company: "Patel Ventures",
    tagline: "Browse · Evaluate · Acquire",
    email: "demo.buyer@foundryhub.dev",
    password: "Demo@1234",
    emoji: "🛒",
    gradient: "from-amber-500 to-orange-600",
    border: "border-amber-500/35",
    bg: "bg-amber-500/8",
    avatarBg: "from-amber-500 to-orange-600",
    stats: [
      { label: "Acquired", value: "6" },
      { label: "Budget", value: "$500K" },
      { label: "Avg Deal", value: "$83K" },
    ],
    skills: ["M&A", "Valuation", "Ops"],
    activity: "Browsing 4 startups right now",
  },
];

const Logo = () => (
  <svg className="h-8 w-8 text-indigo-400 drop-shadow-[0_0_10px_rgba(99,102,241,0.6)]" viewBox="0 0 24 24" fill="none">
    <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
    <path d="M2 17l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
    <path d="M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
  </svg>
);

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [demoError, setDemoError] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(null);
  const navigate = useNavigate();
  const db = getFirestore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        localStorage.setItem("userRole", userDoc.data().role);
      }
      navigate("/dashboard");
    } catch (err) {
      setError(err.message.replace("Firebase: ", "").replace(/\(.*\)/, "").trim());
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoUser) => {
    setDemoError("");
    setError("");
    setDemoLoading(demoUser.role);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, demoUser.email, demoUser.password);
      const user = userCredential.user;
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        localStorage.setItem("userRole", userDoc.data().role);
      }
      navigate("/dashboard");
    } catch (err) {
      setDemoError("Demo accounts aren't ready yet — come back soon!");
    } finally {
      setDemoLoading(null);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#030712] font-sans">

      {/* ── Left Panel (Desktop only) ── */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[60%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[50%] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none" />

        <div className="flex items-center gap-2.5 relative z-10 cursor-pointer" onClick={() => navigate("/")}>
          <Logo />
          <span className="text-xl font-bold text-white">FoundryHub</span>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-4xl font-extrabold text-white mb-4 leading-tight">
              Welcome back to the<br />
              <span className="gradient-text">Innovation Hub</span>
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed">
              Your startup community is waiting. Sign in to access your projects, collaborate with your team, and track your progress.
            </p>
          </div>
          <div className="space-y-4">
            {[
              { icon: "🤖", text: "AI Co-Pilot powered by Gemini" },
              { icon: "🏢", text: "Real-time collaboration pods" },
              { icon: "💰", text: "Transparent equity tracking" },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <span className="text-xl">{icon}</span>
                <span className="text-slate-300 text-sm">{text}</span>
              </div>
            ))}
          </div>
          <div className="glass-card p-5">
            <p className="text-slate-300 text-sm leading-relaxed mb-3">"FoundryHub helped us close our seed round in 6 weeks. The AI pitch advisor is incredible."</p>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">SC</div>
              <div>
                <p className="text-xs font-semibold text-white">Sarah Chen</p>
                <p className="text-[10px] text-slate-500">Founder, TechForward</p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-700 relative z-10">© 2025 FoundryHub</p>
      </div>

      {/* ── Right Panel ── */}
      <div className="w-full lg:w-1/2 flex items-start justify-center px-4 sm:px-8 py-10 relative overflow-y-auto">
        {/* Mobile glows */}
        <div className="lg:hidden absolute top-[-15%] left-[-15%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
        <div className="lg:hidden absolute bottom-[-15%] right-[-15%] w-[50%] h-[50%] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none" />

        {/* Mobile logo */}
        <div className="lg:hidden absolute top-6 left-6 flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
          <Logo />
          <span className="font-bold text-white text-lg">FoundryHub</span>
        </div>

        <div className="w-full max-w-md relative z-10 animate-fade-up pt-16 lg:pt-6">

          {/* ── Sign In Form ── */}
          <div className="mb-2">
            <h1 className="text-3xl font-extrabold text-white tracking-tight mb-1">Sign in</h1>
            <p className="text-slate-400 text-sm">Access your dashboard and project pods</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/25 text-red-400 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-slate-400">Email address</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900/60 border border-slate-800 focus:border-indigo-500/70 focus:ring-2 focus:ring-indigo-500/15 text-white placeholder-slate-600 rounded-xl px-4 py-3 text-sm outline-none transition-all input-glow"
                placeholder="name@example.com"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-slate-400">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900/60 border border-slate-800 focus:border-indigo-500/70 focus:ring-2 focus:ring-indigo-500/15 text-white placeholder-slate-600 rounded-xl px-4 py-3 pr-12 text-sm outline-none transition-all input-glow"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-1">
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading || !!demoLoading}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-60 text-white py-3 rounded-xl text-sm font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in…
                </>
              ) : "Sign In"}
            </button>
          </form>

          {/* Create account — small, below form */}
          <p className="mt-4 text-center text-sm text-slate-500">
            Don't have an account?{" "}
            <Link to="/signup" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
              Create one free →
            </Link>
          </p>

          {/* ── Demo Section ── */}
          <div className="mt-8 pt-6 border-t border-slate-800/60">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-bold text-white">Explore as a Demo User</p>
                <p className="text-xs text-slate-500 mt-0.5">One click · No signup · Real data</p>
              </div>
              <span className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[10px] font-semibold px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
            </div>

            {/* Demo error */}
            {demoError && (
              <div className="mb-3 bg-amber-500/10 border border-amber-500/25 text-amber-400 px-3 py-2.5 rounded-xl text-xs flex items-start gap-2">
                <span className="shrink-0">⚠️</span>
                <span>{demoError}</span>
              </div>
            )}

            {/* 2x2 Rich Demo Cards */}
            <div className="grid grid-cols-2 gap-3">
              {DEMO_USERS.map((demo) => (
                <button
                  key={demo.role}
                  onClick={() => handleDemoLogin(demo)}
                  disabled={!!demoLoading || loading}
                  className={`group relative flex flex-col gap-2.5 p-3.5 rounded-2xl border ${demo.border} ${demo.bg} hover:scale-[1.025] active:scale-[0.975] transition-all duration-200 text-left disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden`}
                >
                  {/* Top: Avatar + role badge + arrow */}
                  <div className="flex items-start justify-between">
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${demo.avatarBg} flex items-center justify-center text-sm shadow-md flex-shrink-0`}>
                      {demo.emoji}
                    </div>
                    <div className="flex items-center gap-1">
                      {demoLoading === demo.role ? (
                        <svg className="animate-spin w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : (
                        <svg className="w-3.5 h-3.5 text-slate-700 group-hover:text-slate-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                      )}
                    </div>
                  </div>

                  {/* Name + Title */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className={`text-[10px] font-bold bg-gradient-to-r ${demo.gradient} bg-clip-text text-transparent uppercase tracking-wider`}>
                        {demo.label}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-white leading-tight">{demo.name}</p>
                    <p className="text-[10px] text-slate-500 leading-tight">{demo.title} · {demo.company}</p>
                  </div>

                  {/* Stats row */}
                  <div className="flex gap-2 pt-1 border-t border-white/5">
                    {demo.stats.map((s) => (
                      <div key={s.label} className="flex-1 text-center">
                        <p className={`text-xs font-bold bg-gradient-to-r ${demo.gradient} bg-clip-text text-transparent`}>{s.value}</p>
                        <p className="text-[9px] text-slate-600 leading-tight">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Skills pills */}
                  <div className="flex flex-wrap gap-1">
                    {demo.skills.map((skill) => (
                      <span key={skill} className="text-[9px] font-medium text-slate-500 bg-slate-800/60 px-1.5 py-0.5 rounded-md">
                        {skill}
                      </span>
                    ))}
                  </div>

                  {/* Activity */}
                  <p className="text-[9px] text-slate-600 leading-tight flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-emerald-500/70 flex-shrink-0" />
                    {demo.activity}
                  </p>
                </button>
              ))}
            </div>

            <p className="mt-3 text-center text-[10px] text-slate-700">
              All 4 accounts share the same live Firebase data.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;
