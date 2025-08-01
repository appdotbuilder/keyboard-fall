
import { db } from '../db';
import { gameSettingsTable } from '../db/schema';
import { type UpdateGameSettingsInput, type GameSettings } from '../schema';
import { eq } from 'drizzle-orm';

export const updateGameSettings = async (input: UpdateGameSettingsInput): Promise<GameSettings> => {
  try {
    // Build update object with only provided fields
    const updateData: any = {};
    
    if (input.player_name !== undefined) {
      updateData.player_name = input.player_name;
    }
    
    if (input.character_set !== undefined) {
      updateData.character_set = input.character_set;
    }
    
    if (input.initial_fall_speed !== undefined) {
      updateData.initial_fall_speed = input.initial_fall_speed.toString();
    }
    
    if (input.speed_increase_rate !== undefined) {
      updateData.speed_increase_rate = input.speed_increase_rate.toString();
    }
    
    if (input.max_explosions !== undefined) {
      updateData.max_explosions = input.max_explosions;
    }
    
    // Always update the updated_at timestamp
    updateData.updated_at = new Date();

    // Update the game settings record
    const result = await db.update(gameSettingsTable)
      .set(updateData)
      .where(eq(gameSettingsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Game settings with id ${input.id} not found`);
    }

    // Convert numeric fields back to numbers before returning
    const gameSettings = result[0];
    return {
      ...gameSettings,
      initial_fall_speed: parseFloat(gameSettings.initial_fall_speed),
      speed_increase_rate: parseFloat(gameSettings.speed_increase_rate)
    } as GameSettings;
  } catch (error) {
    console.error('Game settings update failed:', error);
    throw error;
  }
};
