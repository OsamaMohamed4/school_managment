import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ROLES = {
  admin:   { label: "Admin", abbr: "AD", accent: "text-blue-500", border: "border-blue-500", bgAccent: "bg-blue-500/20", light: "bg-blue-500", bg: "bg-gradient-to-br from-slate-900 to-slate-800" },
  teacher: { label: "Teacher", abbr: "TE", accent: "text-emerald-500", border: "border-emerald-500", bgAccent: "bg-emerald-500/20", light: "bg-emerald-500", bg: "bg-gradient-to-br from-slate-900 to-emerald-950" },
  student: { label: "Student", abbr: "ST", accent: "text-purple-500", border: "border-purple-500", bgAccent: "bg-purple-500/20", light: "bg-purple-500", bg: "bg-gradient-to-br from-slate-900 to-purple-950" },
  parent:  { label: "Parent", abbr: "PA", accent: "text-amber-500", border: "border-amber-500", bgAccent: "bg-amber-500/20", light: "bg-amber-500", bg: "bg-gradient-to-br from-slate-900 to-amber-950" },
};

export default function LoginPage() {
  const { role = "admin" } = useParams();
  const { login } = useAuth();
  const navigate  = useNavigate();
  const R = ROLES[role] || ROLES.admin;

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [focused,  setFocused]  = useState("");

  const submit = async e => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      await login(email, password, role);
      navigate(`/${role}`);
    } catch(err) {
      if (err instanceof Error) {
        setError(err.message);
      } else if (err?.detail) {
        setError(err.detail);
      } else if (err?.error) {
        setError(err.error);
      } else {
        setError("Invalid email or password.");
      }
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row items-stretch font-sora bg-slate-950">
      {/* LEFT PANEL */}
      <div className={`flex-1 flex flex-col items-center justify-center p-8 md:p-12 relative overflow-hidden ${R.bg}`}>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
        
        <div className="relative z-10 text-center">
          <div className={`w-24 h-24 rounded-3xl flex items-center justify-center text-4xl font-bold mx-auto mb-6 shadow-2xl border-2 ${R.border} ${R.bgAccent} ${R.accent}`}>
            {R.abbr}
          </div>
          <h2 className="font-serif text-3xl md:text-4xl font-extrabold text-slate-100 leading-tight mb-4">
            Welcome back,<br />{R.label}
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed max-w-xs mx-auto">
            Sign in to your EduPortal account to access your {role} dashboard.
          </p>
          
          <div className="flex gap-2 justify-center mt-8">
            {["admin","teacher","student","parent"].map(r => (
              <div key={r} className={`h-2 rounded-full transition-all duration-300 ${r === role ? `w-6 ${R.light}` : 'w-2 bg-white/15'}`} />
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="w-full md:w-[420px] bg-slate-900 flex flex-col items-center justify-center p-8 md:p-10 border-t md:border-t-0 md:border-l border-white/10 shrink-0">
        <div className="w-full">
          <div className={`h-1 rounded-full mb-8 ${R.light} w-1/3`} />
          <h2 className="font-serif text-2xl font-extrabold text-slate-100 mb-2">{R.label} Sign In</h2>
          <p className="text-sm text-slate-400 mb-8">Enter your credentials to continue</p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-sm text-red-400 mb-6 flex items-start gap-2">
              <span className="font-bold">!</span> {error}
            </div>
          )}

          <form onSubmit={submit}>
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Email Address</label>
              <input 
                className={`w-full p-3 bg-slate-950 border rounded-xl text-sm text-slate-200 outline-none transition-all duration-200 ${focused === "email" ? `${R.border} ring-2` : 'border-white/10'}`}
                type="email" 
                placeholder="your@email.com" 
                value={email}
                onChange={e => setEmail(e.target.value)} 
                onFocus={() => setFocused("email")} 
                onBlur={() => setFocused("")}
                autoComplete="email" 
              />
            </div>
            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Password</label>
              <input 
                className={`w-full p-3 bg-slate-950 border rounded-xl text-sm text-slate-200 outline-none transition-all duration-200 ${focused === "pass" ? `${R.border} ring-2` : 'border-white/10'}`}
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={e => setPassword(e.target.value)} 
                onFocus={() => setFocused("pass")} 
                onBlur={() => setFocused("")}
                autoComplete="current-password" 
              />
            </div>
            <button 
              className={`w-full p-3 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 ${R.light} shadow-lg`}
              type="submit" 
              disabled={loading}
            >
              {loading ? "Signing in..." : `Sign in as ${R.label} →`}
            </button>
          </form>
          
          <button 
            className="w-full p-3 mt-4 rounded-xl text-sm font-semibold text-slate-400 bg-white/5 border border-white/10 transition-all duration-200 hover:bg-white/10 hover:text-slate-300"
            onClick={() => navigate("/")}
          >
            ← Back to role selection
          </button>
        </div>
      </div>
    </div>
  );
}
