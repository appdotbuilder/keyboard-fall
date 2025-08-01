
import { db } from '../db';
import { gameSettingsTable } from '../db/schema';
import { type CreateGameSettingsInput, type GameSettings } from '../schema';

export const createGameSettings = async (input: CreateGameSettingsInput): Promise<GameSettings> => {
  try {
    // Insert game settings record
    const result = await db.insert(gameSettingsTable)
      .values({
        player_name: input.player_name,
        character_set: input.character_set,
        initial_fall_speed: input.initial_fall_speed?.toString() || '1.0',
        speed_increase_rate: input.speed_increase_rate?.toString() || '0.1',
        max_explosions: input.max_explosions || 10
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const gameSettings = result[0];
    return {
      ...gameSettings,
      initial_fall_speed: parseFloat(gameSettings.initial_fall_speed),
      speed_increase_rate: parseFloat(gameSettings.speed_increase_rate)
    };
  } catch (error) {
    console.error('Game settings creation failed:', error);
    throw error;
  }
};
