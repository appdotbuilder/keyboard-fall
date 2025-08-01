
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { gameSettingsTable } from '../db/schema';
import { type CreateGameSettingsInput, type UpdateGameSettingsInput } from '../schema';
import { updateGameSettings } from '../handlers/update_game_settings';
import { eq } from 'drizzle-orm';

// Test input for creating initial game settings
const testCreateInput: CreateGameSettingsInput = {
  player_name: 'TestPlayer',
  character_set: {
    lowercase: true,
    uppercase: false,
    numbers: false,
    special: false,
    russian: false,
    english: true
  },
  initial_fall_speed: 1.5,
  speed_increase_rate: 0.2,
  max_explosions: 15
};

describe('updateGameSettings', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update game settings', async () => {
    // Create initial game settings
    const createResult = await db.insert(gameSettingsTable)
      .values({
        player_name: testCreateInput.player_name,
        character_set: testCreateInput.character_set,
        initial_fall_speed: testCreateInput.initial_fall_speed!.toString(),
        speed_increase_rate: testCreateInput.speed_increase_rate!.toString(),
        max_explosions: testCreateInput.max_explosions!
      })
      .returning()
      .execute();

    const gameSettingsId = createResult[0].id;

    // Update input
    const updateInput: UpdateGameSettingsInput = {
      id: gameSettingsId,
      player_name: 'UpdatedPlayer',
      character_set: {
        lowercase: true,
        uppercase: true,
        numbers: true,
        special: false,
        russian: false,
        english: true
      },
      initial_fall_speed: 2.0,
      speed_increase_rate: 0.3,
      max_explosions: 20
    };

    const result = await updateGameSettings(updateInput);

    // Verify updated fields
    expect(result.id).toEqual(gameSettingsId);
    expect(result.player_name).toEqual('UpdatedPlayer');
    expect(result.character_set).toEqual({
      lowercase: true,
      uppercase: true,
      numbers: true,
      special: false,
      russian: false,
      english: true
    });
    expect(result.initial_fall_speed).toEqual(2.0);
    expect(typeof result.initial_fall_speed).toBe('number');
    expect(result.speed_increase_rate).toEqual(0.3);
    expect(typeof result.speed_increase_rate).toBe('number');
    expect(result.max_explosions).toEqual(20);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update only specified fields', async () => {
    // Create initial game settings
    const createResult = await db.insert(gameSettingsTable)
      .values({
        player_name: testCreateInput.player_name,
        character_set: testCreateInput.character_set,
        initial_fall_speed: testCreateInput.initial_fall_speed!.toString(),
        speed_increase_rate: testCreateInput.speed_increase_rate!.toString(),
        max_explosions: testCreateInput.max_explosions!
      })
      .returning()
      .execute();

    const gameSettingsId = createResult[0].id;

    // Update only player name and initial fall speed
    const updateInput: UpdateGameSettingsInput = {
      id: gameSettingsId,
      player_name: 'PartialUpdate',
      initial_fall_speed: 3.0
    };

    const result = await updateGameSettings(updateInput);

    // Verify updated fields
    expect(result.player_name).toEqual('PartialUpdate');
    expect(result.initial_fall_speed).toEqual(3.0);
    
    // Verify unchanged fields
    expect(result.character_set).toEqual(testCreateInput.character_set);
    expect(result.speed_increase_rate).toEqual(0.2);
    expect(result.max_explosions).toEqual(15);
  });

  it('should save updated settings to database', async () => {
    // Create initial game settings
    const createResult = await db.insert(gameSettingsTable)
      .values({
        player_name: testCreateInput.player_name,
        character_set: testCreateInput.character_set,
        initial_fall_speed: testCreateInput.initial_fall_speed!.toString(),
        speed_increase_rate: testCreateInput.speed_increase_rate!.toString(),
        max_explosions: testCreateInput.max_explosions!
      })
      .returning()
      .execute();

    const gameSettingsId = createResult[0].id;

    // Update settings
    const updateInput: UpdateGameSettingsInput = {
      id: gameSettingsId,
      player_name: 'DatabaseTest',
      max_explosions: 25
    };

    await updateGameSettings(updateInput);

    // Query database directly to verify changes
    const dbResult = await db.select()
      .from(gameSettingsTable)
      .where(eq(gameSettingsTable.id, gameSettingsId))
      .execute();

    expect(dbResult).toHaveLength(1);
    expect(dbResult[0].player_name).toEqual('DatabaseTest');
    expect(dbResult[0].max_explosions).toEqual(25);
    expect(parseFloat(dbResult[0].initial_fall_speed)).toEqual(1.5); // Unchanged
    expect(dbResult[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent game settings', async () => {
    const updateInput: UpdateGameSettingsInput = {
      id: 99999,
      player_name: 'NonExistent'
    };

    await expect(updateGameSettings(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should update character set configuration', async () => {
    // Create initial game settings
    const createResult = await db.insert(gameSettingsTable)
      .values({
        player_name: testCreateInput.player_name,
        character_set: {
          lowercase: true,
          uppercase: false,
          numbers: false,
          special: false,
          russian: false,
          english: true
        },
        initial_fall_speed: '1.0',
        speed_increase_rate: '0.1',
        max_explosions: 10
      })
      .returning()
      .execute();

    const gameSettingsId = createResult[0].id;

    // Update character set to include more options
    const updateInput: UpdateGameSettingsInput = {
      id: gameSettingsId,
      character_set: {
        lowercase: true,
        uppercase: true,
        numbers: true,
        special: true,
        russian: true,
        english: true
      }
    };

    const result = await updateGameSettings(updateInput);

    expect(result.character_set).toEqual({
      lowercase: true,
      uppercase: true,
      numbers: true,
      special: true,
      russian: true,
      english: true
    });
  });
});
