import { sql } from "drizzle-orm";
import { index, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const learners = sqliteTable("learners", {
  id: text("id").primaryKey(),
  groupName: text("group_name").notNull(),
  subject: text("subject").notNull(),
  preScore: real("pre_score").notNull(),
  postScore: real("post_score").notNull(),
  retentionScore: real("retention_score").notNull(),
  completion: real("completion").notNull().default(0),
  learningGap: real("learning_gap").notNull().default(0),
  ownerId: text("owner_id"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
}, (table) => [index("idx_learners_subject_group").on(table.subject, table.groupName)]);

export const revisionPlans = sqliteTable("revision_plans", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  learnerId: text("learner_id").notNull().references(() => learners.id),
  planJson: text("plan_json").notNull(),
  status: text("status").notNull().default("draft"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
}, (table) => [index("idx_revision_plans_learner_id").on(table.learnerId)]);
