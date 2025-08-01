
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { gameSettingsTable } from '../db/schema';
import { type CreateGameSettingsInput } from '../schema';
import { getAllGameSettings } from '../handlers/get_all_game_settings';

// Test data
const testSettings1: CreateGameSettingsInput = {
  player_name: 'Alice',
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

const testSettings2: CreateGameSettingsInput = {
  player_name: 'Bob',
  character_set: {
    lowercase: true,
    uppercase: true,
    numbers: true,
    special: false,
    russian: false,
    english: true
  },
  initial_fall_speed: 2.0,
  speed_increase_rate: 0.15,
  max_explosions: 20
};

describe('getAllGameSettings', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no settings exist', async () => {
    const result = await getAllGameSettings();
    
    expect(result).toEqual([]);
  });

  it('should return all game settings', async () => {
    // Create test settings
    await db.insert(gameSettingsTable)
      .values([
        {
          player_name: testSettings1.player_name,
          character_set: testSettings1.character_set,
          initial_fall_speed: testSettings1.initial_fall_speed!.toString(),
          speed_increase_rate: testSettings1.speed_increase_rate!.toString(),
          max_explosions: testSettings1.max_explosions!
        },
        {
          player_name: testSettings2.player_name,
          character_set: testSettings2.character_set,
          initial_fall_speed: testSettings2.initial_fall_speed!.toString(),
          speed_increase_rate: testSettings2.speed_increase_rate!.toString(),
          max_explosions: testSettings2.max_explosions!
        }
      ])
      .execute();

    const result = await getAllGameSettings();

    expect(result).toHaveLength(2);
    
    // Verify first setting (most recent due to desc order)
    const setting1 = result.find(s => s.player_name === 'Bob');
    expect(setting1).toBeDefined();
    expect(setting1!.player_name).toEqual('Bob');
    expect(setting1!.character_set).toEqual(testSettings2.character_set);
    expect(setting1!.initial_fall_speed).toEqual(2.0);
    expect(typeof setting1!.initial_fall_speed).toBe('number');
    expect(setting1!.speed_increase_rate).toEqual(0.15);
    expect(typeof setting1!.speed_increase_rate).toBe('number');
    expect(setting1!.max_explosions).toEqual(20);
    expect(setting1!.id).toBeDefined();
    expect(setting1!.created_at).toBeInstanceOf(Date);
    expect(setting1!.updated_at).toBeInstanceOf(Date);

    // Verify second setting
    const setting2 = result.find(s => s.player_name === 'Alice');
    expect(setting2).toBeDefined();
    expect(setting2!.player_name).toEqual('Alice');
    expect(setting2!.character_set).toEqual(testSettings1.character_set);
    expect(setting2!.initial_fall_speed).toEqual(1.5);
    expect(typeof setting2!.initial_fall_speed).toBe('number');
    expect(setting2!.speed_increase_rate).toEqual(0.2);
    expect(typeof setting2!.speed_increase_rate).toBe('number');
    expect(setting2!.max_explosions).toEqual(15);
  });

  it('should return settings ordered by creation date (newest first)', async () => {
    // Create first setting
    await db.insert(gameSettingsTable)
      .values({
        player_name: 'First Player',
        character_set: testSettings1.character_set,
        initial_fall_speed: '1.0',
        speed_increase_rate: '0.1',
        max_explosions: 10
      })
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    // Create second setting
    await db.insert(gameSettingsTable)
      .values({
        player_name: 'Second Player',
        character_set: testSettings2.character_set,
        initial_fall_speed: '2.0',
        speed_increase_rate: '0.2',
        max_explosions: 20
      })
      .execute();

    const result = await getAllGameSettings();

    expect(result).toHaveLength(2);
    expect(result[0].player_name).toEqual('Second Player'); // Most recent first
    expect(result[1].player_name).toEqual('First Player');
    expect(result[0].created_at.getTime()).toBeGreaterThan(result[1].created_at.getTime());
  });

  it('should handle character set JSON correctly', async () => {
    const complexCharacterSet = {
      lowercase: true,
      uppercase: true,
      numbers: true,
      special: true,
      russian: true,
      english: false
    };

    await db.insert(gameSettingsTable)
      .values({
        player_name: 'Complex Player',
        character_set: complexCharacterSet,
        initial_fall_speed: '1.0',
        speed_increase_rate: '0.1',
        max_explosions: 10
      })
      .execute();

    const result = await getAllGameSettings();

    expect(result).toHaveLength(1);
    expect(result[0].character_set).toEqual(complexCharacterSet);
    expect(result[0].character_set.russian).toBe(true);
    expect(result[0].character_set.english).toBe(false);
    expect(result[0].character_set.special).toBe(true);
  });
});
