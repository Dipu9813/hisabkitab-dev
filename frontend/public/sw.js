// Custom service worker for HisabKitab PWA
const CACHE_NAME = "hisabkitab-v3"; // Updated version to force refresh
const urlsToCache = ["/", "/manifest.json"];

// Install event
self.addEventListener("install", (event) => {
  console.log("Service worker installing...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Opened cache");
      // Only cache files that actually exist
      return cache.addAll(urlsToCache).catch((err) => {
        console.warn("Failed to cache some resources:", err);
        // Continue installation even if caching fails
        return Promise.resolve();
      });
    })
  );
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event
self.addEventListener("activate", (event) => {
  console.log("Service worker activating...");
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log("Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log("Service worker activated");
        // Take control of all clients immediately
        return self.clients.claim();
      })
  );
});

// Fetch event
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }
      return fetch(event.request);
    })
  );
});

// Push event listener
self.addEventListener("push", (event) => {
  console.log("Push notification received", event);

  if (!event.data) {
    return;
  }

  // Default options as fallback
  let options = {
    body: "You have loan payment reminders!",
    icon: "/icon-192x192.png",
    badge: "/icon-72x72.png",
    vibrate: [100, 50, 100],
    requireInteraction: true,
    actions: [
      {
        action: "view",
        title: "View Details",
        icon: "/icon-72x72.png",
      },
      {
        action: "dismiss",
        title: "Dismiss",
      },
    ],
    tag: "loan-reminder",
    renotify: true,
  };

  let title = "HisabKitab"; // Default title

  try {
    const data = event.data.json();
    console.log("📱 Received push data:", data);

    // Use the data from server to override defaults
    if (data.title) title = data.title;
    if (data.body) options.body = data.body;
    if (data.icon) options.icon = data.icon;
    if (data.badge) options.badge = data.badge;
    if (data.tag) options.tag = data.tag;
    if (data.requireInteraction !== undefined)
      options.requireInteraction = data.requireInteraction;
    if (data.actions) options.actions = data.actions;
    if (data.data) options.data = data.data;

    console.log("📱 Final notification options:", { title, options });
  } catch (e) {
    console.log("Push event data is not JSON, using defaults");
  }

  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click event
self.addEventListener("notificationclick", (event) => {
  console.log("Notification click received", event);
  console.log("Action clicked:", event.action);
  console.log("Notification data:", event.notification.data);

  event.notification.close();

  if (event.action === "dismiss") {
    return;
  }

  // Determine the URL based on the action
  let targetUrl = "/"; // Default fallback

  if (event.notification.data) {
    const notificationData = event.notification.data;

    if (event.action === "view" && notificationData.loanId) {
      // For "View Details" action, go to the specific loan
      targetUrl = `/?loan=${notificationData.loanId}`;
      console.log("🔗 Redirecting to loan details:", targetUrl);
    } else if (event.action === "pay" && notificationData.loanId) {
      // For "Mark as Paid" action, go to the loan with payment action
      targetUrl = `/?loan=${notificationData.loanId}&action=pay`;
      console.log("💳 Redirecting to mark as paid:", targetUrl);
    } else if (notificationData.url) {
      // Use the URL from notification data
      targetUrl = notificationData.url;
    } else if (notificationData.clickAction) {
      // Use the click action URL
      targetUrl = notificationData.clickAction;
    }
  }

  // Handle notification click
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        console.log("🔍 Looking for existing window with URL:", targetUrl);

        // Check if there's already a window/tab open
        for (const client of clientList) {
          // Check if it's the main app (ignore query parameters for matching)
          const clientBaseUrl = client.url.split("?")[0];
          const targetBaseUrl = targetUrl.split("?")[0];

          if (
            clientBaseUrl.includes("localhost:3001") ||
            client.url.includes("localhost:3001")
          ) {
            console.log("✅ Found existing window, focusing and navigating");
            // Focus the window and navigate to the specific loan
            client.postMessage({
              type: "NAVIGATE_TO_LOAN",
              loanId: event.notification.data?.loanId,
              action: event.action,
              url: targetUrl,
            });
            // Navigate the existing client to the target URL
            return client.navigate
              ? client.navigate(targetUrl)
              : client.focus();
          }
        }

        // If not, open a new window
        if (clients.openWindow) {
          console.log("🆕 Opening new window with URL:", targetUrl);
          return clients.openWindow(targetUrl);
        }
      })
  );
});

// Background sync for offline actions
self.addEventListener("sync", (event) => {
  if (event.tag === "loan-reminder-sync") {
    event.waitUntil(
      // Handle background sync for loan reminders
      fetch("/api/sync/loan-reminders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      }).catch((error) => {
        console.error("Background sync failed:", error);
      })
    );
  }
});

// Periodic background sync (if supported)
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "check-loan-reminders") {
    event.waitUntil(
      fetch("/api/check-loan-reminders")
        .then((response) => response.json())
        .then((data) => {
          if (data.notifications && data.notifications.length > 0) {
            // Show notifications for due loans
            data.notifications.forEach((notification) => {
              self.registration.showNotification("HisabKitab - Loan Reminder", {
                body: notification.message,
                icon: "/icon-192x192.png",
                badge: "/icon-72x72.png",
                tag: notification.tag,
                data: { url: "/loans" },
              });
            });
          }
        })
        .catch((error) => console.error("Periodic sync error:", error))
    );
  }
});