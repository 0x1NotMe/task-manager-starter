import { pgTable, text, timestamp, varchar, bigint } from "drizzle-orm/pg-core";
import { lifecycleDates } from "./util/lifecycle-dates";
import { newId } from "@repo/id";

export const users = pgTable("users", {
  userId: varchar("user_id", { length: 128 }).primaryKey(),
  // Add more clerk fields you want to sync here
  email: text("email").notNull(),
  ...lifecycleDates,
});

export const posts = pgTable("posts", {
  id: varchar("id", { length: 255 }).primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  userId: varchar("user_id", { length: 128 })
    .notNull()
    .references(() => users.userId),
  ...lifecycleDates,
});

export const userTasks = pgTable("user_tasks", {
  id: varchar("id", { length: 255 })
    .primaryKey()
    .$defaultFn(() => newId("user_task")),
  userAddress: text("user_address").notNull(),
  taskId: text("task_id").notNull(),
  blockNumber: bigint("block_number", { mode: "number" }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
