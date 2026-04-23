ALTER TABLE `routine_events` DROP COLUMN `is_active`;
--> statement-breakpoint
ALTER TABLE `routine_events` ADD COLUMN `color` text;
