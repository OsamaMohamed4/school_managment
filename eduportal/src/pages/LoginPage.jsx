import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ROLES = {
  admin:   { label:"Admin",   icon:"🏫", accent:"#3B82F6", light:"#60A5FA", bg:"linear-gradient(135deg,#0D1F3C 0%,#1E3A5F 100%)" },
  teacher: { label:"Teacher", icon:"📚", accent:"#10B981", light:"#34D399", bg:"linear-gradient(135deg,#042F1E 0%,#064E3B 100%)" },
  student: { label:"Student", icon:"🎓", accent:"#8B5CF6", light:"#A78BFA", bg:"linear-gradient(135deg,#1E0A3C 0%,#2D1B69 100%)" },
  parent:  { label:"Parent",  icon:"👨‍👩‍👦",accent:"#F59E0B", light:"#FBBF24", bg:"linear-gradient(135deg,#2D1B00 0%,#451A03 100%)" },
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Playfair+Display:wght@700;800&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  body,html,#root{background:#0A0F1E!important;min-height:100vh;}

  .lp-root{min-height:100vh;background:#0A0F1E;display:flex;align-items:stretch;font-family:'Sora',sans-serif;}

  .lp-left{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 40px;position:relative;overflow:hidden;}
  .lp-left-inner{position:relative;z-index:2;text-align:center;animation:slideL .6s ease both;}
  @keyframes slideL{from{opacity:0;transform:translateX(-30px);}to{opacity:1;transform:translateX(0);}}

  .role-icon-big{width:90px;height:90px;border-radius:24px;display:flex;align-items:center;justify-content:center;font-size:44px;margin:0 auto 24px;box-shadow:0 20px 60px rgba(0,0,0,.5);}
  .welcome-title{font-family:'Playfair Display',serif;font-size:clamp(28px,4vw,40px);font-weight:800;color:#F1F5F9;line-height:1.2;margin-bottom:12px;}
  .welcome-sub{font-size:14px;color:#64748B;line-height:1.6;max-width:280px;margin:0 auto;}

  /* slide indicators */
  .dots{display:flex;gap:8px;justify-content:center;margin-top:32px;}
  .dot{width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,.15);transition:all .3s;}
  .dot.a{width:24px;border-radius:4px;}

  .lp-right{width:420px;background:#111827;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:48px 40px;border-left:1px solid rgba(255,255,255,.07);}
  .login-card{width:100%;animation:slideR .6s ease .1s both;}
  @keyframes slideR{from{opacity:0;transform:translateX(30px);}to{opacity:1;transform:translateX(0);}}

  .card-bar{height:3px;border-radius:999px;margin-bottom:28px;}
  .card-title{font-family:'Playfair Display',serif;font-size:26px;font-weight:800;color:#F1F5F9;margin-bottom:6px;}
  .card-sub{font-size:13px;color:#64748B;margin-bottom:28px;}

  .lbl{display:block;font-size:11px;font-weight:700;color:#475569;margin-bottom:6px;text-transform:uppercase;letter-spacing:.6px;}
  .inp{width:100%;padding:12px 14px;background:#0D1526;border:1.5px solid rgba(255,255,255,.1);border-radius:11px;font-size:14px;color:#E2E8F0;outline:none;font-family:'Sora',sans-serif;transition:border-color .2s,box-shadow .2s;}
  .inp::placeholder{color:#334155;}
  .field{margin-bottom:16px;}

  .submit-btn{width:100%;padding:13px;border:none;border-radius:12px;font-size:14px;font-weight:800;cursor:pointer;font-family:'Sora',sans-serif;margin-top:4px;transition:all .2s;letter-spacing:.3px;}
  .submit-btn:hover:not(:disabled){transform:translateY(-2px);filter:brightness(1.1);}
  .submit-btn:disabled{opacity:.6;cursor:not-allowed;}

  .back-btn{width:100%;padding:11px;border:1px solid rgba(255,255,255,.1);border-radius:12px;font-size:13px;font-weight:600;cursor:pointer;font-family:'Sora',sans-serif;background:rgba(255,255,255,.04);color:#64748B;margin-top:10px;transition:all .2s;}
  .back-btn:hover{background:rgba(255,255,255,.08);color:#94A3B8;}

  .err-box{background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.25);border-radius:10px;padding:11px 14px;font-size:13px;color:#F87171;margin-bottom:16px;animation:shake .4s ease;}
  @keyframes shake{0%,100%{transform:translateX(0);}20%,60%{transform:translateX(-6px);}40%,80%{transform:translateX(6px);}}

  @media(max-width:700px){.lp-root{flex-direction:column;}.lp-left{min-height:260px;padding:40px 24px;}.lp-right{width:100%;padding:32px 24px;}}
`;

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

  const focusStyle = { borderColor: R.accent, boxShadow: `0 0 0 3px ${R.accent}22` };

  const submit = async e => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      await login(email, password, role);
      navigate(`/${role}`);
    } catch(err) {
      setError(err?.detail || err?.non_field_errors?.[0] || "Invalid email or password");
    } finally { setLoading(false); }
  };

  return (
    <div className="lp-root">
      <style>{CSS}</style>

      {/* LEFT PANEL */}
      <div className="lp-left" style={{background:R.bg}}>
        {/* grid overlay */}
        <div style={{position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(255,255,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px)",backgroundSize:"40px 40px"}}/>
        <div className="lp-left-inner">
          <div className="role-icon-big" style={{background:`${R.accent}20`,border:`2px solid ${R.accent}40`}}>{R.icon}</div>
          <h2 className="welcome-title">Welcome back,<br/>{R.label}</h2>
          <p className="welcome-sub">Sign in to your EduPortal account to access your {role} dashboard.</p>
          <div className="dots">
            {["admin","teacher","student","parent"].map(r=>(
              <div key={r} className={`dot${r===role?" a":""}`} style={r===role?{background:R.accent}:{}}/>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="lp-right">
        <div className="login-card">
          <div className="card-bar" style={{background:`linear-gradient(90deg,${R.accent},${R.light})`}}/>
          <h2 className="card-title">{R.label} Sign In</h2>
          <p className="card-sub">Enter your credentials to continue</p>

          {error && <div className="err-box">⚠️ {error}</div>}

          <form onSubmit={submit}>
            <div className="field">
              <label className="lbl">Email Address</label>
              <input className="inp" type="email" placeholder="your@email.com" value={email}
                onChange={e=>setEmail(e.target.value)} onFocus={()=>setFocused("email")} onBlur={()=>setFocused("")}
                style={focused==="email"?focusStyle:{}} autoComplete="email"/>
            </div>
            <div className="field">
              <label className="lbl">Password</label>
              <input className="inp" type="password" placeholder="••••••••" value={password}
                onChange={e=>setPassword(e.target.value)} onFocus={()=>setFocused("pass")} onBlur={()=>setFocused("")}
                style={focused==="pass"?focusStyle:{}} autoComplete="current-password"/>
            </div>
            <button className="submit-btn" type="submit" disabled={loading}
              style={{background:`linear-gradient(135deg,${R.accent},${R.light})`,color:"#fff",boxShadow:`0 8px 24px ${R.accent}44`}}>
              {loading ? "Signing in..." : `Sign in as ${R.label} →`}
            </button>
          </form>
          <button className="back-btn" onClick={()=>navigate("/")}>← Back to role selection</button>
        </div>
      </div>
    </div>
  );
}
