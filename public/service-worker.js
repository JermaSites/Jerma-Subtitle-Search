const cacheName = 'cache-1.985.52';
const cachedFiles = [
    'jermaT.avif',
    'jermaComet.avif',
    'SubtitleIndex.json.gzip'
];

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== cacheName)
                    .map((key) => caches.delete(key))
            );
        })
    );
});

self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.open(cacheName).then((cache) => {
            return cache
                .match(e.request)
                .then((response) => {
                    if (response) {
                        return response;
                    }

                    return fetch(e.request.clone()).then((networkResponse) => {
                        if (networkResponse.status < 400 && cachedFiles.some(file => networkResponse.url.endsWith(file))) {
                            networkResponse.clone().blob().then((bodyBlob) => {
                                const newHeaders = new Headers(networkResponse.headers);
                                newHeaders.set('Intercepted-By-Service-Worker', 'true');

                                const modifiedResponse = new Response(bodyBlob, {
                                    headers: newHeaders,
                                    status: networkResponse.status,
                                    statusText: networkResponse.statusText
                                });

                                cache.put(e.request, modifiedResponse.clone());
                            });
                        }
                        return networkResponse;
                    });
                })
                .catch((error) => {
                    console.error('Error in fetch handler:', error);
                    throw error;
                });
        }),
    );
});
