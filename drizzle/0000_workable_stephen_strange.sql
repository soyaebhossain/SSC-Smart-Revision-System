CREATE TABLE `learners` (
	`id` text PRIMARY KEY NOT NULL,
	`group_name` text NOT NULL,
	`subject` text NOT NULL,
	`pre_score` real NOT NULL,
	`post_score` real NOT NULL,
	`retention_score` real NOT NULL,
	`completion` real DEFAULT 0 NOT NULL,
	`learning_gap` real DEFAULT 0 NOT NULL,
	`owner_id` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_learners_subject_group` ON `learners` (`subject`,`group_name`);--> statement-breakpoint
CREATE TABLE `revision_plans` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`learner_id` text NOT NULL,
	`plan_json` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`learner_id`) REFERENCES `learners`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_revision_plans_learner_id` ON `revision_plans` (`learner_id`);