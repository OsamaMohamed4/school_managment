import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const ROLES = [
  { id: "admin", label: "Admin", abbr: "AD", accent: "text-blue-500", border: "hover:border-blue-500", desc: "Manage users, classes & grades" },
  { id: "teacher", label: "Teacher", abbr: "TE", accent: "text-emerald-500", border: "hover:border-emerald-500", desc: "Attendance, quizzes & notifications" },
  { id: "student", label: "Student", abbr: "ST", accent: "text-purple-500", border: "hover:border-purple-500", desc: "Take quizzes & track progress" },
  { id: "parent", label: "Parent", abbr: "PA", accent: "text-amber-500", border: "hover:border-amber-500", desc: "Monitor performance" },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  useEffect(() => { setTimeout(() => setReady(true), 50); }, []);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sora">
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[80px] translate-x-1/4 translate-y-1/4 pointer-events-none" />
      
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />

      <div className={`relative z-10 w-full max-w-2xl flex flex-col items-center transition-all duration-700 ease-out ${ready ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl mb-6 shadow-lg shadow-blue-500/20">
          EP
        </div>
        
        <h1 className="font-serif text-4xl md:text-5xl font-extrabold text-slate-100 text-center leading-tight mb-3">
          EduPortal
        </h1>
        <p className="text-slate-400 text-center mb-10 text-sm md:text-base">
          School Management Platform — Select your role to continue
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-[560px]">
          {ROLES.map((r) => (
            <button
              key={r.id}
              onClick={() => navigate(`/login/${r.id}`)}
              className={`bg-white/5 border border-white/10 rounded-2xl p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:bg-white/10 ${r.border} group`}
            >
              <div className={`w-12 h-12 mx-auto rounded-xl bg-white/5 flex items-center justify-center text-lg font-bold mb-4 transition-transform duration-300 group-hover:scale-110 ${r.accent}`}>
                {r.abbr}
              </div>
              <div className={`text-lg font-bold mb-2 ${r.accent}`}>{r.label}</div>
              <div className="text-xs text-slate-400 leading-relaxed">{r.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
