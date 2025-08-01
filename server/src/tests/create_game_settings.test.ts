
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { gameSettingsTable } from '../db/schema';
import { type CreateGameSettingsInput } from '../schema';
import { createGameSettings } from '../handlers/create_game_settings';
import { eq } from 'drizzle-orm';

// Test input with all fields
const testInput: CreateGameSettingsInput = {
  player_name: 'TestPlayer',
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

// Test input with minimal fields (using defaults)
const minimalInput: CreateGameSettingsInput = {
  player_name: 'MinimalPlayer',
  character_set: {
    lowercase: true,
    uppercase: false,
    numbers: false,
    special: false,
    russian: false,
    english: true
  }
};

describe('createGameSettings', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create game settings with all fields', async () => {
    const result = await createGameSettings(testInput);

    // Basic field validation
    expect(result.player_name).toEqual('TestPlayer');
    expect(result.character_set).toEqual(testInput.character_set);
    expect(result.initial_fall_speed).toEqual(1.5);
    expect(typeof result.initial_fall_speed).toEqual('number');
    expect(result.speed_increase_rate).toEqual(0.2);
    expect(typeof result.speed_increase_rate).toEqual('number');
    expect(result.max_explosions).toEqual(15);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create game settings with default values', async () => {
    const result = await createGameSettings(minimalInput);

    // Verify defaults are applied
    expect(result.player_name).toEqual('MinimalPlayer');
    expect(result.character_set).toEqual(minimalInput.character_set);
    expect(result.initial_fall_speed).toEqual(1.0);
    expect(typeof result.initial_fall_speed).toEqual('number');
    expect(result.speed_increase_rate).toEqual(0.1);
    expect(typeof result.speed_increase_rate).toEqual('number');
    expect(result.max_explosions).toEqual(10);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save game settings to database', async () => {
    const result = await createGameSettings(testInput);

    // Query using proper drizzle syntax
    const gameSettings = await db.select()
      .from(gameSettingsTable)
      .where(eq(gameSettingsTable.id, result.id))
      .execute();

    expect(gameSettings).toHaveLength(1);
    const saved = gameSettings[0];
    expect(saved.player_name).toEqual('TestPlayer');
    expect(saved.character_set).toEqual(testInput.character_set);
    expect(parseFloat(saved.initial_fall_speed)).toEqual(1.5);
    expect(parseFloat(saved.speed_increase_rate)).toEqual(0.2);
    expect(saved.max_explosions).toEqual(15);
    expect(saved.created_at).toBeInstanceOf(Date);
    expect(saved.updated_at).toBeInstanceOf(Date);
  });

  it('should handle character set configurations correctly', async () => {
    const russianConfig: CreateGameSettingsInput = {
      player_name: 'RussianPlayer',
      character_set: {
        lowercase: false,
        uppercase: true,
        numbers: true,
        special: true,
        russian: true,
        english: false
      },
      initial_fall_speed: 2.0,
      speed_increase_rate: 0.3,
      max_explosions: 20
    };

    const result = await createGameSettings(russianConfig);

    expect(result.character_set.russian).toBe(true);
    expect(result.character_set.english).toBe(false);
    expect(result.character_set.uppercase).toBe(true);
    expect(result.character_set.lowercase).toBe(false);
    expect(result.character_set.numbers).toBe(true);
    expect(result.character_set.special).toBe(true);
  });

  it('should create multiple game settings for different players', async () => {
    const player1 = await createGameSettings({
      ...testInput,
      player_name: 'Player1'
    });

    const player2 = await createGameSettings({
      ...minimalInput,
      player_name: 'Player2'
    });

    expect(player1.id).not.toEqual(player2.id);
    expect(player1.player_name).toEqual('Player1');
    expect(player2.player_name).toEqual('Player2');

    // Verify both are saved in database
    const allSettings = await db.select()
      .from(gameSettingsTable)
      .execute();

    expect(allSettings).toHaveLength(2);
  });
});
