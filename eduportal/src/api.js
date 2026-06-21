const BASE = (process.env.REACT_APP_API_URL || "http://localhost:8000").replace(/\/$/, "");
const API  = BASE + "/api";

export const getToken  = () => localStorage.getItem("token") || localStorage.getItem("access_token");
export const getUser   = () => { try { const u = localStorage.getItem("user"); return u ? JSON.parse(u) : null; } catch { return null; } };
export const clearAuth = () => ["token","access_token","refresh_token","role","user"].forEach(k => localStorage.removeItem(k));

let _refreshing = false;

const request = async (path, opts = {}, _retry = false) => {
  const token   = getToken();
  const headers = { "Content-Type":"application/json", ...(token?{Authorization:"Bearer "+token}:{}), ...(opts.headers||{}) };
  const res     = await fetch(API + path, { ...opts, headers });

  if (res.status === 401 && !_retry) {
    if (_refreshing) { clearAuth(); window.location.href="/"; return; }
    const refresh = localStorage.getItem("refresh_token");
    if (refresh) {
      _refreshing = true;
      try {
        const r = await fetch(API+"/auth/refresh/",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({refresh})});
        if (r.ok) {
          const newTokens = await r.json();
          localStorage.setItem("access_token", newTokens.access);
          localStorage.setItem("token", newTokens.access);
          _refreshing = false;
          return request(path, opts, true); // retry ONCE
        }
      } catch {}
      _refreshing = false;
    }
    clearAuth(); window.location.href="/"; return;
  }

  if (res.status === 401 && _retry) {
    clearAuth(); window.location.href="/"; return;
  }

  if (res.status===204) return null;
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
};

export const authAPI = {
  login: async (email,password) => {
    const data = await request("/auth/login/",{method:"POST",body:JSON.stringify({email,password})});
    localStorage.setItem("access_token", data.access);
    localStorage.setItem("token", data.access); // Support 'token' as requested
    localStorage.setItem("refresh_token",data.refresh);
    localStorage.setItem("role",         data.user.role);
    localStorage.setItem("user",         JSON.stringify(data.user));
    return data;
  },
  me:             ()           => request("/auth/me/"),
  updateProfile:  (d)          => request("/auth/profile/",        {method:"PATCH",body:JSON.stringify(d)}),
  changePassword: (old_p,new_p)=> request("/auth/change-password/",{method:"POST", body:JSON.stringify({old_password:old_p,new_password:new_p})}),
};

export const usersAPI = {
  list:         (p={}) => request("/auth/users/?"+new URLSearchParams(p)),
  create:       (d)    => request("/auth/users/",                      {method:"POST",  body:JSON.stringify(d)}),
  toggleStatus: (id)   => request("/auth/users/"+id+"/toggle-status/", {method:"PATCH"}),
  delete:       (id)   => request("/auth/users/"+id+"/",               {method:"DELETE"}),
  stats:        ()     => request("/auth/stats/"),
};

export const academicsAPI = {
  grades:  { list:()=>request("/grades/"), create:(d)=>request("/grades/",{method:"POST",body:JSON.stringify(d)}), delete:(id)=>request("/grades/"+id+"/",{method:"DELETE"}) },
  classes: {
    list:()=>request("/classes/"), create:(d)=>request("/classes/",{method:"POST",body:JSON.stringify(d)}),
    update:(id,d)=>request("/classes/"+id+"/",{method:"PATCH",body:JSON.stringify(d)}), delete:(id)=>request("/classes/"+id+"/",{method:"DELETE"}),
    myClasses:()=>request("/classes/my/"), myClass:()=>request("/classes/mine/"),
    students:(id)=>request("/classes/"+id+"/students/"),
    assignStudent:(id,sid)=>request("/classes/"+id+"/assign-student/",{method:"POST",body:JSON.stringify({student_id:sid})}),
    removeStudent:(id,sid)=>request("/classes/"+id+"/remove-student/",{method:"POST",body:JSON.stringify({student_id:sid})}),
    assignTeacher:(id,tid)=>request("/classes/"+id+"/assign-teacher/",{method:"POST",body:JSON.stringify({teacher_id:tid})}),
    addSubjectTeacher:(id,tid,subject)=>request("/classes/"+id+"/add-subject-teacher/",{method:"POST",body:JSON.stringify({teacher_id:tid,subject})}),
    removeSubjectTeacher:(id,stId)=>request("/classes/"+id+"/remove-subject-teacher/",{method:"DELETE",body:JSON.stringify({id:stId})}),
  },
  teachers:()=>request("/teachers/list/"),
  unassignedStudents:()=>request("/students/unassigned/"),
};

export const attendanceAPI = {
  submitBulk:(cid,date,records)=>request("/attendance/bulk/",{method:"POST",body:JSON.stringify({class_room:cid,date,records})}),
  myHistory:()=>request("/attendance/my/"),
  byClass:(cid,date)=>request("/attendance/class/"+cid+"/?date="+date),
  report:(cid)=>request("/attendance/report/"+cid+"/"),
};

export const quizzesAPI = {
  list:()=>request("/quizzes/"), create:(d)=>request("/quizzes/",{method:"POST",body:JSON.stringify(d)}),
  update:(id,d)=>request("/quizzes/"+id+"/",{method:"PATCH",body:JSON.stringify(d)}),
  delete:(id)=>request("/quizzes/"+id+"/",{method:"DELETE"}),
  toggle:(id)=>request("/quizzes/"+id+"/toggle/",{method:"PATCH"}),
  addQuestion:(id,d,image)=>{
    if(image){
      const fd=new FormData();
      Object.entries(d).forEach(([k,v])=>{
        if(Array.isArray(v)) fd.append(k,JSON.stringify(v));
        else if(v!=null) fd.append(k,v);
      });
      fd.append("image",image);
      const token=getToken();
      const base=(process.env.REACT_APP_API_URL||"http://localhost:8000").replace(/\/$/,"");
      return fetch(base+"/api/quizzes/"+id+"/add-question/",{
        method:"POST",headers:token?{Authorization:"Bearer "+token}:{},body:fd
      }).then(async r=>{const data=await r.json();if(!r.ok)throw data;return data;});
    }
    return request("/quizzes/"+id+"/add-question/",{method:"POST",body:JSON.stringify(d)});
  },
  deleteQuestion:(id,qid)=>request("/quizzes/"+id+"/delete-question/"+qid+"/",{method:"DELETE"}),
  results:(id)=>request("/quizzes/"+id+"/results/"),
  available:()=>request("/quizzes/available/"),
  take:(id)=>request("/quizzes/"+id+"/take/"),
  submit:(id,answers)=>request("/quizzes/"+id+"/take/",{method:"POST",body:JSON.stringify({answers})}),
  myResults:()=>request("/quizzes/my-results/"),
};

export const notificationsAPI = {
  list:()=>request("/notifications/"),
  send: (d) => {
    if (d instanceof FormData) {
      const token = getToken();
      return fetch((process.env.REACT_APP_API_URL||"http://localhost:8000")+"/api/notifications/send/", {
        method: "POST",
        headers: token ? { Authorization: "Bearer "+token } : {},
        body: d,
      }).then(async r => {
        const data = await r.json();
        if (!r.ok) throw data;
        return data;
      });
    }
    return request("/notifications/send/",{method:"POST",body:JSON.stringify(d)});
  },
  markRead:(id)=>request("/notifications/mark-read/",{method:"POST",body:JSON.stringify(id?{id}:{})}),
  markAllRead:()=>request("/notifications/mark-read/",{method:"POST",body:JSON.stringify({})}),
};

export const gradeBookAPI = {
  list:(params={})=>request("/gradebook/?"+new URLSearchParams(params)),
};

export const parentAPI = {
  children:()=>request("/auth/parent/children/"),
  childDetail:(id)=>request("/auth/parent/child/"+id+"/"),
  linkChild:(parent_id,child_id)=>request("/auth/parent/link-child/",{method:"POST",body:JSON.stringify({parent_id,child_id})}),
  unlinkChild:(parent_id,child_id)=>request("/auth/parent/link-child/",{method:"DELETE",body:JSON.stringify({parent_id,child_id})}),
  // Admin: get children of a specific parent
  adminParentChildren:(parent_id)=>request("/auth/admin/parent/"+parent_id+"/children/"),
};

export const timetableAPI = {
  get:            (classId)   => request(`/timetable/${classId}/`),
  my:             ()          => request("/timetable/my/"),
  myTeacher:      ()          => request("/timetable/teacher/"),
  classTeachers:  (classId)   => request(`/timetable/${classId}/teachers/`),
  addSlot:        (classId,d) => request(`/timetable/${classId}/`,{method:"POST",body:JSON.stringify(d)}),
  deleteSlot:     (slotId)    => request(`/timetable/slot/${slotId}/`,{method:"DELETE"}),
};

export const assignmentsAPI = {
  list:         ()            => request("/assignments/"),
  create:       (d)           => request("/assignments/",{method:"POST",body:JSON.stringify(d)}),
  delete:       (id)          => request("/assignments/"+id+"/",{method:"DELETE"}),
  submit: (id, text, file) => {
    if (file) {
      // File upload — use FormData (multipart)
      const fd = new FormData();
      if (text) fd.append("text", text);
      fd.append("file", file);
      const token = getToken();
      return fetch((process.env.REACT_APP_API_URL||"http://localhost:8000")+"/api/assignments/"+id+"/submit/", {
        method: "POST",
        headers: token ? { Authorization: "Bearer "+token } : {},
        body: fd,
      }).then(r => r.json());
    }
    return request("/assignments/"+id+"/submit/", {method:"POST", body:JSON.stringify({text})});
  },
  submissions:  (id)          => request("/assignments/"+id+"/submissions/"),
  grade:        (subId,score,feedback) => request("/assignments/submissions/"+subId+"/grade/",{method:"PATCH",body:JSON.stringify({score,feedback})}),
  mySubmissions:()            => request("/assignments/my-submissions/"),
};

export const messagingAPI = {
  conversations:  ()        => request("/messages/"),
  start:          (userId)  => request("/messages/",{method:"POST",body:JSON.stringify({user_id:userId})}),
  getConversation:(id)      => request("/messages/"+id+"/"),
  send:           (id,text) => request("/messages/"+id+"/",{method:"POST",body:JSON.stringify({text})}),
  contacts:       ()        => request("/messages/contacts/"),
  unreadCount:    ()        => request("/messages/unread-count/"),
};

export const analyticsAPI = {
  dashboard: () => request("/analytics/"),
};

export const reportsAPI = {
  studentPDF: async (studentId) => {
    const token = getToken();
    const res   = await fetch(`${API}/reports/student/${studentId}/pdf/`, {
      headers: token ? { Authorization: "Bearer " + token } : {}
    });
    if (!res.ok) throw new Error("Failed");
    const blob = await res.blob();
    const url  = window.URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `report_card_${studentId}.pdf`;
    a.click();
    window.URL.revokeObjectURL(url);
  },
  teacherTimetablePDF: async () => {
    const token = getToken();
    const res   = await fetch(`${API}/reports/teacher/timetable/pdf/`, {
      headers: token ? { Authorization: "Bearer " + token } : {}
    });
    if (!res.ok) throw new Error("Failed");
    const blob = await res.blob();
    const url  = window.URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `my_schedule.pdf`;
    a.click();
    window.URL.revokeObjectURL(url);
  },
  classAttendancePDF: async (classId) => {
    const token = getToken();
    const res   = await fetch(`${API}/reports/class/${classId}/attendance/pdf/`, {
      headers: token ? { Authorization: "Bearer " + token } : {}
    });
    if (!res.ok) throw new Error("Failed");
    const blob = await res.blob();
    const url  = window.URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `attendance_class_${classId}.pdf`;
    a.click();
    window.URL.revokeObjectURL(url);
  },
};

export const lessonPlanAPI = {
  // New simple API — entries per teacher, per class, per week
  list:      (params={}) => request("/lesson-plans/?" + new URLSearchParams(params)),
  create:    (d)         => request("/lesson-plans/",         {method:"POST",   body:JSON.stringify(d)}),
  update:    (id, d)     => request("/lesson-plans/"+id+"/",  {method:"PATCH",  body:JSON.stringify(d)}),
  delete:    (id)        => request("/lesson-plans/"+id+"/",  {method:"DELETE"}),
};

export const videosAPI = {
  list: () => request("/videos/"),

  upload: (formData) => {
    const token = getToken();
    const base  = (process.env.REACT_APP_API_URL||"http://localhost:8000").replace(/\/$/, "");
    return fetch(base + "/api/videos/", {
      method:  "POST",
      headers: token ? { Authorization: "Bearer " + token } : {},
      body:    formData,
    }).then(async r => {
      const d = await r.json();
      if (!r.ok) throw d;
      return d;
    });
  },

  delete: (id) => request("/videos/" + id + "/", { method: "DELETE" }),
};
