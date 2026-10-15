import { createApp } from './app';
import { connectDb } from './config/db';
import { env } from './config/env';

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function start() {
  // Não encerra se o banco estiver fora do ar: tenta de novo a cada 10 segundos
  for (let tentativa = 1; ; tentativa++) {
    try { await connectDb(); break; }
    catch (e: any) {
      console.error(`Banco indisponível (tentativa ${tentativa}): ${e.message}. Nova tentativa em 10 s...`);
      await wait(10_000);
    }
  }
  createApp().listen(env.PORT, () => console.log(`API em http://localhost:${env.PORT}`));
}
start();