
import { db } from '../db';
import { gameSettingsTable } from '../db/schema';
import { type GameSettings } from '../schema';
import { eq } from 'drizzle-orm';

export const getGameSettings = async (playerId: number): Promise<GameSettings | null> => {
  try {
    const results = await db.select()
      .from(gameSettingsTable)
      .where(eq(gameSettingsTable.id, playerId))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const settings = results[0];
    return {
      ...settings,
      initial_fall_speed: parseFloat(settings.initial_fall_speed),
      speed_increase_rate: parseFloat(settings.speed_increase_rate)
    };
  } catch (error) {
    console.error('Get game settings failed:', error);
    throw error;
  }
};
