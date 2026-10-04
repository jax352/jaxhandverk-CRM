import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
export const customers = sqliteTable('customers', {
 id:text('id').primaryKey(),name:text('name').notNull(),contact:text('contact').notNull().default(''),classification:text('classification').notNull().default(''),email:text('email').notNull().default(''),phone:text('phone').notNull().default(''),status:text('status').notNull().default('Nýr'),notes:text('notes').notNull().default(''),created:text('created').notNull(),
});
export const interactions = sqliteTable('interactions', {id:text('id').primaryKey(),customerId:text('customer_id').notNull().references(()=>customers.id),kind:text('kind').notNull(),sold:integer('sold').notNull().default(0),body:text('body').notNull(),created:text('created').notNull()},t=>[index('idx_interactions_customer').on(t.customerId)]);
export const tasks = sqliteTable('tasks', {id:text('id').primaryKey(),customerId:text('customer_id').notNull().references(()=>customers.id),title:text('title').notNull(),due:text('due').notNull(),done:integer('done').notNull().default(0),created:text('created').notNull()},t=>[index('idx_tasks_customer').on(t.customerId)]);
