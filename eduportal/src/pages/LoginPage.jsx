import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authAPI } from "../api";

const ROLE_CONFIG = {
  admin:   { label:"Admin",   icon:"🏫", color:"#2563EB", bg:"#EFF6FF", border:"#BFDBFE", dark:"#1D4ED8" },
  teacher: { label:"Teacher", icon:"📚", color:"#059669", bg:"#ECFDF5", border:"#A7F3D0", dark:"#047857" },
  student: { label:"Student", icon:"🎓", color:"#7C3AED", bg:"#F5F3FF", border:"#DDD6FE", dark:"#6D28D9" },
  parent:  { label:"Parent",  icon:"👨‍👩‍👦", color:"#D97706", bg:"#FFFBEB", border:"#FDE68A", dark:"#B45309" },
};

const DASHBOARD = {
  admin:   "/admin/dashboard",
  teacher: "/teacher/dashboard",
  student: "/student/dashboard",
  parent:  "/parent/dashboard",
};

export default function LoginPage() {
  const { role }            = useParams();
  const navigate             = useNavigate();
  const { login }            = useAuth();
  const [email,    setEmail] = useState("");
  const [password, setPass]  = useState("");
  const [error,    setError] = useState("");
  const [loading,  setLoading] = useState(false);

  const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.student;

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError("Please enter email and password."); return; }
    setLoading(true); setError("");
    try {
      const data = await authAPI.login(email, password);
      login(data.user);
      navigate(DASHBOARD[data.user.role] || "/");
    } catch (err) {
      setError(err?.error || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{minHeight:"100vh",background:`linear-gradient(135deg,${cfg.bg} 0%,#F8FAFC 100%)`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',sans-serif",padding:"20px"}}>
      <div style={{background:"#fff",borderRadius:20,padding:"36px 32px",width:"100%",maxWidth:400,border:`2px solid ${cfg.border}`,boxShadow:`0 20px 60px ${cfg.color}18`}}>

        {/* Header */}
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{width:56,height:56,borderRadius:16,background:cfg.bg,border:`2px solid ${cfg.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,margin:"0 auto 14px"}}>
            {cfg.icon}
          </div>
          <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:24,fontWeight:800,color:"#0F172A",margin:0}}>
            {cfg.label} Login
          </h1>
          <p style={{fontSize:13,color:"#64748B",marginTop:6}}>Sign in to your EduPortal account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin}>
          <div style={{marginBottom:14}}>
            <label style={{display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:5}}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e=>{setEmail(e.target.value);setError("");}}
              placeholder="your@email.com"
              style={{width:"100%",padding:"11px 14px",border:`1.5px solid ${error?"#EF4444":"#E2E8F0"}`,borderRadius:10,fontSize:14,color:"#0F172A",outline:"none",fontFamily:"inherit",background:"#F8FAFC",boxSizing:"border-box",transition:"border .2s"}}
              onFocus={e=>e.target.style.borderColor=cfg.color}
              onBlur={e=>e.target.style.borderColor=error?"#EF4444":"#E2E8F0"}
            />
          </div>

          <div style={{marginBottom:20}}>
            <label style={{display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:5}}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e=>{setPass(e.target.value);setError("");}}
              placeholder="••••••••"
              style={{width:"100%",padding:"11px 14px",border:`1.5px solid ${error?"#EF4444":"#E2E8F0"}`,borderRadius:10,fontSize:14,color:"#0F172A",outline:"none",fontFamily:"inherit",background:"#F8FAFC",boxSizing:"border-box",transition:"border .2s"}}
              onFocus={e=>e.target.style.borderColor=cfg.color}
              onBlur={e=>e.target.style.borderColor=error?"#EF4444":"#E2E8F0"}
            />
          </div>

          {error && (
            <div style={{background:"#FEF2F2",border:"1.5px solid #FECACA",borderRadius:9,padding:"10px 14px",marginBottom:16,fontSize:13,color:"#EF4444",fontWeight:500}}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{width:"100%",padding:"13px",background:loading?"#94A3B8":cfg.color,color:"#fff",border:"none",borderRadius:11,fontSize:15,fontWeight:700,cursor:loading?"not-allowed":"pointer",fontFamily:"inherit",transition:"all .2s",letterSpacing:.3}}
          >
            {loading ? "Signing in..." : `Sign in as ${cfg.label}`}
          </button>
        </form>

        {/* Back button */}
        <button
          onClick={()=>navigate("/")}
          style={{display:"block",width:"100%",marginTop:14,padding:"10px",background:"transparent",border:`1.5px solid ${cfg.border}`,borderRadius:10,fontSize:13,fontWeight:600,color:cfg.color,cursor:"pointer",fontFamily:"inherit",transition:"all .2s"}}
        >
          ← Back to role selection
        </button>

      </div>
    </div>
  );
}
