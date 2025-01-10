importScripts(
  'https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js'
);
importScripts(
  'https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js'
);

firebase.initializeApp({
  apiKey: 'AIzaSyDzmJuw4mHe7K-S2iAmyV2wQVVd1BD1Da8',
  authDomain: 'shootingdapp.firebaseapp.com',
  projectId: 'shootingdapp',
  storageBucket: 'shootingdapp.firebasestorage.app',
  messagingSenderId: '740112866631',
  appId: '1:740112866631:web:7d1358f25133127bb1c062',
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Received background message:', payload);

  const { title, body, icon } = payload.notification || {};

  const notificationOptions = {
    body: body || 'New game update!',
    icon: icon || '/logo192.png',
    badge: '/logo192.png',
    tag: 'shooting-game-notification',
    data: payload.data || {},
  };

  self.registration.showNotification(
    title || 'Shooting Game',
    notificationOptions
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  event.notification.close();

  // Focus or open the app
  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        if (clientList.length > 0) {
          let client = clientList[0];
          for (let i = 0; i < clientList.length; i++) {
            if (clientList[i].focused) {
              client = clientList[i];
            }
          }
          return client.focus();
        }
        return clients.openWindow('/');
      })
  );
});
