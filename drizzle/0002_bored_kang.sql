CREATE TABLE `habit_logs` (
	`local_id` text PRIMARY KEY NOT NULL,
	`remote_id` text,
	`habit_local_id` text NOT NULL,
	`habit_remote_id` text,
	`target_date` text NOT NULL,
	`status` text NOT NULL,
	`completed_at` text,
	`notes` text,
	`earned_xp` integer DEFAULT 0 NOT NULL,
	`user_id` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`sync_status` text DEFAULT 'synced' NOT NULL,
	`last_synced_at` text,
	`sync_error` text,
	`sync_attempts` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `habit_logs_remote_id_idx` ON `habit_logs` (`remote_id`);--> statement-breakpoint
CREATE INDEX `habit_logs_sync_status_idx` ON `habit_logs` (`sync_status`);--> statement-breakpoint
CREATE INDEX `habit_logs_habit_local_idx` ON `habit_logs` (`habit_local_id`);--> statement-breakpoint
CREATE INDEX `habit_logs_target_date_idx` ON `habit_logs` (`target_date`);--> statement-breakpoint
CREATE INDEX `habit_logs_user_id_idx` ON `habit_logs` (`user_id`);--> statement-breakpoint
CREATE INDEX `habit_logs_updated_at_idx` ON `habit_logs` (`updated_at`);--> statement-breakpoint
CREATE TABLE `habits` (
	`local_id` text PRIMARY KEY NOT NULL,
	`remote_id` text,
	`title` text NOT NULL,
	`description` text,
	`icon` text DEFAULT '' NOT NULL,
	`color` text NOT NULL,
	`frequency_type` text NOT NULL,
	`target_value` integer DEFAULT 1 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`linked_routine_event_ids` text,
	`user_id` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`sync_status` text DEFAULT 'synced' NOT NULL,
	`last_synced_at` text,
	`sync_error` text,
	`sync_attempts` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `habits_remote_id_idx` ON `habits` (`remote_id`);--> statement-breakpoint
CREATE INDEX `habits_sync_status_idx` ON `habits` (`sync_status`);--> statement-breakpoint
CREATE INDEX `habits_user_id_idx` ON `habits` (`user_id`);--> statement-breakpoint
CREATE INDEX `habits_updated_at_idx` ON `habits` (`updated_at`);