
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { gameSettingsTable } from '../db/schema';
import { type CreateGameSettingsInput } from '../schema';
import { getGameSettings } from '../handlers/get_game_settings';

const testInput: CreateGameSettingsInput = {
  player_name: 'Test Player',
  character_set: {
    lowercase: true,
    uppercase: false,
    numbers: true,
    special: false,
    russian: false,
    english: true
  },
  initial_fall_speed: 1.5,
  speed_increase_rate: 0.2,
  max_explosions: 15
};

describe('getGameSettings', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return game settings when they exist', async () => {
    // Create test settings
    const insertResult = await db.insert(gameSettingsTable)
      .values({
        player_name: testInput.player_name,
        character_set: testInput.character_set,
        initial_fall_speed: testInput.initial_fall_speed!.toString(),
        speed_increase_rate: testInput.speed_increase_rate!.toString(),
        max_explosions: testInput.max_explosions!
      })
      .returning()
      .execute();

    const insertedId = insertResult[0].id;

    // Get the settings
    const result = await getGameSettings(insertedId);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(insertedId);
    expect(result!.player_name).toEqual('Test Player');
    expect(result!.character_set).toEqual(testInput.character_set);
    expect(result!.initial_fall_speed).toEqual(1.5);
    expect(typeof result!.initial_fall_speed).toBe('number');
    expect(result!.speed_increase_rate).toEqual(0.2);
    expect(typeof result!.speed_increase_rate).toBe('number');
    expect(result!.max_explosions).toEqual(15);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when settings do not exist', async () => {
    const result = await getGameSettings(999);

    expect(result).toBeNull();
  });

  it('should handle default values correctly', async () => {
    // Create settings with default values
    const insertResult = await db.insert(gameSettingsTable)
      .values({
        player_name: 'Default Player',
        character_set: {
          lowercase: true,
          uppercase: false,
          numbers: false,
          special: false,
          russian: false,
          english: true
        }
        // Let defaults apply for other fields
      })
      .returning()
      .execute();

    const insertedId = insertResult[0].id;

    const result = await getGameSettings(insertedId);

    expect(result).not.toBeNull();
    expect(result!.initial_fall_speed).toEqual(1.0);
    expect(typeof result!.initial_fall_speed).toBe('number');
    expect(result!.speed_increase_rate).toEqual(0.1);
    expect(typeof result!.speed_increase_rate).toBe('number');
    expect(result!.max_explosions).toEqual(10);
  });
});
