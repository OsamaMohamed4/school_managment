import { useState } from "react";
import { useNavigate, useParams, Navigate } from "react-router-dom";
import { authAPI } from "../api";
import { useAuth } from "../context/AuthContext";

const ROLE_CONFIG = {
  admin:   { label:"Admin",   color:"#2563EB", bg:"#EFF6FF", border:"#BFDBFE", features:["User Management","Grade & Class Setup","Attendance Reports","System Overview"] },
  teacher: { label:"Teacher", color:"#059669", bg:"#ECFDF5", border:"#A7F3D0", features:["Mark Attendance","Create Quizzes","View Results","Class Reports"] },
  student: { label:"Student", color:"#7C3AED", bg:"#F5F3FF", border:"#DDD6FE", features:["Take Quizzes","View Grades","Attendance History","My Schedule"] },
};

export default function LoginPage() {
  const { role } = useParams();
  const navigate  = useNavigate();
  const { login } = useAuth();

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [errors,   setErrors]   = useState({});
  const [loading,  setLoading]  = useState(false);
  const [apiError, setApiError] = useState("");

  if (!ROLE_CONFIG[role]) return <Navigate to="/" replace />;
  const cfg = ROLE_CONFIG[role];

  const validate = () => {
    const e = {};
    if (!email.trim())              e.email    = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Invalid email";
    if (!password)                  e.password = "Password is required";
    else if (password.length < 6)   e.password = "Min 6 characters";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    setApiError("");
    try {
      const data = await authAPI.login(email, password);
      // Make sure role matches
      if (data.user.role !== role) {
        setApiError(`This account is registered as ${data.user.role}, not ${role}.`);
        setLoading(false);
        return;
      }
      login(data);
      navigate(`/${role}/dashboard`, { replace: true });
    } catch (err) {
      setApiError(err?.error || "Login failed. Check your credentials.");
      setLoading(false);
    }
  };

  const handleKey = (e) => { if (e.key === "Enter") handleSubmit(); };

  return (
    <div style={{ minHeight:"100vh", background:"#F8FAFC", fontFamily:"'DM Sans', sans-serif", display:"flex", flexDirection:"column" }}>
      <style>{`
        * { box-sizing:border-box; margin:0; padding:0; }
        .input-wrap label { display:block; font-size:13px; font-weight:600; color:#374151; margin-bottom:6px; }
        .input-wrap input { width:100%; padding:11px 14px; border:1.5px solid #E2E8F0; border-radius:10px; font-size:14px; color:#0F172A; background:#F8FAFC; outline:none; transition:border-color .2s; font-family:inherit; }
        .input-wrap input:focus { border-color:var(--focus-c); background:#fff; }
        .input-wrap input.err { border-color:#EF4444; }
        .err-msg { color:#EF4444; font-size:12px; margin-top:4px; }
        .spinner { width:18px; height:18px; border:2px solid rgba(255,255,255,.4); border-top-color:#fff; border-radius:50%; animation:spin .6s linear infinite; }
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      {/* NAV */}
      <nav style={{ background:"#fff", borderBottom:"1.5px solid #E2E8F0", padding:"0 32px", height:60, display:"flex", alignItems:"center", gap:12 }}>
        <button onClick={() => navigate("/")} style={{ display:"flex", alignItems:"center", gap:8, background:"none", border:"none", cursor:"pointer", color:"#64748B", fontSize:14, fontWeight:500, fontFamily:"inherit" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          Back
        </button>
        <span style={{ color:"#E2E8F0" }}>|</span>
        <span style={{ fontFamily:"'Playfair Display', serif", fontWeight:800, fontSize:17, color:"#0F172A" }}>EduPortal</span>
      </nav>

      {/* FORM */}
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:"40px 24px" }}>
        <div style={{ width:"100%", maxWidth:420, animation:"fadeUp .4s ease" }}>

          {/* Role Badge */}
          <div style={{ display:"flex", alignItems:"center", gap:12, background:cfg.bg, border:`1.5px solid ${cfg.border}`, borderRadius:16, padding:"14px 18px", marginBottom:28 }}>
            <div style={{ width:44, height:44, background:"#fff", borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", color:cfg.color, border:`1.5px solid ${cfg.border}` }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
              </svg>
            </div>
            <div>
              <div style={{ fontWeight:800, fontSize:15, color:cfg.color }}>{cfg.label} Login</div>
              <div style={{ fontSize:12, color:"#64748B" }}>Sign in to your {cfg.label.toLowerCase()} account</div>
            </div>
          </div>

          <h2 style={{ fontFamily:"'Playfair Display', serif", fontWeight:800, fontSize:26, color:"#0F172A", marginBottom:24 }}>Welcome Back</h2>

          {/* API Error */}
          {apiError && (
            <div style={{ background:"#FEF2F2", border:"1.5px solid #FECACA", borderRadius:10, padding:"11px 14px", color:"#DC2626", fontSize:13, fontWeight:500, marginBottom:18 }}>
              ⚠️ {apiError}
            </div>
          )}

          {/* Email */}
          <div className="input-wrap" style={{ marginBottom:14, "--focus-c":cfg.color }}>
            <label>Email Address</label>
            <input type="email" className={errors.email ? "err" : ""} placeholder="your@school.edu"
              value={email} onChange={e => setEmail(e.target.value)} onKeyDown={handleKey} />
            {errors.email && <div className="err-msg">{errors.email}</div>}
          </div>

          {/* Password */}
          <div className="input-wrap" style={{ marginBottom:8, "--focus-c":cfg.color }}>
            <label>Password</label>
            <input type="password" className={errors.password ? "err" : ""} placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)} onKeyDown={handleKey} />
            {errors.password && <div className="err-msg">{errors.password}</div>}
          </div>

          <div style={{ textAlign:"right", marginBottom:22 }}>
            <span style={{ fontSize:13, color:cfg.color, fontWeight:500, cursor:"pointer" }}>Forgot password?</span>
          </div>

          {/* Submit */}
          <button onClick={handleSubmit} disabled={loading}
            style={{ width:"100%", padding:"13px", background:cfg.color, color:"#fff", border:"none", borderRadius:11, fontSize:15, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8, fontFamily:"inherit", opacity:loading?0.85:1 }}>
            {loading ? <span className="spinner" /> : `Sign In as ${cfg.label}`}
          </button>

          {/* Access Features */}
          <div style={{ marginTop:24, background:"#F8FAFC", borderRadius:12, padding:"14px 16px" }}>
            <p style={{ fontSize:11, fontWeight:700, color:"#94A3B8", textTransform:"uppercase", letterSpacing:0.6, marginBottom:10 }}>Your Access Includes</p>
            {cfg.features.map(f => (
              <div key={f} style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, color:"#374151", marginBottom:6 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={cfg.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7"/></svg>
                {f}
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
