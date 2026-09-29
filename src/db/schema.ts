import { pgTable, serial, varchar, text, integer, timestamp, boolean } from "drizzle-orm/pg-core";

export const members = pgTable("members", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  email: varchar("email", { length: 180 }).notNull().unique(),
  role: varchar("role", { length: 30 }).notNull().default("member"),
  title: varchar("title", { length: 120 }).notNull(),
  color: varchar("color", { length: 30 }).notNull(),
  initials: varchar("initials", { length: 4 }).notNull(),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 240 }).notNull(),
  description: text("description").notNull().default(""),
  status: varchar("status", { length: 30 }).notNull().default("todo"),
  priority: varchar("priority", { length: 30 }).notNull().default("medium"),
  category: varchar("category", { length: 80 }).notNull().default("Design"),
  assigneeId: integer("assignee_id").references(() => members.id),
  dueDate: varchar("due_date", { length: 10 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const milestones = pgTable("milestones", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 180 }).notNull(),
  description: varchar("description", { length: 240 }).notNull(),
  dueDate: varchar("due_date", { length: 10 }).notNull(),
  status: varchar("status", { length: 30 }).notNull().default("upcoming"),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  message: text("message").notNull(),
  type: varchar("type", { length: 30 }).notNull(),
  recipientId: integer("recipient_id").references(() => members.id),
  taskId: integer("task_id").references(() => tasks.id),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
