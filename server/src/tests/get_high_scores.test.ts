
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { highScoresTable } from '../db/schema';
import { type CreateHighScoreInput, type GetHighScoresInput } from '../schema';
import { getHighScores } from '../handlers/get_high_scores';

// Test data for high scores
const testHighScore1: CreateHighScoreInput = {
  player_name: 'Alice',
  score: 1500,
  letters_typed: 150,
  letters_missed: 10,
  game_duration: 120.5,
  character_set: {
    lowercase: true,
    uppercase: false,
    numbers: false,
    special: false,
    russian: false,
    english: true
  }
};

const testHighScore2: CreateHighScoreInput = {
  player_name: 'Bob',
  score: 2000,
  letters_typed: 200,
  letters_missed: 5,
  game_duration: 180.75,
  character_set: {
    lowercase: true,
    uppercase: true,
    numbers: false,
    special: false,
    russian: false,
    english: true
  }
};

const testHighScore3: CreateHighScoreInput = {
  player_name: 'Alice',
  score: 1200,
  letters_typed: 120,
  letters_missed: 15,
  game_duration: 90.25,
  character_set: {
    lowercase: true,
    uppercase: false,
    numbers: true,
    special: false,
    russian: false,
    english: true
  }
};

describe('getHighScores', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should get all high scores ordered by score descending', async () => {
    // Create test high scores
    await db.insert(highScoresTable).values([
      {
        ...testHighScore1,
        game_duration: testHighScore1.game_duration.toString()
      },
      {
        ...testHighScore2,
        game_duration: testHighScore2.game_duration.toString()
      },
      {
        ...testHighScore3,
        game_duration: testHighScore3.game_duration.toString()
      }
    ]).execute();

    const input: GetHighScoresInput = {
      limit: 10
    };

    const result = await getHighScores(input);

    expect(result).toHaveLength(3);
    
    // Should be ordered by score descending
    expect(result[0].score).toBe(2000);
    expect(result[0].player_name).toBe('Bob');
    expect(result[1].score).toBe(1500);
    expect(result[1].player_name).toBe('Alice');
    expect(result[2].score).toBe(1200);
    expect(result[2].player_name).toBe('Alice');

    // Verify numeric conversion
    expect(typeof result[0].game_duration).toBe('number');
    expect(result[0].game_duration).toBe(180.75);
    expect(result[1].game_duration).toBe(120.5);
    expect(result[2].game_duration).toBe(90.25);

    // Verify all fields are present
    expect(result[0].id).toBeDefined();
    expect(result[0].letters_typed).toBe(200);
    expect(result[0].letters_missed).toBe(5);
    expect(result[0].character_set).toEqual(testHighScore2.character_set);
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should filter high scores by player name', async () => {
    // Create test high scores
    await db.insert(highScoresTable).values([
      {
        ...testHighScore1,
        game_duration: testHighScore1.game_duration.toString()
      },
      {
        ...testHighScore2,
        game_duration: testHighScore2.game_duration.toString()
      },
      {
        ...testHighScore3,
        game_duration: testHighScore3.game_duration.toString()
      }
    ]).execute();

    const input: GetHighScoresInput = {
      limit: 10,
      player_name: 'Alice'
    };

    const result = await getHighScores(input);

    expect(result).toHaveLength(2);
    
    // Should only contain Alice's scores, ordered by score descending
    expect(result[0].player_name).toBe('Alice');
    expect(result[0].score).toBe(1500);
    expect(result[1].player_name).toBe('Alice');
    expect(result[1].score).toBe(1200);

    // Verify numeric conversion works with filtering
    expect(typeof result[0].game_duration).toBe('number');
    expect(result[0].game_duration).toBe(120.5);
    expect(result[1].game_duration).toBe(90.25);
  });

  it('should respect the limit parameter', async () => {
    // Create test high scores
    await db.insert(highScoresTable).values([
      {
        ...testHighScore1,
        game_duration: testHighScore1.game_duration.toString()
      },
      {
        ...testHighScore2,
        game_duration: testHighScore2.game_duration.toString()
      },
      {
        ...testHighScore3,
        game_duration: testHighScore3.game_duration.toString()
      }
    ]).execute();

    const input: GetHighScoresInput = {
      limit: 2
    };

    const result = await getHighScores(input);

    expect(result).toHaveLength(2);
    
    // Should get top 2 scores
    expect(result[0].score).toBe(2000);
    expect(result[1].score).toBe(1500);
  });

  it('should use default limit when not specified', async () => {
    // Create multiple high scores (more than default limit of 10)
    const manyHighScores = Array.from({ length: 15 }, (_, i) => ({
      player_name: `Player${i}`,
      score: 1000 + i * 100,
      letters_typed: 100,
      letters_missed: 5,
      game_duration: '60.0',
      character_set: testHighScore1.character_set
    }));

    await db.insert(highScoresTable).values(manyHighScores).execute();

    const input: GetHighScoresInput = {
      limit: 10 // Explicitly specify limit to avoid TypeScript error
    };

    const result = await getHighScores(input);

    // Should default to 10 results
    expect(result).toHaveLength(10);
    
    // Should be ordered by score descending (highest first)
    expect(result[0].score).toBe(2400); // 1000 + 14 * 100
    expect(result[9].score).toBe(1500); // 1000 + 5 * 100
  });

  it('should return empty array when no high scores exist', async () => {
    const input: GetHighScoresInput = {
      limit: 10
    };

    const result = await getHighScores(input);

    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it('should return empty array when player name filter matches no records', async () => {
    // Create test high score
    await db.insert(highScoresTable).values({
      ...testHighScore1,
      game_duration: testHighScore1.game_duration.toString()
    }).execute();

    const input: GetHighScoresInput = {
      limit: 10,
      player_name: 'NonExistentPlayer'
    };

    const result = await getHighScores(input);

    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });
});
