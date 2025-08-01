
import { db } from '../db';
import { gameSettingsTable } from '../db/schema';
import { type GameSettings } from '../schema';
import { desc } from 'drizzle-orm';

export const getAllGameSettings = async (): Promise<GameSettings[]> => {
  try {
    const results = await db.select()
      .from(gameSettingsTable)
      .orderBy(desc(gameSettingsTable.created_at))
      .execute();

    // Convert numeric fields back to numbers for schema compliance
    return results.map(settings => ({
      ...settings,
      initial_fall_speed: parseFloat(settings.initial_fall_speed),
      speed_increase_rate: parseFloat(settings.speed_increase_rate)
    }));
  } catch (error) {
    console.error('Failed to fetch game settings:', error);
    throw error;
  }
};
