import { z } from "zod";

export const roles = ["Admin", "Teacher", "Student", "Parent"] as const;
export type Role = typeof roles[number];
export type Tab = "overview" | "students" | "assignments" | "gaps" | "plans" | "results" | "notes";
export const profiles = {
  Admin: { id: "admin-1", name: "School administrator", description: "All learners and school operations" },
  Teacher: { id: "teacher-1", name: "Fahad Rahman", description: "Your assigned learners and teaching tasks" },
  Student: { id: "student-1", name: "Ayesha Rahman", description: "Your results, revision and daily tasks" },
  Parent: { id: "parent-1", name: "Ayesha’s guardian", description: "Your child’s progress and teacher updates" },
} satisfies Record<Role, { id: string; name: string; description: string }>;
export const teachers = [{ id: "teacher-1", name: "Fahad Rahman" }, { id: "teacher-2", name: "Nusrat Ahmed" }];
export const navigation: Record<Role, { id: Tab; label: string }[]> = {
  Admin: [{ id: "overview", label: "School overview" }, { id: "students", label: "All students" }, { id: "assignments", label: "Teacher assignments" }, { id: "results", label: "Assessment results" }],
  Teacher: [{ id: "overview", label: "Teaching dashboard" }, { id: "students", label: "My students" }, { id: "gaps", label: "Learning gaps" }, { id: "plans", label: "Revision plans" }, { id: "results", label: "Record results" }, { id: "notes", label: "Parent updates" }],
  Student: [{ id: "overview", label: "My dashboard" }, { id: "plans", label: "My revision plan" }, { id: "results", label: "My results" }, { id: "gaps", label: "My learning gaps" }],
  Parent: [{ id: "overview", label: "Parent dashboard" }, { id: "results", label: "Child’s results" }, { id: "plans", label: "Child’s revision" }, { id: "notes", label: "Teacher updates" }],
};

const score = z.number().finite().min(0).max(100);
const studentSchema = z.object({
  id: z.string().min(1), name: z.string().min(1), subject: z.string().min(1), group: z.string().min(1),
  teacherId: z.enum(["teacher-1", "teacher-2"]).nullable(), studentUserId: z.string().nullable(), parentUserId: z.string().nullable(),
  pre: score, post: score, retention: score,
});
const taskSchema = z.object({ id: z.string(), title: z.string().min(1), day: z.string(), minutes: z.number().positive(), done: z.boolean() });
const planSchema = z.object({ studentId: z.string(), assigned: z.boolean(), tasks: z.array(taskSchema).min(1) });
const resultSchema = z.object({ id: z.string(), studentId: z.string(), title: z.string().min(1), score, date: z.string() });
const noteSchema = z.object({ id: z.string(), studentId: z.string(), author: z.string(), message: z.string().min(1), date: z.string(), acknowledged: z.boolean() });
export const storeSchema = z.object({ version: z.literal(1), students: z.array(studentSchema), plans: z.array(planSchema), results: z.array(resultSchema), notes: z.array(noteSchema) });
export type Student = z.infer<typeof studentSchema>;
export type Plan = z.infer<typeof planSchema>;
export type Result = z.infer<typeof resultSchema>;
export type Note = z.infer<typeof noteSchema>;
export type Store = z.infer<typeof storeSchema>;
export const STORAGE_KEY = "ssc-revision-role-workspace-v1";

export function createPlan(student: Student): Plan {
  return { studentId: student.id, assigned: false, tasks: [
    { id: "concept", day: "Day 1", title: `Review ${student.subject} foundations`, minutes: 35, done: false },
    { id: "practice", day: "Day 2", title: "Practice 20 targeted MCQs", minutes: 30, done: false },
    { id: "correction", day: "Day 3", title: "Correct recurring errors", minutes: 25, done: false },
    { id: "assessment", day: "Day 5", title: "Complete a board-style practice paper", minutes: 40, done: false },
    { id: "recall", day: "Day 7", title: "Recall key concepts without notes", minutes: 20, done: false },
  ] };
}

export function initialStore(): Store {
  const names = ["Ayesha Rahman", "Rafi Hasan", "Nabila Islam", "Tanvir Ahmed", "Maliha Akter", "Samiul Karim", "Sadika Noor", "Arif Hossain"];
  const subjects = ["Biology", "Physics", "Chemistry", "Biology", "Physics", "Chemistry", "Biology", "Physics"];
  const pre = [42, 38, 49, 50, 44, 40, 39, 40], post = [62, 51, 71, 58, 59, 50, 61, 55], retention = [60, 45, 68, 49, 52, 46, 57, 50];
  const students: Student[] = names.map((name, i) => ({ id: `SSC-${String(i + 1).padStart(4, "0")}`, name, subject: subjects[i], group: i % 2 ? "Control" : "Experimental", teacherId: subjects[i] === "Biology" ? "teacher-1" : "teacher-2", studentUserId: `student-${i + 1}`, parentUserId: `parent-${i + 1}`, pre: pre[i], post: post[i], retention: retention[i] }));
  return {
    version: 1, students,
    plans: students.map((student, i) => ({ ...createPlan(student), assigned: i !== 3, tasks: createPlan(student).tasks.map((task, j) => ({ ...task, done: i !== 3 && j < (i % 3) + 1 })) })),
    results: students.flatMap(student => [
      { id: `${student.id}-baseline`, studentId: student.id, title: "Baseline assessment", score: student.pre, date: "2026-09-01" },
      { id: `${student.id}-review`, studentId: student.id, title: "Revision assessment", score: student.post, date: "2026-09-08" },
    ]),
    notes: [{ id: "welcome-note", studentId: students[0].id, author: "Fahad Rahman", message: "Ayesha is improving in Biology. Please set aside 20 minutes for recall practice and encourage her to complete the assigned revision tasks.", date: "2026-09-09", acknowledged: false }],
  };
}

export function visibleStudents(store: Store, role: Role): Student[] {
  return store.students.filter(student => role === "Admin" || (role === "Teacher" ? student.teacherId === profiles.Teacher.id : role === "Student" ? student.studentUserId === profiles.Student.id : student.parentUserId === profiles.Parent.id));
}
export function completion(plan?: Plan): number {
  return plan?.assigned && plan.tasks.length ? Math.round(plan.tasks.filter(task => task.done).length / plan.tasks.length * 100) : 0;
}
export function scopedStore(store: Store, role: Role): Store {
  const students = visibleStudents(store, role), ids = new Set(students.map(student => student.id));
  return { ...store, students, plans: store.plans.filter(plan => ids.has(plan.studentId) && ((role === "Admin" || role === "Teacher") || plan.assigned)), results: store.results.filter(result => ids.has(result.studentId)), notes: role === "Student" ? [] : store.notes.filter(note => ids.has(note.studentId)) };
}

export type Action =
  | { type: "assign-teacher"; studentId: string; teacherId: string | null }
  | { type: "record-result"; studentId: string; result: Result }
  | { type: "assign-plan"; studentId: string }
  | { type: "toggle-task"; studentId: string; taskId: string; done: boolean }
  | { type: "add-note"; studentId: string; note: Note }
  | { type: "acknowledge-note"; studentId: string; noteId: string }
  | { type: "import-students"; students: Student[] };

// These checks protect demo workflows. Real accounts need server-side authorization.
export function applyAction(store: Store, role: Role, action: Action): Store {
  if (action.type === "import-students") {
    if (role !== "Admin") throw new Error("Only the administrator can import students.");
    const incoming = z.array(studentSchema).min(1).max(250).parse(action.students);
    if (new Set(incoming.map(s => s.id)).size !== incoming.length) throw new Error("Duplicate student IDs in the CSV.");
    if (incoming.some(student => store.students.some(existing => existing.id === student.id))) throw new Error("A student ID already exists. Use Record result to update an existing learner.");
    // Imported rows cannot manufacture account links or teacher permissions.
    const students = incoming.map(student => ({ ...student, teacherId: null, studentUserId: null, parentUserId: null }));
    return { ...store, students: [...store.students, ...students], plans: [...store.plans, ...students.map(createPlan)], results: [...store.results, ...students.map(student => ({ id: `import-${student.id}`, studentId: student.id, title: "Imported assessment", score: student.post, date: new Date().toISOString().slice(0, 10) }))] };
  }
  const student = visibleStudents(store, role).find(row => row.id === action.studentId);
  if (!student) throw new Error("This learner is not assigned to your profile.");
  if (action.type === "assign-teacher") {
    if (role !== "Admin" || (action.teacherId !== null && !teachers.some(teacher => teacher.id === action.teacherId))) throw new Error("Only the administrator can assign a listed teacher.");
    return { ...store, students: store.students.map(row => row.id === student.id ? { ...row, teacherId: action.teacherId as Student["teacherId"] } : row) };
  }
  if (action.type === "record-result") {
    if (role !== "Admin" && role !== "Teacher") throw new Error("Only staff can record results.");
    const result = resultSchema.parse(action.result);
    if (result.studentId !== student.id || store.results.some(row => row.id === result.id)) throw new Error("Invalid assessment record.");
    return { ...store, students: store.students.map(row => row.id === student.id ? { ...row, post: result.score } : row), results: [...store.results, result] };
  }
  if (action.type === "assign-plan") {
    if (role !== "Teacher") throw new Error("Only the assigned teacher can publish revision plans.");
    const plan = store.plans.find(row => row.studentId === student.id) ?? createPlan(student);
    return { ...store, plans: [...store.plans.filter(row => row.studentId !== student.id), { ...plan, assigned: true }] };
  }
  if (action.type === "toggle-task") {
    if (role !== "Student") throw new Error("Only the student can update their tasks.");
    const plan = store.plans.find(row => row.studentId === student.id);
    if (!plan?.assigned || !plan.tasks.some(task => task.id === action.taskId)) throw new Error("This task is not assigned.");
    return { ...store, plans: store.plans.map(row => row.studentId === student.id ? { ...row, tasks: row.tasks.map(task => task.id === action.taskId ? { ...task, done: action.done } : task) } : row) };
  }
  if (action.type === "add-note") {
    if (role !== "Teacher") throw new Error("Only the assigned teacher can write parent updates.");
    const note = noteSchema.parse(action.note);
    if (note.studentId !== student.id || !note.message.trim() || note.message.length > 1000 || store.notes.some(row => row.id === note.id)) throw new Error("Enter a valid update of up to 1,000 characters.");
    return { ...store, notes: [{ ...note, message: note.message.trim(), author: profiles.Teacher.name, acknowledged: false }, ...store.notes] };
  }
  if (role !== "Parent" || !store.notes.some(note => note.id === action.noteId && note.studentId === student.id)) throw new Error("Only the linked parent can acknowledge this update.");
  return { ...store, notes: store.notes.map(note => note.id === action.noteId ? { ...note, acknowledged: true } : note) };
}

function csvRows(text: string): string[][] {
  const rows: string[][] = []; let row: string[] = [], cell = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') { if (quoted && text[i + 1] === '"') { cell += '"'; i++; } else quoted = !quoted; }
    else if (char === "," && !quoted) { row.push(cell.trim()); cell = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) { if (char === "\r" && text[i + 1] === "\n") i++; row.push(cell.trim()); if (row.some(Boolean)) rows.push(row); row = []; cell = ""; }
    else cell += char;
  }
  if (quoted) throw new Error("The CSV contains an unclosed quote.");
  row.push(cell.trim()); if (row.some(Boolean)) rows.push(row); return rows;
}
export function parseStudentsCsv(text: string): Student[] {
  const [headers, ...rows] = csvRows(text.replace(/^\uFEFF/, ""));
  const required = ["Student_ID", "Subject", "Pre_Test_Percent", "Post_Test_Percent", "Retention_Test_Percent"];
  if (!headers || required.some(header => !headers.includes(header))) throw new Error(`CSV headers must include: ${required.join(", ")}.`);
  if (!rows.length || rows.length > 250) throw new Error("Import between 1 and 250 students at a time.");
  return rows.map((row, index) => {
    const get = (name: string) => row[headers.indexOf(name)] ?? "";
    const number = (name: string) => { const value = get(name); if (!value || !Number.isFinite(Number(value)) || Number(value) < 0 || Number(value) > 100) throw new Error(`Row ${index + 2}: ${name} must be between 0 and 100.`); return Number(value); };
    if (!get("Student_ID") || !get("Subject")) throw new Error(`Row ${index + 2}: student ID and subject are required.`);
    return { id: get("Student_ID"), name: get("Name") || get("Student_ID"), subject: get("Subject"), group: get("Group") || "Imported", teacherId: null, studentUserId: null, parentUserId: null, pre: number("Pre_Test_Percent"), post: number("Post_Test_Percent"), retention: number("Retention_Test_Percent") };
  });
}
export function studentsCsv(students: Student[]): string {
  const escape = (value: string | number) => `"${String(value).replace(/^[=+@\-\t\r]/, "'$&").replaceAll('"', '""')}"`;
  return ["Student_ID,Name,Group,Subject,Pre_Test_Percent,Post_Test_Percent,Retention_Test_Percent", ...students.map(student => [student.id, student.name, student.group, student.subject, student.pre, student.post, student.retention].map(escape).join(","))].join("\r\n");
}
