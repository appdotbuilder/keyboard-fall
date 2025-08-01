
import { serial, text, pgTable, timestamp, numeric, integer, jsonb, boolean } from 'drizzle-orm/pg-core';

// Character set type for JSONB storage
export interface CharacterSetConfig {
  lowercase: boolean;
  uppercase: boolean;
  numbers: boolean;
  special: boolean;
  russian: boolean;
  english: boolean;
}

export const gameSettingsTable = pgTable('game_settings', {
  id: serial('id').primaryKey(),
  player_name: text('player_name').notNull(),
  character_set: jsonb('character_set').$type<CharacterSetConfig>().notNull(),
  initial_fall_speed: numeric('initial_fall_speed', { precision: 4, scale: 2 }).notNull().default('1.0'),
  speed_increase_rate: numeric('speed_increase_rate', { precision: 4, scale: 2 }).notNull().default('0.1'),
  max_explosions: integer('max_explosions').notNull().default(10),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

export const highScoresTable = pgTable('high_scores', {
  id: serial('id').primaryKey(),
  player_name: text('player_name').notNull(),
  score: integer('score').notNull().default(0),
  letters_typed: integer('letters_typed').notNull().default(0),
  letters_missed: integer('letters_missed').notNull().default(0),
  game_duration: numeric('game_duration', { precision: 8, scale: 2 }).notNull(), // in seconds
  character_set: jsonb('character_set').$type<CharacterSetConfig>().notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// TypeScript types for the table schemas
export type GameSettings = typeof gameSettingsTable.$inferSelect;
export type NewGameSettings = typeof gameSettingsTable.$inferInsert;
export type HighScore = typeof highScoresTable.$inferSelect;
export type NewHighScore = typeof highScoresTable.$inferInsert;

// Export all tables for proper query building
export const tables = { 
  gameSettings: gameSettingsTable,
  highScores: highScoresTable 
};
