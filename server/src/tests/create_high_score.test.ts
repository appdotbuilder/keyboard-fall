
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { highScoresTable } from '../db/schema';
import { type CreateHighScoreInput } from '../schema';
import { createHighScore } from '../handlers/create_high_score';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateHighScoreInput = {
  player_name: 'TestPlayer',
  score: 1500,
  letters_typed: 120,
  letters_missed: 8,
  game_duration: 180.5, // 3 minutes and 30 seconds
  character_set: {
    lowercase: true,
    uppercase: false,
    numbers: true,
    special: false,
    russian: false,
    english: true
  }
};

describe('createHighScore', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a high score', async () => {
    const result = await createHighScore(testInput);

    // Basic field validation
    expect(result.player_name).toEqual('TestPlayer');
    expect(result.score).toEqual(1500);
    expect(result.letters_typed).toEqual(120);
    expect(result.letters_missed).toEqual(8);
    expect(result.game_duration).toEqual(180.5);
    expect(typeof result.game_duration).toBe('number'); // Verify numeric conversion
    expect(result.character_set).toEqual(testInput.character_set);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save high score to database', async () => {
    const result = await createHighScore(testInput);

    // Query using proper drizzle syntax
    const highScores = await db.select()
      .from(highScoresTable)
      .where(eq(highScoresTable.id, result.id))
      .execute();

    expect(highScores).toHaveLength(1);
    const savedScore = highScores[0];
    expect(savedScore.player_name).toEqual('TestPlayer');
    expect(savedScore.score).toEqual(1500);
    expect(savedScore.letters_typed).toEqual(120);
    expect(savedScore.letters_missed).toEqual(8);
    expect(parseFloat(savedScore.game_duration)).toEqual(180.5); // Convert from DB string
    expect(savedScore.character_set).toEqual(testInput.character_set);
    expect(savedScore.created_at).toBeInstanceOf(Date);
  });

  it('should handle different character set configurations', async () => {
    const russianInput: CreateHighScoreInput = {
      ...testInput,
      player_name: 'RussianPlayer',
      character_set: {
        lowercase: false,
        uppercase: true,
        numbers: false,
        special: true,
        russian: true,
        english: false
      }
    };

    const result = await createHighScore(russianInput);

    expect(result.player_name).toEqual('RussianPlayer');
    expect(result.character_set.russian).toBe(true);
    expect(result.character_set.english).toBe(false);
    expect(result.character_set.uppercase).toBe(true);
    expect(result.character_set.special).toBe(true);
  });

  it('should handle zero values correctly', async () => {
    const zeroInput: CreateHighScoreInput = {
      ...testInput,
      score: 0,
      letters_typed: 0,
      letters_missed: 0,
      game_duration: 0
    };

    const result = await createHighScore(zeroInput);

    expect(result.score).toEqual(0);
    expect(result.letters_typed).toEqual(0);
    expect(result.letters_missed).toEqual(0);
    expect(result.game_duration).toEqual(0);
    expect(typeof result.game_duration).toBe('number');
  });
});
