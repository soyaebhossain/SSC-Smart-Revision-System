"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { FormEvent, ReactNode } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, BookOpenCheck, CheckCheck, ClipboardList, Download, FileUp, GraduationCap, LayoutDashboard, Menu, MessageSquare, Plus, Search, ShieldCheck, Target, TrendingUp, Users, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { applyAction, completion, initialStore, navigation, parseStudentsCsv, profiles, roles, scopedStore, STORAGE_KEY, storeSchema, studentsCsv, teachers } from "@/lib/revision-store";
import type { Action, Plan, Role, Store, Student, Tab } from "@/lib/revision-store";

const icons: Record<Tab, LucideIcon> = { overview: LayoutDashboard, students: Users, assignments: ShieldCheck, gaps: Target, plans: BookOpenCheck, results: Activity, notes: MessageSquare };
const subscribe = () => () => {};
const today = () => new Date().toISOString().slice(0, 10);
const gap = (student: Student) => Math.round((100 - student.post) * 10) / 10;

export default function Home() {
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);
  return hydrated ? <Workspace /> : <div className="loading-screen" role="status">Loading your revision workspace…</div>;
}

function Workspace() {
  const [loaded] = useState(() => {
    try { const raw = localStorage.getItem(STORAGE_KEY); return { store: raw ? storeSchema.parse(JSON.parse(raw)) : initialStore(), error: "" }; }
    catch { return { store: initialStore(), error: "Saved workspace could not be loaded. Sample data is shown; changes cannot be saved until browser storage is available and the saved data is valid." }; }
  });
  const [store, setStore] = useState<Store>(loaded.store);
  const storeRef = useRef(store);
  const [role, setRole] = useState<Role>("Admin");
  const roleRef = useRef<Role>("Admin");
  const [tab, setTab] = useState<Tab>("overview");
  const [selectedId, setSelectedId] = useState("");
  const [query, setQuery] = useState("");
  const [mobile, setMobile] = useState(false);
  const [modal, setModal] = useState(false);
  const [toast, setToast] = useState("");
  const [storageError, setStorageError] = useState(loaded.error);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const view = scopedStore(store, role);
  const student = view.students.find(row => row.id === selectedId) ?? view.students[0];
  const filtered = view.students.filter(row => `${row.name} ${row.id} ${row.subject}`.toLowerCase().includes(query.toLowerCase()));
  const isStaff = role === "Admin" || role === "Teacher";
  const activeTab = navigation[role].some(item => item.id === tab) ? tab : "overview";

  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY || !event.newValue) return;
      try { const next = storeSchema.parse(JSON.parse(event.newValue)); storeRef.current = next; setStore(next); setStorageError(""); }
      catch { setStorageError("Another tab saved an unreadable workspace. Reload after restoring valid data."); }
    };
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener("storage", sync); if (timer.current) clearTimeout(timer.current); };
  }, []);

  function flash(message: string) {
    if (timer.current) clearTimeout(timer.current);
    setToast(message); timer.current = setTimeout(() => setToast(""), 4500);
  }
  function dispatch(action: Action, message: string): boolean {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const current = raw ? storeSchema.parse(JSON.parse(raw)) : storeRef.current;
      const next = applyAction(current, roleRef.current, action);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      storeRef.current = next; setStore(next); setStorageError(""); flash(message); return true;
    } catch (error) { flash(error instanceof Error ? error.message : "Unable to save this change."); return false; }
  }
  function switchRole(next: Role) {
    roleRef.current = next;
    setRole(next); setTab("overview"); setSelectedId(""); setQuery(""); setModal(false); setMobile(false); setToast("");
    if (timer.current) clearTimeout(timer.current);
  }
  function go(next: Tab) { setTab(next); setMobile(false); }
  function selectStudent(row: Student) { setSelectedId(row.id); go(role === "Admin" ? "results" : "plans"); }
  function exportCsv() {
    if (!isStaff) return;
    const url = URL.createObjectURL(new Blob([studentsCsv(view.students)], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = `${role.toLowerCase()}-student-results.csv`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000); flash(`${view.students.length} student records exported`);
  }

  return <div className="app-shell">
    {mobile && <button className="nav-overlay" aria-label="Close navigation" onClick={() => setMobile(false)} />}
    <aside className={`sidebar ${mobile ? "open" : ""}`}>
      <div className="brand"><div className="brand-mark"><GraduationCap size={23} /></div><div><b>SSC Smart Revision</b><span>Fahad&apos;s Tutorial</span></div><button aria-label="Close navigation" onClick={() => setMobile(false)} className="mobile-close"><X size={20} /></button></div>
      <div className="role-identity"><span>{role} workspace</span><b>{profiles[role].name}</b></div>
      <nav aria-label={`${role} navigation`}>{navigation[role].map(({ id, label }) => { const Icon = icons[id]; return <button key={id} onClick={() => go(id)} className={activeTab === id ? "active" : ""} aria-current={activeTab === id ? "page" : undefined}><Icon size={19} /><span>{label}</span></button>; })}</nav>
      <div className="side-note"><ShieldCheck size={20} /><div><b>{role === "Admin" ? "School management" : role === "Teacher" ? "Your assigned class" : role === "Student" ? "One step at a time" : "Support from home"}</b><p>{profiles[role].description}</p></div></div>
      <div className="data-note"><span>Role preview</span><b>{view.students.length} {role === "Parent" ? "linked child" : "visible learners"}</b><small>Sample workspace · this browser</small></div>
    </aside>
    <main className="main">
      <header className="topbar"><button className="menu-btn" aria-label="Open navigation" onClick={() => setMobile(true)}><Menu size={22} /></button><div><h1>{navigation[role].find(item => item.id === activeTab)?.label}</h1><p>{profiles[role].description}</p></div><div className="top-actions"><label className="role-switch"><span>Preview role</span><select value={role} onChange={event => switchRole(event.target.value as Role)} aria-label="Preview role">{roles.map(item => <option key={item}>{item}</option>)}</select></label><div className="avatar" aria-hidden="true">{role.slice(0, 2).toUpperCase()}</div></div></header>
      <section className="content">
        <div className="workspace-notice">Role preview with sample profiles. Changes are saved in this browser.</div>
        {storageError && <p className="form-error" role="alert">{storageError}</p>}
        {activeTab === "overview" && <>
          <SectionHead eyebrow={`${role.toUpperCase()} WORKSPACE`} title={role === "Admin" ? "Your school at a glance" : role === "Teacher" ? "A clear plan for your class" : role === "Student" ? `Welcome back, ${student?.name.split(" ")[0] ?? "learner"}` : `${student?.name ?? "Your child"}’s learning journey`}>
            {role === "Admin" && <Button variant="outline" onClick={() => go("assignments")}><Users />Manage teachers</Button>}
            {isStaff && <Button disabled={!student} onClick={() => setModal(true)}><Plus />Record result</Button>}
            {role === "Student" && student && <Button onClick={() => go("plans")}><BookOpenCheck />Continue revision</Button>}
            {role === "Parent" && <Button onClick={() => go("notes")}><MessageSquare />Read teacher updates</Button>}
          </SectionHead>
          <Summary role={role} view={view} student={student} />
          {!student ? <Empty>No learners are linked to this profile yet. The administrator can assign students to a teacher.</Empty> : isStaff ? <>
            <div className="grid-two"><PerformanceChart view={view} /><article className="panel"><div className="panel-title"><div><h3>{role === "Admin" ? "Administration priorities" : "Your teaching priorities"}</h3><p>Based on the learners in this workspace</p></div></div><div className="action-stack">
              {role === "Admin" ? <><ActionCard title={`${view.students.filter(row => !row.teacherId).length} students without a teacher`} detail="Assign an owner so each learner receives support." action="Assign teachers" onClick={() => go("assignments")} /><ActionCard title={`${view.students.length} student records`} detail="Import new learners or export school-wide results." action="Manage students" onClick={() => go("students")} /></> : <><ActionCard title={`${view.students.filter(row => row.post < 60).length} learners below 60%`} detail="Review gaps and focus your next lesson." action="Review gaps" onClick={() => go("gaps")} /><ActionCard title={`${view.students.filter(row => !view.plans.find(plan => plan.studentId === row.id)?.assigned).length} plans awaiting assignment`} detail="Review the tasks before publishing to a learner." action="Review plans" onClick={() => go("plans")} /><ActionCard title="Keep parents involved" detail="Share specific practice guidance with a learner’s guardian." action="Write an update" onClick={() => go("notes")} /></>}
            </div></article></div><StudentTable students={view.students} plans={view.plans} onSelect={selectStudent} actionLabel={role === "Admin" ? "View results" : "View plan"} />
          </> : <div className="grid-two"><article className="panel"><div className="panel-title"><div><h3>{role === "Student" ? "Your next revision task" : "Revision at home"}</h3><p>{student.subject} · {student.id}</p></div><Badge variant="secondary">{completion(view.plans.find(plan => plan.studentId === student.id))}% complete</Badge></div><NextTask plan={view.plans.find(plan => plan.studentId === student.id)} /><Button onClick={() => go("plans")} variant="outline">{role === "Student" ? "Open my plan" : "View child’s plan"}</Button></article><article className="panel"><div className="panel-title"><div><h3>{role === "Student" ? "Focus for this week" : "How you can help"}</h3></div></div><p className="body-copy">{role === "Student" ? `Your current learning gap is ${gap(student)}%. Review ${student.subject} concepts, work through your assigned tasks and revisit mistakes after each assessment.` : `Give ${student.name.split(" ")[0]} a quiet study space and a short daily recall session. Read the teacher’s guidance before adding extra practice.`}</p><Button variant="outline" onClick={() => go(role === "Student" ? "results" : "notes")}>{role === "Student" ? "Review my results" : "View teacher guidance"}</Button></article><PerformanceChart view={view} /></div>}
        </>}

        {activeTab === "students" && isStaff && <>
          <SectionHead eyebrow={role === "Admin" ? "STUDENT MANAGEMENT" : "ASSIGNED CLASS"} title={role === "Admin" ? "All student records" : "Students you teach"}>
            {role === "Admin" && <><input ref={fileRef} className="hidden" type="file" accept=".csv,text/csv" aria-label="Import student CSV" onChange={async event => {
              const file = event.target.files?.[0]; event.target.value = ""; if (!file) return;
              if (file.size > 1_000_000) { flash("Choose a CSV smaller than 1 MB."); return; }
              try { const rows = parseStudentsCsv(await file.text()); dispatch({ type: "import-students", students: rows }, `${rows.length} students imported. Assign their teachers next.`); } catch (error) { flash(error instanceof Error ? error.message : "Unable to read the CSV."); }
            }} /><Button variant="outline" onClick={() => fileRef.current?.click()}><FileUp />Import CSV</Button></>}
            <Button variant="outline" onClick={exportCsv}><Download />Export CSV</Button>
          </SectionHead>
          {role === "Admin" && <details className="csv-help"><summary>CSV format for new students</summary><p>Required columns: Student_ID, Subject, Pre_Test_Percent, Post_Test_Percent, Retention_Test_Percent. Optional: Name, Group. Scores must be 0–100. Import up to 250 new IDs; existing records stay unchanged.</p></details>}
          <label className="search student-search"><Search size={17} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search name, student ID or subject" aria-label="Search students" /></label>
          <StudentTable students={filtered} plans={view.plans} onSelect={selectStudent} actionLabel={role === "Admin" ? "View results" : "View plan"} />
        </>}

        {activeTab === "assignments" && role === "Admin" && <><SectionHead eyebrow="TEACHER ALLOCATION" title="Connect each learner with a teacher" /><div className="panel assignment-list">{view.students.map(row => <div className="assignment-row" key={row.id}><div><b>{row.name}</b><small>{row.id} · {row.subject}</small></div><label><span>Assigned teacher</span><select aria-label={`Teacher for ${row.id}`} value={row.teacherId ?? ""} onChange={event => dispatch({ type: "assign-teacher", studentId: row.id, teacherId: event.target.value || null }, "Teacher assignment updated")}><option value="">Unassigned</option>{teachers.map(teacher => <option value={teacher.id} key={teacher.id}>{teacher.name}</option>)}</select></label></div>)}</div></>}

        {activeTab === "gaps" && (role === "Teacher" || role === "Student") && <><SectionHead eyebrow="LEARNING GAPS" title={role === "Teacher" ? "Where your class needs support" : "What to practice next"} />{!view.students.length ? <Empty>No learners assigned yet.</Empty> : <div className="gap-grid">{view.students.map(row => <article className="gap-card" key={row.id}><span>{row.subject}</span><h3>{row.name}</h3><strong>{gap(row)}%</strong><p>learning gap · 100% minus latest score</p><Progress value={gap(row)} /><small>{row.post < 60 ? "Prioritize concept review and targeted practice." : "Consolidate understanding with spaced recall."}</small><Button variant="outline" onClick={() => { setSelectedId(row.id); go("plans"); }}>Open revision plan</Button></article>)}</div>}</>}

        {activeTab === "plans" && role !== "Admin" && <>
          <SectionHead eyebrow="REVISION PLANNING" title={role === "Teacher" ? "Review and assign practice" : role === "Student" ? "Your revision, one task at a time" : "Your child’s assigned practice"}>{student && <Button variant="outline" onClick={() => window.print()}><Download />Save PDF</Button>}</SectionHead>
          {role === "Teacher" && <LearnerSelect students={view.students} selected={student?.id} onChange={setSelectedId} />}
          {student ? <PlanView role={role} student={student} plan={view.plans.find(plan => plan.studentId === student.id)} dispatch={dispatch} /> : <Empty>No learner is assigned to this profile.</Empty>}
        </>}

        {activeTab === "results" && <>
          <SectionHead eyebrow="ASSESSMENT HISTORY" title={isStaff ? "Track and record assessment results" : role === "Student" ? "Your assessment results" : "Your child’s assessment results"}>{isStaff && <Button disabled={!student} onClick={() => setModal(true)}><Plus />Record result</Button>}</SectionHead>
          {isStaff && <LearnerSelect students={view.students} selected={student?.id} onChange={setSelectedId} />}
          {student ? <><PerformanceChart view={{ ...view, students: [student], results: view.results.filter(result => result.studentId === student.id) }} /><article className="panel result-history"><div className="panel-title"><div><h3>{student.name} · {student.subject}</h3><p>Assessment history, newest entries first</p></div></div>{[...view.results].filter(result => result.studentId === student.id).reverse().map(result => <div className="result-row" key={result.id}><div><b>{result.title}</b><small>{result.date}</small></div><strong>{result.score}%</strong></div>)}</article></> : <Empty>No results available for this profile.</Empty>}
        </>}

        {activeTab === "notes" && (role === "Teacher" || role === "Parent") && <>
          <SectionHead eyebrow="HOME AND SCHOOL" title={role === "Teacher" ? "Keep parents up to date" : "Updates from your child’s teacher"} />
          {role === "Teacher" && <><LearnerSelect students={view.students} selected={student?.id} onChange={setSelectedId} />{student && <NoteForm key={student.id} student={student} onSave={message => dispatch({ type: "add-note", studentId: student.id, note: { id: crypto.randomUUID(), studentId: student.id, author: profiles.Teacher.name, message, date: today(), acknowledged: false } }, "Update saved for the linked parent")} />}</>}
          <div className="note-list">{view.notes.filter(note => role === "Parent" || note.studentId === student?.id).length ? view.notes.filter(note => role === "Parent" || note.studentId === student?.id).map(note => <article className="panel" key={note.id}><div className="panel-title"><div><h3>{note.author}</h3><p>{view.students.find(row => row.id === note.studentId)?.name} · {note.date}</p></div><Badge variant="secondary">{note.acknowledged ? "Read by parent" : "Awaiting parent"}</Badge></div><p className="note-message">{note.message}</p>{role === "Parent" && <Button variant="outline" disabled={note.acknowledged} onClick={() => dispatch({ type: "acknowledge-note", studentId: note.studentId, noteId: note.id }, "Teacher update marked as read")}><CheckCheck />{note.acknowledged ? "Marked as read" : "Mark as read"}</Button>}</article>) : <Empty>No teacher updates yet.</Empty>}</div>
        </>}
      </section>
    </main>
    {modal && isStaff && <ResultDialog students={view.students} selectedId={student?.id} onClose={() => setModal(false)} onSave={(studentId, title, score) => { const success = dispatch({ type: "record-result", studentId, result: { id: crypto.randomUUID(), studentId, title, score, date: today() } }, "Assessment saved and progress updated"); if (success) { setModal(false); setSelectedId(studentId); setTab("results"); } return success; }} />}
    {toast && <div className="toast" role="status">{toast}</div>}
  </div>;
}

function SectionHead({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) { return <div className="section-head"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2></div>{children && <div className="buttons">{children}</div>}</div>; }
function Empty({ children }: { children: ReactNode }) { return <div className="empty-state"><BookOpenCheck size={28} /><p>{children}</p></div>; }
function Metric({ label, value, note, icon: Icon, tone = "green" }: { label: string; value: string; note: string; icon: LucideIcon; tone?: string }) { return <article className="metric-card"><div className={`metric-icon ${tone}`}><Icon size={20} /></div><div><p>{label}</p><strong>{value}</strong><span>{note}</span></div></article>; }
function Summary({ role, view, student }: { role: Role; view: Store; student?: Student }) {
  const avg = (values: number[]) => values.length ? `${Math.round(values.reduce((a, b) => a + b, 0) / values.length)}%` : "—";
  const assigned = view.plans.filter(plan => plan.assigned), personalPlan = view.plans.find(plan => plan.studentId === student?.id);
  return <div className="metrics">{role === "Admin" || role === "Teacher" ? <>
    <Metric label={role === "Admin" ? "Students enrolled" : "My students"} value={String(view.students.length)} note={role === "Admin" ? "Across the school" : "Assigned to your teacher profile"} icon={Users} />
    <Metric label="Average latest score" value={avg(view.students.map(row => row.post))} note="From current learner records" icon={TrendingUp} />
    <Metric label={role === "Admin" ? "Unassigned learners" : "Students needing support"} value={String(view.students.filter(row => role === "Admin" ? !row.teacherId : row.post < 60).length)} note={role === "Admin" ? "Waiting for a teacher" : "Latest assessment below 60%"} icon={ShieldCheck} tone="amber" />
    <Metric label="Revision completion" value={avg(assigned.map(completion))} note={`${assigned.length} published plans`} icon={BookOpenCheck} tone="blue" />
  </> : <>
    <Metric label={role === "Student" ? "My latest score" : "Child’s latest score"} value={student ? `${student.post}%` : "—"} note={student?.subject ?? "No learner linked"} icon={TrendingUp} />
    <Metric label="Learning gap" value={student ? `${gap(student)}%` : "—"} note="Remaining to reach full mastery" icon={Target} tone="amber" />
    <Metric label="Revision completion" value={student ? `${completion(personalPlan)}%` : "—"} note={`${personalPlan?.tasks.filter(task => task.done).length ?? 0} of ${personalPlan?.tasks.length ?? 0} tasks complete`} icon={BookOpenCheck} />
    <Metric label={role === "Student" ? "Tasks remaining" : "Unread teacher updates"} value={String(role === "Student" ? personalPlan?.tasks.filter(task => !task.done).length ?? 0 : view.notes.filter(note => !note.acknowledged).length)} note={role === "Student" ? "In your assigned revision plan" : "Guidance for your child"} icon={role === "Student" ? ClipboardList : MessageSquare} tone="blue" />
  </>}</div>;
}
function ActionCard({ title, detail, action, onClick }: { title: string; detail: string; action: string; onClick: () => void }) { return <div className="action-card"><b>{title}</b><p>{detail}</p><Button variant="outline" size="sm" onClick={onClick}>{action}</Button></div>; }
function NextTask({ plan }: { plan?: Plan }) { const next = plan?.tasks.find(task => !task.done); return <div className="next-task"><BookOpenCheck size={28} /><h3>{!plan?.assigned ? "Your teacher is preparing a plan" : next?.title ?? "All assigned tasks completed"}</h3><p>{!plan?.assigned ? "Assigned tasks will appear here when the plan is published." : next ? `${next.day} · ${next.minutes} minutes` : "Keep reviewing key concepts until your next assessment."}</p></div>; }
function StudentTable({ students, plans, onSelect, actionLabel }: { students: Student[]; plans: Plan[]; onSelect: (student: Student) => void; actionLabel: string }) {
  if (!students.length) return <Empty>No students match this view.</Empty>;
  return <article className="panel table-panel"><div className="panel-title"><div><h3>Student performance</h3><p>Latest scores and assigned revision progress</p></div><Badge variant="outline">{students.length} students</Badge></div><div className="table-wrap"><table><thead><tr><th>Student</th><th>Subject</th><th>Baseline</th><th>Latest</th><th>Learning gap</th><th>Revision</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{students.map(student => <tr key={student.id}><td><b>{student.name}</b><small className="student-subtext">{student.id}</small></td><td>{student.subject}</td><td>{student.pre}%</td><td><b>{student.post}%</b></td><td>{gap(student)}%</td><td><div className="gap-cell"><Progress value={completion(plans.find(plan => plan.studentId === student.id))} /><span>{completion(plans.find(plan => plan.studentId === student.id))}%</span></div></td><td><button className="view" onClick={() => onSelect(student)} aria-label={`${actionLabel} for ${student.id}`}>{actionLabel}</button></td></tr>)}</tbody></table></div></article>;
}
function LearnerSelect({ students, selected, onChange }: { students: Student[]; selected?: string; onChange: (id: string) => void }) { return <label className="learner-select"><span>Learner</span><select aria-label="Learner" value={selected ?? ""} disabled={!students.length} onChange={event => onChange(event.target.value)}>{!students.length && <option value="">No assigned students</option>}{students.map(student => <option key={student.id} value={student.id}>{student.name} · {student.id} · {student.subject}</option>)}</select></label>; }
function PlanView({ role, student, plan, dispatch }: { role: Role; student: Student; plan?: Plan; dispatch: (action: Action, message: string) => boolean }) {
  return <div className="plan-layout"><article className="student-card"><div className="student-id"><div>{student.name.split(" ").map(part => part[0]).slice(0, 2).join("")}</div><section><h3>{student.name}</h3><p>{student.id} · {student.subject}</p></section></div><dl><div><dt>Current mastery</dt><dd>{student.post}%</dd></div><div><dt>Learning gap</dt><dd>{gap(student)}%</dd></div><div><dt>Retention</dt><dd>{student.retention}%</dd></div><div><dt>Plan completion</dt><dd>{completion(plan)}%</dd></div></dl><div className="plan-reason"><Target /><p>{role === "Parent" ? "Follow your child’s completion here. The learner checks off tasks from their own workspace." : role === "Teacher" ? "Review the suggested practice, then assign it. Learners manage their own task completion." : "Check off each task after completing it. Your teacher and parent can follow your progress."}</p></div></article><article className="panel plan-list"><div className="panel-title"><div><h3>7-day revision cycle</h3><p>{plan?.assigned ? "Assigned by your teacher" : "Not yet assigned to the learner"}</p></div><Badge variant="secondary">{plan?.assigned ? "Assigned" : "Draft"}</Badge></div>{!plan ? <Empty>Your teacher has not published a revision plan yet.</Empty> : <>{plan.tasks.map((task, index) => <div className={`plan-row ${task.done ? "task-done" : ""}`} key={task.id}><span>{index + 1}</span><section><small>{task.day}</small><b>{task.title}</b></section><em>{task.minutes} min</em>{role === "Student" && plan.assigned ? <input type="checkbox" checked={task.done} onChange={event => dispatch({ type: "toggle-task", studentId: student.id, taskId: task.id, done: event.target.checked }, "Revision progress saved")} aria-label={`Complete ${task.title}`} /> : <span className="task-status" aria-label={task.done ? "Completed" : "Pending"}>{task.done ? "✓" : "—"}</span>}</div>)}{role === "Teacher" && !plan.assigned && <Button className="assign-button" onClick={() => dispatch({ type: "assign-plan", studentId: student.id }, "Revision plan assigned to the learner")}><BookOpenCheck />Assign revision plan</Button>}</>}</article></div>;
}
function PerformanceChart({ view }: { view: Store }) {
  const personal = view.students.length === 1;
  const data = personal ? view.results.filter(result => result.studentId === view.students[0].id).map((result, index) => ({ name: String(index + 1), latest: result.score })) : view.students.map(student => ({ name: student.name.split(" ")[0], baseline: student.pre, latest: student.post }));
  return <article className="panel chart-panel"><div className="panel-title"><div><h3>{personal ? "Assessment progress" : "Baseline and latest performance"}</h3><p>{personal ? "Recorded assessments in entry order" : "Learners visible in this workspace"} · out of 100</p></div></div>{!data.length ? <Empty>No assessments recorded yet.</Empty> : <><div className="chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data} margin={{ left: -15, right: 10 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" /><XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis domain={[0, 100]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip />{!personal && <Area name="Baseline" type="linear" dataKey="baseline" stroke="#94a3b8" fill="#f1f5f9" />}<Area name="Score" type="linear" dataKey="latest" stroke="#15803d" strokeWidth={2} fill="#dcfce7" dot={{ r: 4 }} /></AreaChart></ResponsiveContainer></div><div className="legend"><span><i className="green-dot" />{personal ? "Assessment score" : "Latest score"}</span>{!personal && <span><i />Baseline</span>}</div></>}</article>;
}
function NoteForm({ student, onSave }: { student: Student; onSave: (message: string) => boolean }) {
  const [message, setMessage] = useState("");
  return <form className="panel note-form" onSubmit={event => { event.preventDefault(); if (message.trim() && onSave(message.trim())) setMessage(""); }}><label htmlFor="parent-note">Guidance for {student.name}&apos;s parent</label><textarea id="parent-note" value={message} onChange={event => setMessage(event.target.value)} required maxLength={1000} rows={4} placeholder="Share progress, areas to practice and ways to help at home…" /><p>{student.parentUserId ? "The linked parent can read and acknowledge this update in their workspace." : "No parent account is linked yet. This note will remain in the learner’s record."}</p><Button type="submit" disabled={!message.trim()}><MessageSquare />Save parent update</Button></form>;
}
function ResultDialog({ students, selectedId, onClose, onSave }: { students: Student[]; selectedId?: string; onClose: () => void; onSave: (studentId: string, title: string, score: number) => boolean }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState("");
  useEffect(() => { const dialog = dialogRef.current; dialog?.showModal(); return () => dialog?.close(); }, []);
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    const studentId = String(data.get("student")), title = String(data.get("title") ?? "").trim(), raw = String(data.get("score") ?? "");
    if (!students.some(row => row.id === studentId) || !title || !raw || !Number.isFinite(Number(raw)) || Number(raw) < 0 || Number(raw) > 100) { setError("Select a learner, name the assessment and enter a score between 0 and 100."); return; }
    if (!onSave(studentId, title, Number(raw))) setError("The result could not be saved. Check the status message and try again.");
  }
  return <dialog className="modal result-dialog" ref={dialogRef} onCancel={onClose} aria-labelledby="result-title"><div className="modal-head"><div><h3 id="result-title">Record assessment result</h3><p>Updates the learner’s latest score and history</p></div><button type="button" aria-label="Close result form" onClick={onClose}><X /></button></div><form onSubmit={save}><label>Learner<select name="student" defaultValue={selectedId} required>{students.map(student => <option key={student.id} value={student.id}>{student.name} · {student.id}</option>)}</select></label><label>Assessment name<Input name="title" required maxLength={100} placeholder="e.g. Weekly Biology test" autoFocus /></label><label>Score (%)<Input name="score" type="number" min="0" max="100" step="0.1" required placeholder="0–100" /></label>{error && <p className="form-error" role="alert">{error}</p>}<div className="buttons"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="submit">Save result</Button></div></form></dialog>;
}
