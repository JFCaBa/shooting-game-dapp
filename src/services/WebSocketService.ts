// src/services/WebSocketService.ts

import { API_ENDPOINTS } from '../constants/endpoints';
import { GameMessage } from '../types/game';

type WebSocketCallback = (message: GameMessage) => void;

export class WebSocketService {
  private static instance: WebSocketService;
  private socket: WebSocket | null = null;
  public isConnected = false;
  private isConnecting = false;
  private reconnectAttempts = 0;
  private cleanup = false;
  private readonly maxReconnectAttempts = 5;
  private readonly reconnectDelay = 3000;
  private pingTimer: NodeJS.Timer | null = null;
  private callbacks: WebSocketCallback[] = [];

  private constructor() {
    // Private constructor for singleton
  }

  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  connect() {
    if (this.cleanup) {
      console.log('[WebSocket] Cleanup in progress, skipping connect');
      return;
    }

    if (this.isConnecting) {
      console.log('[WebSocket] Already connecting');
      return;
    }

    if (this.isConnected && this.socket?.readyState === WebSocket.OPEN) {
      console.log('[WebSocket] Already connected');
      return;
    }

    console.log('[WebSocket] Connecting...');
    this.setupConnection();
  }

  private setupConnection() {
    this.isConnecting = true;
    this.socket = new WebSocket(process.env.REACT_APP_WS_URL!);

    this.socket.onopen = () => {
      console.log('[WebSocket] Connected');
      this.isConnected = true;
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      this.startPingTimer();

      // Notify connection established
      this.callbacks.forEach((callback) =>
        callback({
          type: 'websocket_connected',
          playerId: '',
          data: {},
        } as any)
      );
    };

    this.socket.onmessage = (event) => {
      try {
        if (event.data === 'pong') {
          console.log('WebSocket: Received pong');
          return;
        }

        const message = JSON.parse(event.data) as GameMessage;
        this.callbacks.forEach((callback) => callback(message));
      } catch (error) {
        console.error('WebSocket: Failed to parse message:', error);
      }
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket: Error occurred', error);
      this.isConnected = false;
      this.isConnecting = false;
      this.handleDisconnect();
    };

    this.socket.onclose = (event) => {
      if (this.cleanup) return;

      console.log('[WebSocket] Closed:', event.code);
      this.handleDisconnect();
    };
  }

  disconnect() {
    this.cleanup = true;
    this.stopPingTimer();
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.isConnected = false;
    this.isConnecting = false;
  }

  reconnect() {
    this.cleanup = false;
    this.connect();
  }

  send(message: GameMessage) {
    if (!this.isConnected || !this.socket) {
      console.warn('WebSocket: Cannot send message - not connected', message);
      return;
    }

    try {
      console.log('WebSocket: Sending message:', message);
      this.socket.send(JSON.stringify(message));
    } catch (error) {
      console.error('WebSocket: Failed to send message:', error);
    }
  }

  addMessageListener(callback: WebSocketCallback) {
    if (!this.callbacks.includes(callback)) {
      console.log('WebSocket: Adding message listener');
      this.callbacks.push(callback);
    }
  }

  removeMessageListener(callback: WebSocketCallback) {
    console.log('WebSocket: Removing message listener');
    this.callbacks = this.callbacks.filter((cb) => cb !== callback);
  }

  private handleDisconnect() {
    if (
      !this.isConnecting &&
      this.reconnectAttempts < this.maxReconnectAttempts
    ) {
      this.reconnectAttempts++;
      console.log(
        `WebSocket: Attempting to reconnect in ${this.reconnectDelay}ms (Attempt ${this.reconnectAttempts})`
      );
      setTimeout(() => this.connect(), this.reconnectDelay);
    } else {
      console.log(
        'WebSocket: Max reconnection attempts reached or already connecting'
      );
    }
  }

  private startPingTimer() {
    this.stopPingTimer();
    console.log('WebSocket: Starting ping timer');
    this.pingTimer = setInterval(() => this.sendPing(), 30000);
  }

  private stopPingTimer() {
    if (this.pingTimer) {
      console.log('WebSocket: Stopping ping timer');
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private sendPing() {
    if (this.socket && this.isConnected) {
      console.log('WebSocket: Sending ping');
      this.socket.send('ping');
    }
  }
}

export const webSocketService = WebSocketService.getInstance();
