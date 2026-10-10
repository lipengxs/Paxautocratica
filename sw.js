// Inert replacement for the former remote advertising worker.
self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', event => {
    event.waitUntil((async () => {
        try {
            const subscription = await self.registration.pushManager?.getSubscription();
            if (subscription) await subscription.unsubscribe();
        } catch (_) { /* Browser settings may still require manual revocation. */ }
        try {
            const names = await caches.keys();
            await Promise.allSettled(names.map(name => caches.delete(name)));
        } catch (_) { /* Continue retiring even when cache access is restricted. */ }
        try { await self.clients.claim(); } catch (_) { /* No clients may be available. */ }
        await self.registration.unregister();
    })());
});
