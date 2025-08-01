
import { z } from 'zod';

// Character set configuration schema
export const characterSetSchema = z.object({
  lowercase: z.boolean().default(true),
  uppercase: z.boolean().default(false),
  numbers: z.boolean().default(false),
  special: z.boolean().default(false),
  russian: z.boolean().default(false),
  english: z.boolean().default(true)
});

export type CharacterSet = z.infer<typeof characterSetSchema>;

// Game settings schema
export const gameSettingsSchema = z.object({
  id: z.number(),
  player_name: z.string(),
  character_set: characterSetSchema,
  initial_fall_speed: z.number().positive().default(1.0),
  speed_increase_rate: z.number().positive().default(0.1),
  max_explosions: z.number().int().positive().default(10),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type GameSettings = z.infer<typeof gameSettingsSchema>;

// High score schema
export const highScoreSchema = z.object({
  id: z.number(),
  player_name: z.string(),
  score: z.number().int().nonnegative(),
  letters_typed: z.number().int().nonnegative(),
  letters_missed: z.number().int().nonnegative(),
  game_duration: z.number().nonnegative(), // in seconds
  character_set: characterSetSchema,
  created_at: z.coerce.date()
});

export type HighScore = z.infer<typeof highScoreSchema>;

// Input schemas for creating/updating
export const createGameSettingsInputSchema = z.object({
  player_name: z.string().min(1).max(50),
  character_set: characterSetSchema,
  initial_fall_speed: z.number().positive().optional(),
  speed_increase_rate: z.number().positive().optional(),
  max_explosions: z.number().int().positive().optional()
});

export type CreateGameSettingsInput = z.infer<typeof createGameSettingsInputSchema>;

export const updateGameSettingsInputSchema = z.object({
  id: z.number(),
  player_name: z.string().min(1).max(50).optional(),
  character_set: characterSetSchema.optional(),
  initial_fall_speed: z.number().positive().optional(),
  speed_increase_rate: z.number().positive().optional(),
  max_explosions: z.number().int().positive().optional()
});

export type UpdateGameSettingsInput = z.infer<typeof updateGameSettingsInputSchema>;

export const createHighScoreInputSchema = z.object({
  player_name: z.string().min(1).max(50),
  score: z.number().int().nonnegative(),
  letters_typed: z.number().int().nonnegative(),
  letters_missed: z.number().int().nonnegative(),
  game_duration: z.number().nonnegative(),
  character_set: characterSetSchema
});

export type CreateHighScoreInput = z.infer<typeof createHighScoreInputSchema>;

// Get high scores query schema
export const getHighScoresInputSchema = z.object({
  limit: z.number().int().positive().max(100).optional().default(10),
  player_name: z.string().optional()
});

export type GetHighScoresInput = z.infer<typeof getHighScoresInputSchema>;
