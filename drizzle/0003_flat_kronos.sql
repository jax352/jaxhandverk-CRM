CREATE TABLE `employees` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`active` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
ALTER TABLE `customers` ADD `owner_id` text REFERENCES employees(id);--> statement-breakpoint
ALTER TABLE `interactions` ADD `owner_id` text REFERENCES employees(id);--> statement-breakpoint
ALTER TABLE `tasks` ADD `owner_id` text REFERENCES employees(id);