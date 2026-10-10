// Remove registrations left by earlier versions; never register a new worker.
(async () => {
    if ('serviceWorker' in navigator) {
        try {
            const registrations = await navigator.serviceWorker.getRegistrations();
            await Promise.allSettled(registrations.map(async registration => {
                try {
                    const subscription = await registration.pushManager?.getSubscription();
                    if (subscription) await subscription.unsubscribe();
                } catch (_) { /* Browser permissions may require manual cleanup. */ }
                const workers = [registration.active, registration.waiting, registration.installing].filter(Boolean);
                if (workers.some(worker => {
                    const url = new URL(worker.scriptURL);
                    return url.origin === location.origin && url.pathname === '/sw.js';
                })) {
                    // The same URL, including an old query, now serves the inert retirement worker.
                    try { await registration.update(); } catch (_) { /* Still unregister below. */ }
                }
                try { await registration.unregister(); } catch (_) { /* Retry on a later visit. */ }
            }));
        } catch (_) { /* Some browsing modes disable service workers. */ }
    }
    try {
        if ('caches' in window) {
            const names = await caches.keys();
            await Promise.allSettled(names.map(name => caches.delete(name)));
        }
    } catch (_) { /* The page remains usable without storage access. */ }
})();
