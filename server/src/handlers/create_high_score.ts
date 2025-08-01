
import { db } from '../db';
import { highScoresTable } from '../db/schema';
import { type CreateHighScoreInput, type HighScore } from '../schema';

export const createHighScore = async (input: CreateHighScoreInput): Promise<HighScore> => {
  try {
    // Insert high score record
    const result = await db.insert(highScoresTable)
      .values({
        player_name: input.player_name,
        score: input.score,
        letters_typed: input.letters_typed,
        letters_missed: input.letters_missed,
        game_duration: input.game_duration.toString(), // Convert number to string for numeric column
        character_set: input.character_set // JSONB column - no conversion needed
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const highScore = result[0];
    return {
      ...highScore,
      game_duration: parseFloat(highScore.game_duration) // Convert string back to number
    };
  } catch (error) {
    console.error('High score creation failed:', error);
    throw error;
  }
};
