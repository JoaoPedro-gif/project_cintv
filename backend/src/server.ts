import { createApp } from './app';
import { connectDb } from './config/db';
import { env } from './config/env';

connectDb()
  .then(() => createApp().listen(env.PORT, () => console.log(`API em http://localhost:${env.PORT}`)))
  .catch((e) => { console.error(e); process.exit(1); });
