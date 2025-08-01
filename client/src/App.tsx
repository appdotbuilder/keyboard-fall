
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback, useRef } from 'react';
import type { HighScore, CreateHighScoreInput, CharacterSet } from '../../server/src/schema';

interface FallingLetter {
  id: string;
  letter: string;
  x: number;
  y: number;
  speed: number;
}

function App() {
  // Game state
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameOver' | 'settings'>('menu');
  const [fallingLetters, setFallingLetters] = useState<FallingLetter[]>([]);
  const [score, setScore] = useState(0);
  const [explosions, setExplosions] = useState(0);
  const [lettersTyped, setLettersTyped] = useState(0);
  const [lettersMissed, setLettersMissed] = useState(0);
  const [gameStartTime, setGameStartTime] = useState<Date | null>(null);
  const [currentSpeed, setCurrentSpeed] = useState(1.0);
  
  // Player settings
  const [playerName, setPlayerName] = useState('');
  const [characterSet, setCharacterSet] = useState<CharacterSet>({
    lowercase: true,
    uppercase: false,
    numbers: false,
    special: false,
    russian: false,
    english: true
  });
  const [maxExplosions, setMaxExplosions] = useState(10);
  const [initialFallSpeed, setInitialFallSpeed] = useState(1.0);
  const [speedIncreaseRate, setSpeedIncreaseRate] = useState(0.1);
  
  // High scores
  const [highScores, setHighScores] = useState<HighScore[]>([]);
  
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const letterIdRef = useRef(0);

  // Generate character pool based on settings
  const generateCharacterPool = useCallback((): string[] => {
    const pool: string[] = [];
    
    if (characterSet.lowercase) {
      pool.push(...'abcdefghijklmnopqrstuvwxyz'.split(''));
    }
    if (characterSet.uppercase) {
      pool.push(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''));
    }
    if (characterSet.numbers) {
      pool.push(...'0123456789'.split(''));
    }
    if (characterSet.special) {
      pool.push(...'!@#$%^&*()'.split(''));
    }
    if (characterSet.russian) {
      pool.push(...'абвгдеёжзийклмнопрстуфхцчшщъыьэюя'.split(''));
      if (characterSet.uppercase) {
        pool.push(...'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ'.split(''));
      }
    }
    
    return pool.length > 0 ? pool : ['a', 'b', 'c']; // Fallback
  }, [characterSet]);

  // Load high scores
  const loadHighScores = useCallback(async () => {
    try {
      const result = await trpc.getHighScores.query({ limit: 10 });
      setHighScores(result);
    } catch (error) {
      console.error('Failed to load high scores:', error);
      // Using stub data since backend is not implemented
      setHighScores([
        {
          id: 1,
          player_name: 'Alex',
          score: 1500,
          letters_typed: 75,
          letters_missed: 5,
          game_duration: 120,
          character_set: { lowercase: true, uppercase: false, numbers: false, special: false, russian: false, english: true },
          created_at: new Date()
        },
        {
          id: 2,
          player_name: 'Emma',
          score: 1200,
          letters_typed: 60,
          letters_missed: 8,
          game_duration: 105,
          character_set: { lowercase: true, uppercase: true, numbers: false, special: false, russian: false, english: true },
          created_at: new Date()
        }
      ]);
    }
  }, []);

  useEffect(() => {
    loadHighScores();
  }, [loadHighScores]);

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const gameLoop = setInterval(() => {
      setFallingLetters((prev: FallingLetter[]) => {
        const updated = prev.map((letter: FallingLetter) => ({
          ...letter,
          y: letter.y + letter.speed
        }));

        // Remove letters that reached the bottom and count as explosions
        const remaining = updated.filter((letter: FallingLetter) => {
          if (letter.y > 500) {
            setExplosions(e => e + 1);
            setLettersMissed(m => m + 1);
            return false;
          }
          return true;
        });

        return remaining;
      });

      // Spawn new letters randomly
      if (Math.random() < 0.3) {
        const characters = generateCharacterPool();
        const newLetter: FallingLetter = {
          id: `letter-${letterIdRef.current++}`,
          letter: characters[Math.floor(Math.random() * characters.length)],
          x: Math.random() * 700 + 50,
          y: 0,
          speed: currentSpeed
        };
        setFallingLetters((prev: FallingLetter[]) => [...prev, newLetter]);
      }

      // Increase speed over time
      setCurrentSpeed(speed => speed + speedIncreaseRate * 0.01);
    }, 100);

    return () => clearInterval(gameLoop);
  }, [gameState, currentSpeed, speedIncreaseRate, generateCharacterPool]);

  // Check for game over
  useEffect(() => {
    if (explosions >= maxExplosions && gameState === 'playing') {
      setGameState('gameOver');
    }
  }, [explosions, maxExplosions, gameState]);

  // Handle keyboard input
  useEffect(() => {
    if (gameState !== 'playing') return;

    const handleKeyPress = (event: KeyboardEvent) => {
      const key = event.key;
      
      setFallingLetters((prev: FallingLetter[]) => {
        const matchingLetterIndex = prev.findIndex((letter: FallingLetter) => letter.letter === key);
        
        if (matchingLetterIndex !== -1) {
          setScore(s => s + 20);
          setLettersTyped(t => t + 1);
          return prev.filter((_, index) => index !== matchingLetterIndex);
        }
        
        return prev;
      });
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameState]);

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setExplosions(0);
    setLettersTyped(0);
    setLettersMissed(0);
    setFallingLetters([]);
    setCurrentSpeed(initialFallSpeed);
    setGameStartTime(new Date());
    letterIdRef.current = 0;
  };

  const saveHighScore = async () => {
    if (!playerName.trim() || !gameStartTime) return;

    const gameDuration = (Date.now() - gameStartTime.getTime()) / 1000;
    
    const highScoreData: CreateHighScoreInput = {
      player_name: playerName.trim(),
      score,
      letters_typed: lettersTyped,
      letters_missed: lettersMissed,
      game_duration: gameDuration,
      character_set: characterSet
    };

    try {
      await trpc.createHighScore.mutate(highScoreData);
      await loadHighScores();
    } catch (error) {
      console.error('Failed to save high score:', error);
      // Add to local state as fallback
      const newHighScore: HighScore = {
        id: Date.now(),
        ...highScoreData,
        created_at: new Date()
      };
      setHighScores((prev: HighScore[]) => [...prev, newHighScore].sort((a, b) => b.score - a.score).slice(0, 10));
    }
  };

  const backToMenu = () => {
    setGameState('menu');
    setFallingLetters([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-200 via-purple-200 to-blue-200 p-4">
      <div className="container mx-auto max-w-6xl">
        <h1 className="text-6xl font-bold text-center mb-8 text-purple-800 drop-shadow-lg">
          🌟 Keyboard Heroes! 🌟
        </h1>

        {gameState === 'menu' && (
          <div className="grid gap-8 md:grid-cols-2">
            <Card className="border-4 border-yellow-400 shadow-2xl bg-white/90">
              <CardHeader className="bg-gradient-to-r from-yellow-400 to-orange-400">
                <CardTitle className="text-3xl text-white text-center">🎮 Start Playing!</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div>
                  <label className="text-lg font-semibold text-purple-800 mb-2 block">Your Name:</label>
                  <Input
                    value={playerName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPlayerName(e.target.value)}
                    placeholder="Enter your superhero name!"
                    className="text-lg p-3 border-2 border-purple-300"
                  />
                </div>
                <Button 
                  onClick={startGame}
                  disabled={!playerName.trim()}
                  className="w-full text-2xl py-6 bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white font-bold rounded-xl shadow-lg transform hover:scale-105 transition-all"
                >
                  🚀 Start Adventure!
                </Button>
                <Button 
                  onClick={() => setGameState('settings')}
                  variant="outline"
                  className="w-full text-xl py-4 border-2 border-purple-400 text-purple-700 hover:bg-purple-50"
                >
                  ⚙️ Settings
                </Button>
              </CardContent>
            </Card>

            <Card className="border-4 border-blue-400 shadow-2xl bg-white/90">
              <CardHeader className="bg-gradient-to-r from-blue-400 to-purple-400">
                <CardTitle className="text-3xl text-white text-center">🏆 Hall of Fame</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {highScores.length === 0 ? (
                  <p className="text-center text-gray-500 text-lg">No heroes yet! Be the first! 🌟</p>
                ) : (
                  <div className="space-y-3">
                    {highScores.slice(0, 5).map((score: HighScore, index: number) => (
                      <div key={score.id} className="flex justify-between items-center p-3 bg-gradient-to-r from-yellow-100 to-pink-100 rounded-lg border-2 border-yellow-300">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">
                            {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '⭐'}
                          </span>
                          <div>
                            <p className="font-bold text-purple-800">{score.player_name}</p>
                            <p className="text-sm text-gray-600">
                              {score.letters_typed} letters, {Math.round(score.game_duration)}s
                            </p>
                          </div>
                        </div>
                        <Badge className="text-lg px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                          {score.score}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {gameState === 'playing' && (
          <div className="space-y-4">
            {/* Game UI */}
            <div className="flex justify-between items-center bg-white/90 p-4 rounded-xl border-4 border-green-400 shadow-lg">
              <div className="flex gap-6 text-xl font-bold">
                <span className="text-green-600">💯 Score: {score}</span>
                <span className="text-blue-600">⚡ Speed: {currentSpeed.toFixed(1)}x</span>
                <span className="text-purple-600">✅ Hit: {lettersTyped}</span>
                <span className="text-red-600">💥 Missed: {lettersMissed}</span>
              </div>
              <Button onClick={backToMenu} variant="outline" className="border-2 border-red-400 text-red-600 hover:bg-red-50">
                🏃 Quit Game
              </Button>
            </div>

            {/* Explosions counter */}
            <div className="text-center">
              <p className="text-lg text-red-600 font-bold mb-2">💥 Explosions: {explosions}/{maxExplosions}</p>
              <Progress 
                value={(explosions / maxExplosions) * 100} 
                className="w-full max-w-md mx-auto h-3"
              />
            </div>

            {/* Game Area */}
            <div 
              ref={gameAreaRef}
              className="relative w-full h-[500px] bg-gradient-to-b from-sky-200 to-green-200 border-4 border-rainbow rounded-xl overflow-hidden shadow-inner"
              style={{
                background: 'linear-gradient(to bottom, #87CEEB 0%, #98FB98 100%)'
              }}
            >
              {/* Falling letters */}
              {fallingLetters.map((letter: FallingLetter) => (
                <div
                  key={letter.id}
                  className="absolute text-6xl font-bold text-white drop-shadow-lg transform transition-all duration-100 animate-pulse"
                  style={{
                    left: `${letter.x}px`,
                    top: `${letter.y}px`,
                    textShadow: '3px 3px 0px #333, -1px -1px 0px #333, 1px -1px 0px #333, -1px 1px 0px #333',
                    color: `hsl(${(letter.letter.charCodeAt(0) * 30) % 360}, 70%, 50%)`
                  }}
                >
                  {letter.letter}
                </div>
              ))}

              {/* Instructions */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center">
                <p className="text-2xl font-bold text-purple-800 drop-shadow-lg">
                  ⌨️ Type the falling letters! ⌨️
                </p>
              </div>
            </div>
          </div>
        )}

        {gameState === 'gameOver' && (
          <Card className="max-w-2xl mx-auto border-4 border-red-400 shadow-2xl bg-white/90">
            <CardHeader className="bg-gradient-to-r from-red-400 to-pink-400">
              <CardTitle className="text-4xl text-white text-center">🎯 Game Over!</CardTitle>
            </CardHeader>
            <CardContent className="p-8 text-center space-y-6">
              <div className="text-6xl">🏆</div>
              <div className="space-y-4">
                <p className="text-3xl font-bold text-purple-800">Final Score: {score}</p>
                <div className="grid grid-cols-2 gap-4 text-lg">
                  <div className="bg-green-100 p-4 rounded-lg border-2 border-green-300">
                    <p className="font-bold text-green-700">Letters Hit</p>
                    <p className="text-2xl text-green-800">{lettersTyped}</p>
                  </div>
                  <div className="bg-red-100 p-4 rounded-lg border-2 border-red-300">
                    <p className="font-bold text-red-700">Letters Missed</p>
                    <p className="text-2xl text-red-800">{lettersMissed}</p>
                  </div>
                </div>
                {lettersTyped > 0 && (
                  <p className="text-xl text-purple-700">
                    Accuracy: {Math.round((lettersTyped / (lettersTyped + lettersMissed)) * 100)}%
                  </p>
                )}
              </div>
              <div className="flex gap-4 justify-center">
                <Button 
                  onClick={saveHighScore}
                  className="text-xl py-3 px-6 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-bold"
                >
                  💾 Save Score
                </Button>
                <Button 
                  onClick={startGame}
                  className="text-xl py-3 px-6 bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white font-bold"
                >
                  🔄 Play Again
                </Button>
                <Button 
                  onClick={backToMenu}
                  variant="outline"
                  className="text-xl py-3 px-6 border-2 border-purple-400 text-purple-700 hover:bg-purple-50"
                >
                  🏠 Menu
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {gameState === 'settings' && (
          <Card className="max-w-4xl mx-auto border-4 border-purple-400 shadow-2xl bg-white/90">
            <CardHeader className="bg-gradient-to-r from-purple-400 to-blue-400">
              <CardTitle className="text-4xl text-white text-center">⚙️ Game Settings</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <Tabs defaultValue="characters" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="characters" className="text-lg">🔤 Characters</TabsTrigger>
                  <TabsTrigger value="gameplay" className="text-lg">🎮 Gameplay</TabsTrigger>
                </TabsList>

                <TabsContent value="characters" className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <Card className="border-2 border-green-300">
                      <CardHeader className="bg-green-100">
                        <CardTitle className="text-xl text-green-800">English Letters</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 space-y-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="lowercase"
                            checked={characterSet.lowercase}
                            onCheckedChange={(checked: boolean) => 
                              setCharacterSet((prev: CharacterSet) => ({ ...prev, lowercase: checked }))
                            }
                          />
                          <label htmlFor="lowercase" className="text-lg">lowercase (a-z)</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="uppercase"
                            checked={characterSet.uppercase}
                            onCheckedChange={(checked: boolean) => 
                              setCharacterSet((prev: CharacterSet) => ({ ...prev, uppercase: checked }))
                            }
                          />
                          <label htmlFor="uppercase" className="text-lg">UPPERCASE (A-Z)</label>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-2 border-blue-300">
                      <CardHeader className="bg-blue-100">
                        <CardTitle className="text-xl text-blue-800">Numbers & Symbols</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 space-y-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="numbers"
                            checked={characterSet.numbers}
                            onCheckedChange={(checked: boolean) => 
                              setCharacterSet((prev: CharacterSet) => ({ ...prev, numbers: checked }))
                            }
                          />
                          <label htmlFor="numbers" className="text-lg">Numbers (0-9)</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="special"
                            checked={characterSet.special}
                            onCheckedChange={(checked: boolean) => 
                              setCharacterSet((prev: CharacterSet) => ({ ...prev, special: checked }))
                            }
                          />
                          <label htmlFor="special" className="text-lg">Special (!@#$%^&*())</label>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-2 border-red-300 md:col-span-2">
                      <CardHeader className="bg-red-100">
                        <CardTitle className="text-xl text-red-800">Russian Letters</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="russian"
                            checked={characterSet.russian}
                            onCheckedChange={(checked: boolean) => 
                              setCharacterSet((prev: CharacterSet) => ({ ...prev, russian: checked }))
                            }
                          />
                          <label htmlFor="russian" className="text-lg">Russian alphabet (а-я)</label>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="gameplay" className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                      <label className="text-lg font-semibold text-purple-800">Initial Fall Speed:</label>
                      <Input
                        type="number"
                        value={initialFallSpeed}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                          setInitialFallSpeed(parseFloat(e.target.value) || 1.0)
                        }
                        min="0.1"
                        max="5.0"
                        step="0.1"
                        className="text-lg"
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="text-lg font-semibold text-purple-800">Speed Increase Rate:</label>
                      <Input
                        type="number"
                        value={speedIncreaseRate}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                          setSpeedIncreaseRate(parseFloat(e.target.value) || 0.1)
                        }
                        min="0.01"
                        max="1.0"
                        step="0.01"
                        className="text-lg"
                      />
                    </div>
                    <div className="space-y-4 md:col-span-2">
                      <label className="text-lg font-semibold text-purple-800">Max Explosions (Game Over):</label>
                      <Input
                        type="number"
                        value={maxExplosions}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                          setMaxExplosions(parseInt(e.target.value) || 10)
                        }
                        min="1"
                        max="20"
                        className="text-lg"
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex gap-4 justify-center pt-6">
                <Button 
                  onClick={backToMenu}
                  className="text-xl py-3 px-8 bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white font-bold"
                >
                  ✅ Save & Return
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default App;
