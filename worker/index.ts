// @ts-nocheck
/// <reference lib="webworker" />
declare let self: ServiceWorkerGlobalScope;

self.addEventListener("push", (event) => {
  if (!event.data) return;
  
  try {
    const data = event.data.json();
    const title = data.title || "Groszyk";
    const options: NotificationOptions = {
      body: data.body,
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-72x72.png",
      vibrate: [100, 50, 100],
      data: data.data || { url: "/" },
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (e) {
    const title = "Groszyk";
    const options: NotificationOptions = {
      body: event.data.text(),
      icon: "/icons/icon-192x192.png",
    };
    event.waitUntil(self.registration.showNotification(title, options));
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  
  const urlToOpen = new URL(event.notification.data?.url || "/", self.location.origin).href;

  const promiseChain = self.clients.matchAll({
    type: "window",
    includeUncontrolled: true
  }).then((windowClients) => {
    let matchingClient = null;
    for (const client of windowClients) {
      if (client.url === urlToOpen) {
        matchingClient = client;
        break;
      }
    }
    
    if (matchingClient) {
      return matchingClient.focus();
    } else {
      return self.clients.openWindow(urlToOpen);
    }
  });

  event.waitUntil(promiseChain);
});
