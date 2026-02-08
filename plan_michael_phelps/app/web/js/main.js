import { bootstrap } from "./core/bootstrap.js";
import { bootstrapV4 } from "./core/bootstrap_v4.js";
import { loadConfig } from "./content/repository.js";

(async () => {
    try {
        const config = await loadConfig();
        // Force V4 if URL param ?v4=true exists, or check config
        const urlParams = new URLSearchParams(window.location.search);
        const useV4 = urlParams.has('v4') || config.content_version === 'v4';

        if (useV4) {
            await bootstrapV4();
        } else {
            await bootstrap();
        }
    } catch (e) {
        console.error("Boot failure:", e);
        // Fallback to V3 if config fails
        await bootstrap();
    }
})();
