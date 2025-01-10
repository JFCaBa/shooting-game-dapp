import { initializeApp } from 'firebase/app';
import {
  getMessaging,
  getToken,
  onMessage,
  Messaging,
  MessagePayload,
} from 'firebase/messaging';

export class FirebaseService {
  private static instance: FirebaseService;
  private messaging: Messaging | null = null;
  private vapidKey = process.env.REACT_APP_FIREBASE_VAPID_KEY;
  private isInitialized = false;

  private constructor() {
    this.initializeFirebase();
  }

  private initializeFirebase(): void {
    try {
      const firebaseConfig = {
        apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
        authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
        storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.REACT_APP_FIREBASE_APP_ID,
      };

      console.log('Initializing Firebase with config:', {
        ...firebaseConfig,
        apiKey: '***', // Hide sensitive data in logs
      });

      const app = initializeApp(firebaseConfig);
      this.messaging = getMessaging(app);
      this.isInitialized = true;

      console.log('Firebase initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Firebase:', error);
      this.isInitialized = false;
      this.messaging = null;
    }
  }

  public static getInstance(): FirebaseService {
    if (!FirebaseService.instance) {
      FirebaseService.instance = new FirebaseService();
    }
    return FirebaseService.instance;
  }

  public isReady(): boolean {
    return this.isInitialized && this.messaging !== null;
  }

  private async ensureServiceWorkerRegistered(): Promise<ServiceWorkerRegistration> {
    try {
      // Check for existing service worker registration
      const existingReg = await navigator.serviceWorker.getRegistration(
        '/firebase-messaging-sw.js'
      );
      if (existingReg) {
        return existingReg;
      }

      // Register new service worker if none exists
      console.log('Registering new service worker');
      return await navigator.serviceWorker.register(
        '/firebase-messaging-sw.js',
        {
          scope: '/',
        }
      );
    } catch (error) {
      console.error('Service worker registration failed:', error);
      throw error;
    }
  }

  public async requestPermission(): Promise<string | null> {
    if (!this.isReady()) {
      console.error('Firebase is not initialized');
      return null;
    }

    try {
      const permission = await Notification.requestPermission();
      console.log('Notification permission response:', permission);

      if (permission === 'granted') {
        return this.getPushToken();
      }

      console.log('Notification permission denied.');
      return null;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return null;
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  private async getPushToken(): Promise<string | null> {
    if (!this.messaging || !this.vapidKey) {
      console.error('Messaging or VAPID key not available');
      return null;
    }

    try {
      console.log('Getting service worker registration...');
      const registration = await this.ensureServiceWorkerRegistered();

      // Convert VAPID key to the correct format
      const convertedVapidKey = this.urlBase64ToUint8Array(this.vapidKey);

      // Subscribe to push notifications
      console.log('Subscribing to push notifications...');
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });

      console.log('Push subscription:', subscription);

      // Verify the endpoint is from FCM
      const endpoint = subscription.endpoint;
      if (!endpoint.includes('fcm.googleapis.com')) {
        console.error('Not a valid FCM endpoint:', endpoint);
        return null;
      }

      // Get Firebase token
      console.log('Getting Firebase token...');
      const token = await getToken(this.messaging, {
        vapidKey: this.vapidKey,
        serviceWorkerRegistration: registration,
      });

      if (token) {
        console.log('Push token obtained');
        localStorage.setItem('pushToken', token);
        return token;
      }

      console.log('No registration token available.');
      return null;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  public setupMessageListener(
    callback: (payload: MessagePayload) => void
  ): void {
    if (!this.isReady() || !this.messaging) {
      console.error(
        'Cannot setup message listener: Firebase messaging is not initialized'
      );
      return;
    }

    try {
      onMessage(this.messaging, (payload) => {
        console.log('Message received:', payload);
        callback(payload);
      });
      console.log('Message listener setup successfully');
    } catch (error) {
      console.error('Error setting up message listener:', error);
    }
  }
}

export const firebaseService = FirebaseService.getInstance();
