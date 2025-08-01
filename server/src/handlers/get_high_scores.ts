
import { db } from '../db';
import { highScoresTable } from '../db/schema';
import { type GetHighScoresInput, type HighScore } from '../schema';
import { eq, desc } from 'drizzle-orm';

export async function getHighScores(input: GetHighScoresInput): Promise<HighScore[]> {
  try {
    // Build the query in one go to avoid TypeScript issues
    const results = input.player_name
      ? await db.select()
          .from(highScoresTable)
          .where(eq(highScoresTable.player_name, input.player_name))
          .orderBy(desc(highScoresTable.score))
          .limit(input.limit)
          .execute()
      : await db.select()
          .from(highScoresTable)
          .orderBy(desc(highScoresTable.score))
          .limit(input.limit)
          .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(result => ({
      ...result,
      game_duration: parseFloat(result.game_duration) // Convert numeric to number
    }));
  } catch (error) {
    console.error('Get high scores failed:', error);
    throw error;
  }
}
