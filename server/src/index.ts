import { env } from './config/env';
import { connectDB } from './config/db';
import { createApp } from './app';

async function main() {
  await connectDB();
  createApp().listen(env.PORT, () => console.log(`API listening on :${env.PORT}`));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
