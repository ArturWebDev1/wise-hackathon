import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import { pool } from './db.js';
import * as service from './service.js';
import { HttpError, type SharedData } from './types.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '10kb' }));

type Handler = (req: Request, res: Response) => Promise<unknown>;
const route = (handler: Handler) => (req: Request, res: Response, next: NextFunction) => {
  handler(req, res).catch(next);
};
const reply = ({ state, result }: { state: SharedData; result?: unknown }, res: Response) =>
  res.json(typeof result === 'string' ? { id: result, state } : { state });

app.get('/health', (_req, res) => res.json({ ok: true }));
app.get(
  '/state',
  route(async (_req, res) => res.json(await service.getState())),
);

app.post(
  '/transfers',
  route(async (req, res) => reply(await service.createTransfer(req.body), res)),
);
app.post(
  '/transfers/send-to-maria',
  route(async (req, res) => reply(await service.sendToMaria(req.body.amount), res)),
);
app.post(
  '/transfers/:id/decision',
  route(async (req, res) => reply(await service.decide(req.params.id, req.body.approve), res)),
);
app.put(
  '/settings/limit',
  route(async (req, res) => reply(await service.setLimit(req.body.limit), res)),
);
app.put(
  '/settings/rules/:key',
  route(async (req, res) => reply(await service.toggleRule(req.params.key, req.body.enabled), res)),
);
app.post(
  '/settings/favourites/:id/toggle',
  route(async (req, res) => reply(await service.toggleFavourite(req.params.id), res)),
);
app.post(
  '/invite',
  route(async (_req, res) => reply(await service.invite(), res)),
);
app.post(
  '/consent',
  route(async (_req, res) => reply(await service.agree(), res)),
);
app.post(
  '/reset',
  route(async (_req, res) => reply(await service.reset(), res)),
);

app.use((_req, _res, next) => next(new HttpError(404, 'Not found.')));

/** pg connection errors (class 08), shutdowns (57P) and "too many connections" (53300). */
const databaseDown = (code: unknown) =>
  typeof code === 'string' &&
  (code.startsWith('08') || code.startsWith('57P') || code === '53300' || code === 'ECONNREFUSED');

app.use((error: unknown, req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof HttpError) return res.status(error.status).json({ error: error.message });
  const code: unknown = Reflect.get(Object(error), 'code');
  const type: unknown = Reflect.get(Object(error), 'type');
  if (type === 'entity.parse.failed')
    return res.status(400).json({ error: 'The request was not valid JSON.' });
  if (type === 'entity.too.large')
    return res.status(413).json({ error: 'The request is too big.' });
  console.error(`${req.method} ${req.path} failed`, error);
  if (databaseDown(code))
    return res.status(503).json({ error: 'The database is not available. Try again in a moment.' });
  if (code === '22003') return res.status(400).json({ error: 'That amount is too large.' });
  return res.status(500).json({ error: 'Something went wrong. Try again.' });
});

const port = Number(process.env.PORT ?? 3001);
const STARTUP_ATTEMPTS = 10;

async function connectToDatabase() {
  for (let attempt = 1; attempt <= STARTUP_ATTEMPTS; attempt++) {
    try {
      await service.init();
      return;
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      console.error(`Database not ready (${attempt}/${STARTUP_ATTEMPTS}): ${reason}`);
      if (attempt === STARTUP_ATTEMPTS) {
        console.error('Could not reach Postgres. Start it with: npm run db:up');
        process.exit(1);
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
}

await connectToDatabase();
const server = app.listen(port, () => console.log(`Wise Care API on http://localhost:${port}`));
server.on('error', (error) => {
  console.error(`Could not start the API on port ${port}:`, error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => console.error('Unhandled rejection', reason));
for (const signal of ['SIGINT', 'SIGTERM'] as const)
  process.on(signal, () => {
    server.close(() => void pool.end().finally(() => process.exit(0)));
  });
