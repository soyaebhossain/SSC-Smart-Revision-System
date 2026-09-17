import test from "node:test";
import assert from "node:assert/strict";
import { applyAction, completion, initialStore, navigation, parseStudentsCsv, scopedStore, storeSchema, studentsCsv } from "../lib/revision-store.ts";

test("each role receives only its learners and related records", () => {
  const store = initialStore();
  for (const [role, expected] of [["Admin", 8], ["Teacher", 3], ["Student", 1], ["Parent", 1]]) {
    const view = scopedStore(store, role);
    assert.equal(view.students.length, expected);
    const ids = new Set(view.students.map(s => s.id));
    for (const record of [...view.plans, ...view.results, ...view.notes]) assert.ok(ids.has(record.studentId));
  }
  assert.equal(scopedStore(store, "Student").notes.length, 0);
  assert.equal(navigation.Student.some(item => item.id === "students"), false);
  assert.equal(navigation.Parent.some(item => item.id === "assignments"), false);
});

test("results flow from assigned teacher to student and parent; other roles cannot write", () => {
  const store = initialStore();
  const action = { type: "record-result", studentId: "SSC-0001", result: { id: "test-result", studentId: "SSC-0001", title: "Weekly test", score: 84, date: "2026-09-17" } };
  for (const role of ["Student", "Parent"]) assert.throws(() => applyAction(store, role, action));
  assert.throws(() => applyAction(store, "Teacher", { ...action, studentId: "SSC-0002", result: { ...action.result, studentId: "SSC-0002" } }));
  assert.throws(() => applyAction(store, "Teacher", { ...action, result: { ...action.result, score: 101 } }));
  const updated = applyAction(store, "Teacher", action);
  for (const role of ["Student", "Parent"]) {
    const view = scopedStore(updated, role);
    assert.equal(view.students[0].post, 84);
    assert.equal(view.results.at(-1).score, 84);
  }
  assert.equal(store.students[0].post, 62);
});

test("only the linked learner can complete assigned tasks and progress is shared", () => {
  const store = initialStore();
  const action = { type: "toggle-task", studentId: "SSC-0001", taskId: "practice", done: true };
  for (const role of ["Admin", "Teacher", "Parent"]) assert.throws(() => applyAction(store, role, action));
  assert.throws(() => applyAction(store, "Student", { ...action, studentId: "SSC-0002" }));
  const updated = applyAction(store, "Student", action);
  assert.equal(completion(scopedStore(updated, "Parent").plans[0]), 40);
  const draftStore = { ...store, plans: store.plans.map(plan => ({ ...plan, assigned: false })) };
  assert.equal(scopedStore(draftStore, "Student").plans.length, 0);
  assert.throws(() => applyAction(draftStore, "Student", action));
  const published = applyAction(draftStore, "Teacher", { type: "assign-plan", studentId: "SSC-0001" });
  assert.equal(scopedStore(published, "Student").plans.length, 1);
});

test("teacher reassignment immediately changes access including write access", () => {
  const store = initialStore();
  const action = { type: "assign-teacher", studentId: "SSC-0001", teacherId: "teacher-2" };
  assert.throws(() => applyAction(store, "Teacher", action));
  const updated = applyAction(store, "Admin", action);
  assert.equal(scopedStore(updated, "Teacher").students.length, 2);
  assert.throws(() => applyAction(updated, "Teacher", { type: "assign-plan", studentId: "SSC-0001" }));
  assert.equal(scopedStore(updated, "Student").students.length, 1);
});

test("teacher updates reach only the linked parent and acknowledgements persist", () => {
  const note = { id: "new-note", studentId: "SSC-0001", message: "Practice Biology for 20 minutes.", author: "Fahad Rahman", date: "2026-09-17", acknowledged: false };
  const store = applyAction(initialStore(), "Teacher", { type: "add-note", studentId: note.studentId, note });
  assert.equal(scopedStore(store, "Parent").notes[0].message, note.message);
  const action = { type: "acknowledge-note", studentId: note.studentId, noteId: note.id };
  assert.throws(() => applyAction(store, "Student", action));
  const updated = applyAction(store, "Parent", action);
  assert.equal(scopedStore(updated, "Teacher").notes[0].acknowledged, true);
  assert.deepEqual(storeSchema.parse(JSON.parse(JSON.stringify(updated))), updated);
});

test("CSV validates scores, handles quoted names, preserves existing links, and limits import to admin", () => {
  const store = initialStore();
  const source = studentsCsv([{ ...store.students[0], id: "NEW-001", name: 'Ayesha, "A"' }]);
  const students = parseStudentsCsv(source);
  assert.equal(students[0].name, 'Ayesha, "A"');
  assert.throws(() => parseStudentsCsv(source.replace('"62"', '"101"')));
  assert.throws(() => parseStudentsCsv("Student_ID,Subject\nx,Biology"));
  assert.throws(() => applyAction(store, "Teacher", { type: "import-students", students }));
  assert.throws(() => applyAction(store, "Admin", { type: "import-students", students: [store.students[0]] }));
  const updated = applyAction(store, "Admin", { type: "import-students", students });
  assert.equal(updated.students.length, 9);
  assert.equal(scopedStore(updated, "Student").students[0].studentUserId, "student-1");
  assert.equal(scopedStore(updated, "Teacher").students.length, 3);
  assert.equal(updated.students.at(-1).teacherId, null);
});
