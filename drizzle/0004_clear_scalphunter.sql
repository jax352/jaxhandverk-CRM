CREATE TABLE `customer_products` (
	`customer_id` text NOT NULL,
	`product_id` text NOT NULL,
	PRIMARY KEY(`customer_id`, `product_id`),
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `invoice_lines` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text NOT NULL,
	`date` text DEFAULT '' NOT NULL,
	`invoice_number` text DEFAULT '' NOT NULL,
	`category` text DEFAULT '' NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`quantity` real,
	`unit_price` real,
	`total_with_vat` real,
	`total_without_vat` real,
	`discount` text DEFAULT '' NOT NULL,
	`status` text DEFAULT '' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`payday_url` text DEFAULT '' NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_invoice_lines_customer` ON `invoice_lines` (`customer_id`);--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_products_name` ON `products` (`name`);--> statement-breakpoint
ALTER TABLE `customers` ADD `address` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `customers` ADD `national_id` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `customers` ADD `invoice_numbers` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `customers` ADD `purchase_notes` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `customers` ADD `payday_url` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `customers` ADD `source_key` text;--> statement-breakpoint
CREATE UNIQUE INDEX `idx_customers_source_key` ON `customers` (`source_key`);