CREATE TABLE `kv` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `routine_events` (
	`local_id` text PRIMARY KEY NOT NULL,
	`remote_id` text,
	`title` text NOT NULL,
	`description` text,
	`start_time` text NOT NULL,
	`end_time` text,
	`days_of_week` text,
	`event_date` text,
	`event_type` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`user_id` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`sync_status` text DEFAULT 'synced' NOT NULL,
	`last_synced_at` text,
	`sync_error` text,
	`sync_attempts` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `routine_events_remote_id_idx` ON `routine_events` (`remote_id`);--> statement-breakpoint
CREATE INDEX `routine_events_sync_status_idx` ON `routine_events` (`sync_status`);--> statement-breakpoint
CREATE INDEX `routine_events_event_date_idx` ON `routine_events` (`event_date`);--> statement-breakpoint
CREATE INDEX `routine_events_updated_at_idx` ON `routine_events` (`updated_at`);--> statement-breakpoint
CREATE INDEX `routine_events_user_id_idx` ON `routine_events` (`user_id`);