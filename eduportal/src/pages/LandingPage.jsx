import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const ROLES = [
  { id:"admin",   label:"Admin",   icon:"🏫", accent:"#3B82F6", glow:"rgba(59,130,246,.35)",  desc:"Manage users, classes & grades" },
  { id:"teacher", label:"Teacher", icon:"📚", accent:"#10B981", glow:"rgba(16,185,129,.35)",  desc:"Attendance, quizzes & notifications" },
  { id:"student", label:"Student", icon:"🎓", accent:"#8B5CF6", glow:"rgba(139,92,246,.35)",  desc:"Take quizzes & track progress" },
  { id:"parent",  label:"Parent",  icon:"👨‍👩‍👦",accent:"#F59E0B", glow:"rgba(245,158,11,.35)",  desc:"Monitor your child's performance" },
];

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Playfair+Display:wght@700;800&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  body,html,#root{background:#0A0F1E!important;min-height:100vh;}

  .lp-wrap{min-height:100vh;background:#0A0F1E;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 20px;position:relative;overflow:hidden;font-family:'Sora',sans-serif;}

  /* animated orbs */
  .orb{position:absolute;border-radius:50%;filter:blur(80px);opacity:.18;animation:orbFloat 8s ease-in-out infinite;}
  .orb1{width:500px;height:500px;background:radial-gradient(circle,#3B82F6,transparent);top:-100px;left:-100px;animation-delay:0s;}
  .orb2{width:400px;height:400px;background:radial-gradient(circle,#8B5CF6,transparent);bottom:-80px;right:-60px;animation-delay:3s;}
  .orb3{width:300px;height:300px;background:radial-gradient(circle,#10B981,transparent);top:40%;left:60%;animation-delay:6s;}
  @keyframes orbFloat{0%,100%{transform:translateY(0) scale(1);}50%{transform:translateY(-30px) scale(1.05);}}

  /* grid overlay */
  .lp-wrap::before{content:'';position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px);background-size:48px 48px;pointer-events:none;}

  .lp-logo{width:64px;height:64px;background:linear-gradient(135deg,#2563EB,#7C3AED);border-radius:18px;display:flex;align-items:center;justify-content:center;font-size:28px;margin:0 auto 20px;animation:logoPop .6s cubic-bezier(.34,1.56,.64,1) both;box-shadow:0 0 40px rgba(59,130,246,.5);}
  @keyframes logoPop{from{opacity:0;transform:scale(.4) rotate(-15deg);}to{opacity:1;transform:scale(1) rotate(0);}}

  .lp-title{font-family:'Playfair Display',serif;font-size:clamp(32px,6vw,52px);font-weight:800;color:#F1F5F9;text-align:center;line-height:1.15;animation:titleReveal .7s ease .2s both;}
  .lp-sub{font-size:15px;color:#64748B;text-align:center;margin-top:10px;animation:titleReveal .7s ease .35s both;}
  @keyframes titleReveal{from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:translateY(0);}}

  .lp-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px;max-width:560px;width:100%;margin-top:40px;position:relative;z-index:1;}

  .role-card{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:20px;padding:28px 20px;cursor:pointer;text-align:center;font-family:'Sora',sans-serif;transition:all .25s cubic-bezier(.4,0,.2,1);animation:cardReveal .6s ease both;position:relative;overflow:hidden;}
  .role-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;border-radius:20px 20px 0 0;opacity:0;transition:opacity .25s;}
  .role-card:hover{transform:translateY(-8px) scale(1.02);border-color:rgba(255,255,255,.18);background:rgba(255,255,255,.07);}
  .role-card:hover::before{opacity:1;}
  .role-card:active{transform:translateY(-4px) scale(1.01);}
  @keyframes cardReveal{from{opacity:0;transform:translateY(30px);}to{opacity:1;transform:translateY(0);}}

  .role-icon{font-size:38px;margin-bottom:12px;display:block;transition:transform .25s;}
  .role-card:hover .role-icon{transform:scale(1.15) translateY(-3px);}
  .role-label{font-size:17px;font-weight:800;margin-bottom:7px;}
  .role-desc{font-size:12px;color:#64748B;line-height:1.5;}
  @media(max-width:480px){.lp-grid{grid-template-columns:1fr 1fr;gap:10px;}.role-card{padding:20px 14px;}}
`;

export default function LandingPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  useEffect(()=>{ setTimeout(()=>setReady(true),50); },[]);

  return (
    <div className="lp-wrap">
      <style>{CSS}</style>
      <div className="orb orb1"/><div className="orb orb2"/><div className="orb orb3"/>
      {ready && <>
        <div className="lp-logo">🏫</div>
        <h1 className="lp-title">EduPortal</h1>
        <p className="lp-sub">School Management Platform — Select your role to continue</p>
        <div className="lp-grid">
          {ROLES.map((r,i)=>(
            <button key={r.id} className="role-card" style={{"--delay":`${i*0.12+0.4}s`,animationDelay:`${i*0.12+0.4}s`,"--accent":r.accent}} onClick={()=>navigate(`/login/${r.id}`)}>
              <style>{`.role-card:nth-child(${i+1}){border-top-color:${r.accent}!important;}.role-card:nth-child(${i+1})::before{background:${r.accent};}.role-card:nth-child(${i+1}):hover{box-shadow:0 20px 60px ${r.glow};}`}</style>
              <span className="role-icon">{r.icon}</span>
              <div className="role-label" style={{color:r.accent}}>{r.label}</div>
              <div className="role-desc">{r.desc}</div>
            </button>
          ))}
        </div>
      </>}
    </div>
  );
}
