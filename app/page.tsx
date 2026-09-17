"use client";

import { useMemo, useRef, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, BookOpenCheck, BrainCircuit, Download, FileUp, GraduationCap, LayoutDashboard, Menu, Plus, Search, ShieldCheck, Sparkles, Target, TrendingUp, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type Role = "Admin" | "Teacher" | "Student" | "Parent";
type Student = { id:string; group:string; subject:string; pre:number; post:number; retention:number; completion:number; gap:number };

const initialStudents: Student[] = [
  {id:"SSC-0001",group:"Experimental",subject:"Biology",pre:42,post:62,retention:60,completion:98,gap:36.4},
  {id:"SSC-0002",group:"Control",subject:"Physics",pre:38,post:51,retention:45,completion:63,gap:52.0},
  {id:"SSC-0003",group:"Experimental",subject:"Chemistry",pre:49,post:71,retention:68,completion:100,gap:26.8},
  {id:"SSC-0004",group:"Control",subject:"Biology",pre:50,post:58,retention:49,completion:49,gap:44.6},
  {id:"SSC-0005",group:"Experimental",subject:"Physics",pre:44,post:59,retention:52,completion:77,gap:39.2},
  {id:"SSC-0006",group:"Control",subject:"Chemistry",pre:40,post:50,retention:46,completion:54,gap:45.2},
  {id:"SSC-0007",group:"Experimental",subject:"Biology",pre:39,post:61,retention:57,completion:81,gap:33.6},
  {id:"SSC-0008",group:"Control",subject:"Physics",pre:40,post:55,retention:50,completion:54,gap:42.2},
];

const weekly = [
  {week:"W1",experimental:9.34,control:9.09},{week:"W2",experimental:9.88,control:9.27},
  {week:"W3",experimental:10.42,control:9.49},{week:"W4",experimental:10.89,control:9.63},
  {week:"W5",experimental:11.44,control:9.87},{week:"W6",experimental:11.87,control:10.08},
  {week:"W7",experimental:12.36,control:10.32},{week:"W8",experimental:12.91,control:10.48},
];

function Metric({label,value,note,icon:Icon,tone="green"}:{label:string;value:string;note:string;icon:any;tone?:string}) {
  return <article className="metric-card"><div className={`metric-icon ${tone}`}><Icon size={20}/></div><div><p>{label}</p><strong>{value}</strong><span>{note}</span></div></article>
}

export default function Home() {
  const [role,setRole]=useState<Role>("Admin");
  const [tab,setTab]=useState("overview");
  const [query,setQuery]=useState("");
  const [students,setStudents]=useState<Student[]>(initialStudents);
  const [selected,setSelected]=useState<Student>(initialStudents[0]);
  const [toast,setToast]=useState("");
  const [mobile,setMobile]=useState(false);
  const [modal,setModal]=useState(false);
  const fileRef=useRef<HTMLInputElement>(null);
  const filtered=useMemo(()=>students.filter(s=>(s.id+s.subject+s.group).toLowerCase().includes(query.toLowerCase())),[students,query]);

  const flash=(m:string)=>{setToast(m);setTimeout(()=>setToast(""),2600)};
  const importCsv=async(e:React.ChangeEvent<HTMLInputElement>)=>{
    const file=e.target.files?.[0]; if(!file)return;
    const lines=(await file.text()).split(/\r?\n/).filter(Boolean); const headers=lines[0].split(",");
    const ix=(n:string)=>headers.indexOf(n);
    const parsed=lines.slice(1,251).map((line,i)=>{const c=line.split(",");return {id:c[ix("Student_ID")]||`IMPORT-${i+1}`,group:c[ix("Group")]||"Imported",subject:c[ix("Subject")]||"Unknown",pre:+c[ix("Pre_Test_Percent")]||0,post:+c[ix("Post_Test_Percent")]||0,retention:+c[ix("Retention_Test_Percent")]||0,completion:+c[ix("Revision_Plan_Completion_Percent")]||0,gap:Math.max(0,100-(+c[ix("Post_Test_Percent")]||0))}}).filter(s=>s.id);
    setStudents(parsed.length?parsed:students); flash(`${Math.min(lines.length-1,250)} records imported for review`);
  };
  const exportCsv=()=>{const body=["Student_ID,Group,Subject,Pre,Post,Retention,Completion,Learning_Gap",...students.map(s=>`${s.id},${s.group},${s.subject},${s.pre},${s.post},${s.retention},${s.completion},${s.gap}`)].join("\n");const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([body],{type:"text/csv"}));a.download="student-performance-report.csv";a.click();flash("Report exported")};
  const nav=[{id:"overview",label:"Overview",icon:LayoutDashboard},{id:"students",label:"Students",icon:Users},{id:"gaps",label:"Learning Gaps",icon:Target},{id:"plans",label:"AI Revision Plans",icon:BrainCircuit},{id:"tests",label:"Weekly Progress",icon:Activity}];
  const roleNote:Record<Role,string>={Admin:"Full cohort and operations view",Teacher:"Class progress and interventions",Student:"Personal progress and revision plan",Parent:"Learner progress and weekly guidance"};

  return <div className="app-shell">
    <aside className={`sidebar ${mobile?"open":""}`}>
      <div className="brand"><div className="brand-mark"><GraduationCap size={23}/></div><div><b>SSC Smart Revision</b><span>Fahad&apos;s Tutorial</span></div><button onClick={()=>setMobile(false)} className="mobile-close"><X size={20}/></button></div>
      <nav>{nav.map(({id,label,icon:Icon})=><button key={id} onClick={()=>{setTab(id);setMobile(false)}} className={tab===id?"active":""}><Icon size={19}/><span>{label}</span></button>)}</nav>
      <div className="side-note"><Sparkles size={18}/><div><b>AI plan engine</b><p>8-week adaptive revision logic is ready.</p></div></div>
      <div className="data-note"><span>Dataset</span><b>1,000 synthetic records</b><small>Validation environment</small></div>
    </aside>
    <main className="main">
      <header className="topbar"><button className="menu-btn" onClick={()=>setMobile(true)}><Menu size={22}/></button><div><h1>{nav.find(n=>n.id===tab)?.label}</h1><p>{roleNote[role]}</p></div><div className="top-actions"><div className="search"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search student or subject"/></div><select value={role} onChange={e=>setRole(e.target.value as Role)} aria-label="Preview role"><option>Admin</option><option>Teacher</option><option>Student</option><option>Parent</option></select><div className="avatar">SH</div></div></header>
      <section className="content">
        {tab==="overview"&&<><div className="section-head"><div><span className="eyebrow">COHORT SNAPSHOT</span><h2>Performance signals that need attention</h2></div><div className="buttons"><input ref={fileRef} className="hidden" type="file" accept=".csv" onChange={importCsv}/><Button variant="outline" onClick={()=>fileRef.current?.click()}><FileUp/>Import CSV</Button><Button onClick={()=>setModal(true)}><Plus/>Add result</Button></div></div><div className="metrics"><Metric label="Students tracked" value="1,000" note="500 experimental · 500 control" icon={Users}/><Metric label="AI group gain" value="+22.8 pp" note="vs +9.3 pp control" icon={TrendingUp}/><Metric label="Students at risk" value="501" note="Post-test below 60%" icon={ShieldCheck} tone="amber"/><Metric label="Plan completion" value="82%" note="Experimental group average" icon={BookOpenCheck} tone="blue"/></div><div className="grid-two"><article className="panel chart-panel"><div className="panel-title"><div><h3>Weekly performance trajectory</h3><p>Mean score out of 20 across the 8-week intervention</p></div><Badge variant="secondary">Synthetic validation data</Badge></div><div className="chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={weekly}><defs><linearGradient id="eg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#16a34a" stopOpacity={.24}/><stop offset="95%" stopColor="#16a34a" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb"/><XAxis dataKey="week" axisLine={false} tickLine={false}/><YAxis domain={[7,15]} axisLine={false} tickLine={false}/><Tooltip/><Area type="monotone" dataKey="experimental" stroke="#15803d" strokeWidth={3} fill="url(#eg)"/><Area type="monotone" dataKey="control" stroke="#94a3b8" strokeWidth={2} fill="transparent"/></AreaChart></ResponsiveContainer></div><div className="legend"><span><i className="green-dot"/>Experimental</span><span><i/>Control</span></div></article><article className="panel"><div className="panel-title"><div><h3>Priority interventions</h3><p>Decision rules generated from current performance</p></div></div><div className="interventions"><div><span className="risk high">High</span><section><b>Learning gap above 40%</b><p>507 students need focused concept review.</p></section><button onClick={()=>setTab("gaps")}>Review</button></div><div><span className="risk medium">Medium</span><section><b>Low retention</b><p>Schedule spaced practice after the post-test.</p></section><button onClick={()=>setTab("plans")}>Plan</button></div><div><span className="risk low">Monitor</span><section><b>Weekly progress</b><p>Experimental growth is +0.50 points per week.</p></section><button onClick={()=>setTab("tests")}>Track</button></div></div></article></div><StudentTable rows={filtered.slice(0,6)} onSelect={(s)=>{setSelected(s);setTab("plans")}}/></>}
        {tab==="students"&&<><div className="section-head"><div><span className="eyebrow">STUDENT RECORDS</span><h2>Search, review and update performance</h2></div><Button onClick={exportCsv}><Download/>Export CSV</Button></div><StudentTable rows={filtered} onSelect={setSelected}/></>}
        {tab==="gaps"&&<GapView students={students}/>} {tab==="plans"&&<PlanView student={selected}/>} {tab==="tests"&&<ProgressView/>}
      </section>
    </main>
    {modal&&<div className="modal-backdrop" onMouseDown={()=>setModal(false)}><div className="modal" onMouseDown={e=>e.stopPropagation()}><div className="modal-head"><div><h3>Add assessment result</h3><p>Manual entry for a single learner</p></div><button onClick={()=>setModal(false)}><X/></button></div><form onSubmit={e=>{e.preventDefault();setModal(false);flash("Result saved to the current view")}}><label>Student ID<Input required placeholder="SSC-1001"/></label><label>Subject<select><option>Biology</option><option>Physics</option><option>Chemistry</option></select></label><div className="form-grid"><label>Pre-test<Input type="number" min="0" max="100"/></label><label>Post-test<Input type="number" min="0" max="100"/></label></div><Button type="submit">Save result</Button></form></div></div>}
    {toast&&<div className="toast">{toast}</div>}
  </div>
}

function StudentTable({rows,onSelect}:{rows:Student[];onSelect:(s:Student)=>void}){return <article className="panel table-panel"><div className="panel-title"><div><h3>Student performance</h3><p>Prioritize low mastery and weak retention</p></div><Badge variant="outline">{rows.length} visible</Badge></div><div className="table-wrap"><table><thead><tr><th>Student</th><th>Subject</th><th>Group</th><th>Pre</th><th>Post</th><th>Retention</th><th>Learning gap</th><th></th></tr></thead><tbody>{rows.map(s=><tr key={s.id}><td><b>{s.id}</b></td><td>{s.subject}</td><td><span className={s.group==="Experimental"?"group exp":"group"}>{s.group}</span></td><td>{s.pre}%</td><td><b>{s.post}%</b></td><td>{s.retention}%</td><td><div className="gap-cell"><Progress value={s.gap}/><span>{s.gap}%</span></div></td><td><button className="view" onClick={()=>onSelect(s)}>View plan</button></td></tr>)}</tbody></table></div></article>}
function GapView({students}:{students:Student[]}){const high=students.filter(s=>s.gap>40);return <><div className="section-head"><div><span className="eyebrow">LEARNING GAP DETECTION</span><h2>{high.length} visible learners require targeted support</h2></div></div><div className="gap-grid">{["Cell Biology","Motion","Chemical Bonding","Genetics","Electricity","Acids and Bases"].map((t,i)=><article className="gap-card" key={t}><span>{i%3===0?"Biology":i%3===1?"Physics":"Chemistry"}</span><h3>{t}</h3><strong>{[46,43,41,39,37,34][i]}%</strong><p>average learning gap</p><Progress value={[46,43,41,39,37,34][i]}/><small>{[84,77,73,69,63,58][i]} learners affected</small></article>)}</div></>}
function PlanView({student}:{student:Student}){const tasks=[{day:"Day 1",title:`Rebuild ${student.subject} foundations`,time:"35 min",type:"Concept review"},{day:"Day 2",title:"Practice 20 targeted MCQs",time:"30 min",type:"Adaptive practice"},{day:"Day 3",title:"Correct recurring errors",time:"25 min",type:"Error clinic"},{day:"Day 5",title:"Mixed board-style assessment",time:"40 min",type:"Mastery check"},{day:"Day 7",title:"Spaced recall and reflection",time:"20 min",type:"Retention"}];return <><div className="section-head"><div><span className="eyebrow">AI REVISION PLAN</span><h2>Personalized plan for {student.id}</h2></div><Button onClick={()=>window.print()}><Download/>Save PDF</Button></div><div className="plan-layout"><article className="student-card"><div className="student-id"><div>{student.id.slice(-2)}</div><section><h3>{student.id}</h3><p>{student.subject} · {student.group}</p></section></div><dl><div><dt>Current mastery</dt><dd>{student.post}%</dd></div><div><dt>Learning gap</dt><dd>{student.gap}%</dd></div><div><dt>Retention</dt><dd>{student.retention}%</dd></div><div><dt>Plan completion</dt><dd>{student.completion}%</dd></div></dl><div className="plan-reason"><BrainCircuit/><p><b>Why this plan?</b> The student needs stronger concept recall and retention-focused practice.</p></div></article><article className="panel plan-list"><div className="panel-title"><div><h3>7-day adaptive revision cycle</h3><p>Teacher review recommended before assignment</p></div><Badge>AI generated</Badge></div>{tasks.map((t,i)=><div className="plan-row" key={t.day}><span>{i+1}</span><section><small>{t.day} · {t.type}</small><b>{t.title}</b></section><em>{t.time}</em><input type="checkbox" aria-label={`Complete ${t.title}`}/></div>)}</article></div></>}
function ProgressView(){return <><div className="section-head"><div><span className="eyebrow">WEEKLY TESTS</span><h2>Progress is accelerating in the personalized group</h2></div></div><article className="panel chart-panel large"><div className="chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={weekly}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="week"/><YAxis domain={[7,15]}/><Tooltip/><Area type="monotone" dataKey="experimental" stroke="#15803d" strokeWidth={3} fill="#dcfce7"/><Area type="monotone" dataKey="control" stroke="#64748b" strokeWidth={2} fill="#f1f5f9"/></AreaChart></ResponsiveContainer></div></article><div className="metrics"><Metric label="Experimental slope" value="+0.50" note="points per week" icon={TrendingUp}/><Metric label="Control slope" value="+0.20" note="points per week" icon={Activity} tone="blue"/><Metric label="Week 8 gap" value="2.43" note="points out of 20" icon={Target} tone="amber"/></div></>}
