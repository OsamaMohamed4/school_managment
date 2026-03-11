import { useNavigate } from "react-router-dom";

const ROLES = [
  { id:"admin",   label:"Admin",   icon:"🏫", color:"#2563EB", bg:"#EFF6FF", border:"#BFDBFE", desc:"Manage users, classes & grades" },
  { id:"teacher", label:"Teacher", icon:"📚", color:"#059669", bg:"#ECFDF5", border:"#A7F3D0", desc:"Attendance, quizzes & notifications" },
  { id:"student", label:"Student", icon:"🎓", color:"#7C3AED", bg:"#F5F3FF", border:"#DDD6FE", desc:"Take quizzes & track progress" },
  { id:"parent",  label:"Parent",  icon:"👨‍👩‍👦", color:"#D97706", bg:"#FFFBEB", border:"#FDE68A", desc:"Monitor your child's performance" },
];

export default function LandingPage() {
  const navigate = useNavigate();
  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#F8FAFC 0%,#EFF6FF 100%)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',sans-serif",padding:"40px 20px"}}>
      <div style={{textAlign:"center",marginBottom:48}}>
        <div style={{width:56,height:56,background:"#2563EB",borderRadius:16,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",fontSize:24}}>🏫</div>
        <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:36,fontWeight:800,color:"#0F172A",margin:0}}>EduPortal</h1>
        <p style={{fontSize:15,color:"#64748B",marginTop:8}}>School Management Platform — Select your role to continue</p>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:16,maxWidth:600,width:"100%"}}>
        {ROLES.map(r=>(
          <button key={r.id} onClick={()=>navigate(`/login/${r.id}`)}
            style={{background:r.bg,border:`2px solid ${r.border}`,borderRadius:16,padding:"28px 20px",cursor:"pointer",textAlign:"center",transition:"all .2s",fontFamily:"inherit"}}>
            <div style={{fontSize:36,marginBottom:10}}>{r.icon}</div>
            <div style={{fontSize:16,fontWeight:800,color:r.color,marginBottom:6}}>{r.label}</div>
            <div style={{fontSize:12,color:"#64748B"}}>{r.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
