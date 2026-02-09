import { bootstrap } from "./core/bootstrap.js";
import { bootstrapV4 } from "./core/bootstrap_v4.js";
import { loadConfig } from "./content/repository.js";

(async () => {
    try {
        const config = await loadConfig();
        // Force V4 if URL param ?v4=true exists, or check config. 
        // Default to TRUE if we can't determine, because V3 is dead.
        const useV4 = true; // urlParams.has('v4') || config.content_version === 'v4';

        if (useV4) {
            console.log("Bootstrapping V4 Cinematic Engine...");
            await bootstrapV4();
        } else {
            console.warn("Legacy V3 requested but deprecated. Forcing V4.");
            await bootstrapV4();
        }
    } catch (e) {
        console.error("Boot failure:", e);
        const root = document.getElementById('v4-root');
        if (root) {
            root.innerHTML = `<div style="color:red; text-align:center; padding:2rem;">
                <h1>CRITICAL BOOT FAILURE</h1>
                <p>${e.message}</p>
                <pre>${e.stack}</pre>
            </div>`;
        }
    }
})();
