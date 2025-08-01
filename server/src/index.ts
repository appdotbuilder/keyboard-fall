
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

import { 
  createGameSettingsInputSchema, 
  updateGameSettingsInputSchema,
  createHighScoreInputSchema,
  getHighScoresInputSchema
} from './schema';
import { createGameSettings } from './handlers/create_game_settings';
import { getGameSettings } from './handlers/get_game_settings';
import { updateGameSettings } from './handlers/update_game_settings';
import { getAllGameSettings } from './handlers/get_all_game_settings';
import { createHighScore } from './handlers/create_high_score';
import { getHighScores } from './handlers/get_high_scores';
import { z } from 'zod';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  // Game Settings endpoints
  createGameSettings: publicProcedure
    .input(createGameSettingsInputSchema)
    .mutation(({ input }) => createGameSettings(input)),
    
  getGameSettings: publicProcedure
    .input(z.object({ playerId: z.number() }))
    .query(({ input }) => getGameSettings(input.playerId)),
    
  updateGameSettings: publicProcedure
    .input(updateGameSettingsInputSchema)
    .mutation(({ input }) => updateGameSettings(input)),
    
  getAllGameSettings: publicProcedure
    .query(() => getAllGameSettings()),
    
  // High Scores endpoints
  createHighScore: publicProcedure
    .input(createHighScoreInputSchema)
    .mutation(({ input }) => createHighScore(input)),
    
  getHighScores: publicProcedure
    .input(getHighScoresInputSchema)
    .query(({ input }) => getHighScores(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
