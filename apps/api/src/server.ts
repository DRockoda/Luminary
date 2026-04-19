import { env, logCrossOriginRuntimeConfig } from "./env.js";
import { app } from "./app.js";
import { startTrashPurgeScheduler } from "./services/trashPurge.js";

/** Long-running Node server (local / traditional hosting). Not used on Vercel. */
if (!process.env.VERCEL) {
  app.listen(env.PORT, () => {
    logCrossOriginRuntimeConfig();
    startTrashPurgeScheduler();
    // eslint-disable-next-line no-console
    console.log(`✨ Luminary API listening on http://localhost:${env.PORT}`);
  });
}
