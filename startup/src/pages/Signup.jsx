import { useState } from 'react';
import { auth } from '../firebase/config';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const Logo = () => (
  <svg className="h-8 w-8 text-indigo-400 drop-shadow-[0_0_10px_rgba(99,102,241,0.6)]" viewBox="0 0 24 24" fill="none">
    <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
    <path d="M2 17l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
    <path d="M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
  </svg>
);

const ROLES = [
  { key: 'founder', label: 'Founder', icon: '🚀', desc: 'Build & lead a startup' },
  { key: 'freelancer', label: 'Freelancer', icon: '💻', desc: 'Earn equity contributions' },
  { key: 'investor', label: 'Investor', icon: '📈', desc: 'Fund great startups' },
  { key: 'buyer', label: 'Early Adopter', icon: '🛒', desc: 'Access MVPs first' },
];

function PasswordStrength({ password }) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-emerald-500'];
  const labels = ['Weak', 'Fair', 'Good', 'Strong'];
  if (!password) return null;
  return (
    <div className="space-y-1.5 mt-2">
      <div className="flex gap-1">
        {[0,1,2,3].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < score ? colors[score - 1] : 'bg-slate-800'}`} />
        ))}
      </div>
      <p className={`text-[10px] font-medium ${score <= 1 ? 'text-red-400' : score === 2 ? 'text-orange-400' : score === 3 ? 'text-yellow-400' : 'text-emerald-400'}`}>
        {labels[score - 1] || 'Enter a password'}
      </p>
    </div>
  );
}

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('founder');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const db = getFirestore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        role,
        createdAt: new Date().toISOString(),
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message.replace('Firebase: ', '').replace(/\(.*\)/, '').trim());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#030712] font-sans">
      {/* ── Left Branding Panel ── */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[60%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[50%] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none" />

        <div className="flex items-center gap-2.5 relative z-10 cursor-pointer" onClick={() => navigate('/')}>
          <Logo />
          <span className="text-xl font-bold text-white">FoundryHub</span>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-4xl font-extrabold text-white mb-4 leading-tight">
              Join the<br />
              <span className="gradient-text">Innovation Revolution</span>
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed">
              Connect with 2,400+ founders, freelancers, and investors. Build your next big thing together.
            </p>
          </div>

          {/* Role grid preview */}
          <div className="grid grid-cols-2 gap-3">
            {ROLES.map((r) => (
              <div key={r.key} className="glass-card p-4 flex items-start gap-3">
                <span className="text-xl">{r.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-white">{r.label}</p>
                  <p className="text-xs text-slate-500">{r.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-slate-700 relative z-10">© 2025 FoundryHub · Free to join</p>
      </div>

      {/* ── Right Form Panel ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 sm:px-8 py-12 overflow-y-auto relative">
        <div className="lg:hidden absolute top-[-15%] left-[-15%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />

        <div className="lg:hidden absolute top-6 left-6 flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <Logo />
          <span className="font-bold text-white text-lg">FoundryHub</span>
        </div>

        <div className="w-full max-w-md relative z-10 animate-fade-up">
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">Create account</h1>
            <p className="text-slate-400 text-sm">Join the FoundryHub ecosystem — free forever</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/25 text-red-400 px-4 py-3 rounded-xl text-sm animate-fade-in">
                {error}
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Email address</label>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900/60 border border-slate-800 focus:border-indigo-500/70 focus:ring-2 focus:ring-indigo-500/15 text-white placeholder-slate-600 rounded-xl px-4 py-3.5 text-sm outline-none transition-all input-glow"
                placeholder="name@example.com"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900/60 border border-slate-800 focus:border-indigo-500/70 focus:ring-2 focus:ring-indigo-500/15 text-white placeholder-slate-600 rounded-xl px-4 py-3.5 pr-12 text-sm outline-none transition-all input-glow"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-1">
                  <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    {showPassword
                      ? <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      : <><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></>}
                  </svg>
                </button>
              </div>
              <PasswordStrength password={password} />
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Confirm password</label>
              <input
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full bg-slate-900/60 border focus:ring-2 focus:ring-indigo-500/15 text-white placeholder-slate-600 rounded-xl px-4 py-3.5 text-sm outline-none transition-all input-glow ${
                  confirmPassword && confirmPassword !== password ? 'border-red-500/50' : 'border-slate-800 focus:border-indigo-500/70'
                }`}
                placeholder="••••••••"
              />
              {confirmPassword && confirmPassword !== password && (
                <p className="text-[10px] text-red-400">Passwords don't match</p>
              )}
            </div>

            {/* Role Cards */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">I am joining as a…</label>
              <div className="grid grid-cols-2 gap-2">
                {ROLES.map((r) => (
                  <button type="button" key={r.key}
                    onClick={() => setRole(r.key)}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
                      role === r.key
                        ? 'border-indigo-500/60 bg-indigo-500/10 text-white'
                        : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                    }`}>
                    <span className="text-lg flex-shrink-0">{r.icon}</span>
                    <div>
                      <p className="text-xs font-semibold leading-tight">{r.label}</p>
                      <p className="text-[10px] text-slate-500 leading-tight">{r.desc}</p>
                    </div>
                    {role === r.key && (
                      <svg className="w-3.5 h-3.5 text-indigo-400 ml-auto flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-60 text-white py-3.5 rounded-xl text-sm font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating account…
                </>
              ) : 'Create My Account'}
            </button>

            <p className="text-[10px] text-slate-600 text-center">By signing up, you agree to our Terms of Service and Privacy Policy.</p>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;