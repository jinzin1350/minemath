import { sql } from "drizzle-orm";
import { pgTable, varchar, integer, timestamp, decimal, index, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./schema";

// Words table for English dictation
export const dictationWords = pgTable("dictation_words", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  word: varchar("word", { length: 50 }).notNull(),
  level: integer("level").notNull(), // 1-5
  category: varchar("category", { length: 50 }).notNull(),
  imageEmoji: varchar("image_emoji", { length: 10 }),
  pronunciation: varchar("pronunciation", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_dictation_words_level").on(table.level),
  index("idx_dictation_words_category").on(table.category),
]);

// User progress tracking for dictation
export const dictationUserProgress = pgTable("dictation_user_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull().unique(),
  totalScore: integer("total_score").default(0),
  accuracy: decimal("accuracy", { precision: 5, scale: 2 }).default("0.00"),
  currentStreak: integer("current_streak").default(0),
  maxStreak: integer("max_streak").default(0),
  totalWordsPracticed: integer("total_words_practiced").default(0),
  correctWords: integer("correct_words").default(0),
  lastPlayed: timestamp("last_played"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Game history for dictation
export const dictationGameHistory = pgTable("dictation_game_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  gameMode: varchar("game_mode", { length: 20 }).notNull(), // 'typing' or 'multiple-choice'
  score: integer("score").notNull(),
  accuracy: decimal("accuracy", { precision: 5, scale: 2 }),
  levelReached: integer("level_reached"),
  wordsCorrect: integer("words_correct"),
  wordsTotal: integer("words_total"),
  playedAt: timestamp("played_at").defaultNow(),
}, (table) => [
  index("idx_dictation_game_history_user_id").on(table.userId),
  index("idx_dictation_game_history_played_at").on(table.playedAt),
]);

// Zod schemas
export const insertDictationWordSchema = createInsertSchema(dictationWords).omit({
  id: true,
  createdAt: true,
});

export const insertDictationUserProgressSchema = createInsertSchema(dictationUserProgress).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDictationGameHistorySchema = createInsertSchema(dictationGameHistory).omit({
  id: true,
  playedAt: true,
});

// TypeScript types
export type DictationWord = typeof dictationWords.$inferSelect;
export type InsertDictationWord = z.infer<typeof insertDictationWordSchema>;

export type DictationUserProgress = typeof dictationUserProgress.$inferSelect;
export type InsertDictationUserProgress = z.infer<typeof insertDictationUserProgressSchema>;

export type DictationGameHistory = typeof dictationGameHistory.$inferSelect;
export type InsertDictationGameHistory = z.infer<typeof insertDictationGameHistorySchema>;
