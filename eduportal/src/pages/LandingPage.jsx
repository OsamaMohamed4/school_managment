import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect } from "react";

const roles = [
  {
    id: "admin", label: "Admin", color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE",
    desc: "Manage users, grades & system settings",
    features: ["User Management", "Grade & Class Setup", "Attendance Reports", "System Overview"],
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    id: "teacher", label: "Teacher", color: "#059669", bg: "#ECFDF5", border: "#A7F3D0",
    desc: "Mark attendance & manage quizzes",
    features: ["Mark Attendance", "Create Quizzes", "View Results", "Class Reports"],
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2"/>
        <path d="M8 21h8M12 17v4M7 8h10M7 11h6"/>
      </svg>
    ),
  },
  {
    id: "student", label: "Student", color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE",
    desc: "Take quizzes & track your progress",
    features: ["Take Quizzes", "View Grades", "Attendance History", "My Schedule"],
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
        <path d="M6 12v5c3 3 9 3 12 0v-5"/>
      </svg>
    ),
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { isLoggedIn, role } = useAuth();

  // إذا مسجل دخول بالفعل، روحه للـ dashboard
  useEffect(() => {
    if (isLoggedIn) navigate(`/${role}/dashboard`, { replace: true });
  }, [isLoggedIn, role, navigate]);

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", minHeight: "100vh", background: "#F8FAFC" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: fadeUp .6s ease forwards; }
        .role-card { background:#fff; border:2px solid #E2E8F0; border-radius:20px; padding:28px; cursor:pointer; transition:all .25s; }
        .role-card:hover { transform:translateY(-4px); box-shadow:0 16px 40px rgba(0,0,0,.09); }
        .feature-tag { display:inline-flex; align-items:center; gap:5px; background:#F1F5F9; color:#475569; border-radius:999px; padding:4px 11px; font-size:12px; font-weight:500; margin:3px; }
        .login-btn { width:100%; padding:12px; border:none; border-radius:10px; font-size:14px; font-weight:700; cursor:pointer; margin-top:20px; transition:all .2s; font-family:inherit; }
      `}</style>

      {/* NAV */}
      <nav style={{ background:"#fff", borderBottom:"1.5px solid #E2E8F0", padding:"0 40px", height:64, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:38, height:38, background:"#2563EB", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
            </svg>
          </div>
          <span style={{ fontFamily:"'Playfair Display', serif", fontWeight:800, fontSize:19, color:"#0F172A" }}>EduPortal</span>
        </div>
        <span style={{ fontSize:13, color:"#64748B", background:"#F1F5F9", padding:"6px 14px", borderRadius:999, fontWeight:500 }}>
          School Management Platform
        </span>
      </nav>

      {/* HERO */}
      <section style={{ maxWidth:1100, margin:"0 auto", padding:"70px 32px 50px", textAlign:"center" }}>
        <div className="fade-up" style={{ animationDelay:"0s" }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:"#EFF6FF", color:"#2563EB", border:"1px solid #BFDBFE", borderRadius:999, padding:"5px 16px", fontSize:13, fontWeight:600, marginBottom:24 }}>
            <span style={{ width:7, height:7, background:"#2563EB", borderRadius:"50%", display:"inline-block" }} />
            Phase 1 — Role-Based Access
          </div>
          <h1 style={{ fontFamily:"'Playfair Display', serif", fontSize:"clamp(36px,5.5vw,64px)", fontWeight:800, lineHeight:1.1, color:"#0F172A", marginBottom:18 }}>
            One Platform.<br /><span style={{ color:"#2563EB" }}>Three Roles.</span>
          </h1>
          <p style={{ fontSize:17, color:"#475569", lineHeight:1.7, maxWidth:500, margin:"0 auto 48px" }}>
            Manage your school digitally — attendance, quizzes, and academic progress all in one place.
          </p>
        </div>

        {/* Stats Row */}
        <div className="fade-up" style={{ animationDelay:".1s", display:"flex", justifyContent:"center", gap:32, marginBottom:60, flexWrap:"wrap" }}>
          {[["1,200+","Students"],["80+","Teachers"],["32","Classes"],["94%","Avg Attendance"]].map(([v,l]) => (
            <div key={l} style={{ textAlign:"center" }}>
              <div style={{ fontFamily:"'Playfair Display', serif", fontSize:28, fontWeight:800, color:"#0F172A" }}>{v}</div>
              <div style={{ fontSize:13, color:"#94A3B8" }}>{l}</div>
            </div>
          ))}
        </div>

        {/* Role Cards */}
        <div className="fade-up" style={{ animationDelay:".2s", display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))", gap:20, textAlign:"left" }}>
          {roles.map(r => (
            <div key={r.id} className="role-card" onClick={() => navigate(`/login/${r.id}`)}>
              <div style={{ width:54, height:54, background:r.bg, border:`1.5px solid ${r.border}`, borderRadius:14, display:"flex", alignItems:"center", justifyContent:"center", color:r.color, marginBottom:16 }}>
                {r.icon}
              </div>
              <h3 style={{ fontSize:19, fontWeight:800, marginBottom:6, color:"#0F172A" }}>{r.label}</h3>
              <p style={{ fontSize:14, color:"#64748B", marginBottom:16, lineHeight:1.6 }}>{r.desc}</p>
              <div style={{ marginBottom:4 }}>
                {r.features.map(f => (
                  <span key={f} className="feature-tag">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={r.color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7"/></svg>
                    {f}
                  </span>
                ))}
              </div>
              <button className="login-btn" style={{ background:r.bg, color:r.color, border:`1.5px solid ${r.border}` }}>
                Login as {r.label} →
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
