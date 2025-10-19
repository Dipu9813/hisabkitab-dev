"use client";

import { useEffect, useState } from "react";

export interface PushNotificationService {
  requestPermission: () => Promise<boolean>;
  subscribeToPush: () => Promise<PushSubscription | null>;
  unsubscribeFromPush: () => Promise<boolean>;
  isSupported: () => boolean;
  getSubscription: () => Promise<PushSubscription | null>;
}

export const usePushNotifications = (): PushNotificationService => {
  const [registration, setRegistration] =
    useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    const registerServiceWorker = async () => {
      if ("serviceWorker" in navigator) {
        try {
          const registration = await navigator.serviceWorker.register("/sw.js");
          console.log("Service worker registered successfully:", registration);
          setRegistration(registration);
        } catch (error) {
          console.error("Service worker registration failed:", error);
        }
      }
    };

    registerServiceWorker();
  }, []);

  const isSupported = (): boolean => {
    return (
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window
    );
  };

  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported()) {
      console.log("Push notifications are not supported");
      return false;
    }

    if (Notification.permission === "granted") {
      return true;
    }

    if (Notification.permission === "denied") {
      console.log("Push notifications are denied");
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === "granted";
  };

  const subscribeToPush = async (): Promise<PushSubscription | null> => {
    console.log("🔔 Starting push notification subscription...");

    const hasPermission = await requestPermission();
    if (!hasPermission) {
      console.log("❌ Push notification permission denied");
      return null;
    }
    console.log("✅ Push notification permission granted");

    try {
      // Ensure service worker is registered and ready
      let serviceWorkerRegistration = registration;

      if (!serviceWorkerRegistration) {
        console.log("Waiting for service worker registration...");
        if ("serviceWorker" in navigator) {
          serviceWorkerRegistration = await navigator.serviceWorker.register(
            "/sw.js"
          );
          setRegistration(serviceWorkerRegistration);
        } else {
          console.log("Service worker not supported");
          return null;
        }
      }

      // Wait for service worker to be ready
      console.log("⏳ Waiting for service worker to be ready...");
      await navigator.serviceWorker.ready;
      console.log("✅ Service worker is ready");

      // Make sure we have an active service worker
      if (!serviceWorkerRegistration.active) {
        console.log("⏳ Waiting for service worker to become active...");
        await new Promise((resolve) => {
          const checkActive = () => {
            if (serviceWorkerRegistration.active) {
              console.log("✅ Service worker is now active");
              resolve(true);
            } else {
              setTimeout(checkActive, 100);
            }
          };
          checkActive();
        });
      } else {
        console.log("✅ Service worker already active");
      }

      // You'll need to generate VAPID keys for production
      const vapidPublicKey =
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
        "BEl62iUYgUivxIkv69yViEuiBIa40HI95uweWGnIQxDRKh3lKFKL5wSzsBOJU1KP_-QaLy_kDfGXPYI1KS8ZxAU";

      console.log("🔑 Creating push subscription with VAPID key...");
      const subscription =
        await serviceWorkerRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });
      console.log(
        "✅ Push subscription created successfully:",
        subscription.endpoint.substring(0, 50) + "..."
      );

      // Send subscription to your server
      console.log("🌐 Sending subscription to server...");
      const response = await fetch("http://localhost:3000/push/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(subscription),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Server error:", response.status, errorText);
        throw new Error(
          `Server responded with ${response.status}: ${errorText}`
        );
      }

      const result = await response.json();
      console.log("✅ Server response:", result);

      return subscription;
    } catch (error) {
      console.error("Failed to subscribe to push notifications:", error);
      return null;
    }
  };

  const unsubscribeFromPush = async (): Promise<boolean> => {
    try {
      // Ensure service worker is ready
      if ("serviceWorker" in navigator) {
        const serviceWorkerRegistration = await navigator.serviceWorker.ready;
        const subscription =
          await serviceWorkerRegistration.pushManager.getSubscription();

        if (subscription) {
          await subscription.unsubscribe();

          // Remove subscription from server
          await fetch("http://localhost:3000/push/unsubscribe", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify(subscription),
          });
        }
      }
      return true;
    } catch (error) {
      console.error("Failed to unsubscribe from push notifications:", error);
      return false;
    }
  };

  const getSubscription = async (): Promise<PushSubscription | null> => {
    try {
      // Ensure service worker is ready
      if ("serviceWorker" in navigator) {
        const serviceWorkerRegistration = await navigator.serviceWorker.ready;
        return await serviceWorkerRegistration.pushManager.getSubscription();
      }
      return null;
    } catch (error) {
      console.error("Failed to get subscription:", error);
      return null;
    }
  };

  return {
    requestPermission,
    subscribeToPush,
    unsubscribeFromPush,
    isSupported,
    getSubscription,
  };
};

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Component to handle push notification setup
export const PushNotificationManager: React.FC = () => {
  const pushService = usePushNotifications();
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if already subscribed
    const checkSubscription = async () => {
      if (pushService.isSupported()) {
        try {
          const subscription = await pushService.getSubscription();
          setSubscribed(!!subscription);
        } catch (error) {
          console.error("Error checking subscription:", error);
          setSubscribed(false);
        }
      }
    };

    // Add a small delay to ensure service worker registration is complete
    const timer = setTimeout(checkSubscription, 500);

    return () => clearTimeout(timer);
  }, [pushService]);

  const handleSubscribe = async () => {
    console.log("🚀 Starting subscription process...");
    setLoading(true);
    try {
      const subscription = await pushService.subscribeToPush();
      console.log("📱 Subscription result:", subscription);

      setSubscribed(!!subscription);
      if (subscription) {
        console.log("✅ Successfully subscribed to push notifications");
        alert(
          "Successfully enabled loan reminders! You will now receive notifications about your loans."
        );
      } else {
        console.log("❌ Subscription failed");
        alert(
          "Failed to enable notifications. Please check your browser settings and try again."
        );
      }
    } catch (error) {
      console.error("❌ Failed to subscribe:", error);
      alert("Error enabling notifications: " + (error as Error).message);
    } finally {
      setLoading(false);
      console.log("🏁 Subscription process completed");
    }
  };

  const handleUnsubscribe = async () => {
    setLoading(true);
    try {
      const success = await pushService.unsubscribeFromPush();
      if (success) {
        setSubscribed(false);
        console.log("Successfully unsubscribed from push notifications");
      }
    } catch (error) {
      console.error("Failed to unsubscribe:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!pushService.isSupported()) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      {subscribed ? (
        <button
          onClick={handleUnsubscribe}
          disabled={loading}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
        >
          {loading ? "Unsubscribing..." : "Disable Notifications"}
        </button>
      ) : (
        <button
          onClick={handleSubscribe}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? "Subscribing..." : "Enable Loan Reminders"}
        </button>
      )}
    </div>
  );
};
