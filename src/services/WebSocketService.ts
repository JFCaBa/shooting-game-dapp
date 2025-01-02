// src/services/WebSocketService.ts

import { API_ENDPOINTS } from '../constants/endpoints';
import { GameMessage } from '../types/game';

type WebSocketCallback = (message: GameMessage) => void;

export class WebSocketService {
  private static instance: WebSocketService;
  private socket: WebSocket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
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

  connect(joinMessage: any) {
    if (this.isConnected || (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING))) {
      console.log('WebSocket: Already connected or connecting');
      return;
    }

    console.log('WebSocket: Attempting to connect to', API_ENDPOINTS.WEBSOCKET);
    
    try {
      this.socket = new WebSocket(API_ENDPOINTS.WEBSOCKET);
      
      this.socket.onopen = () => {
        console.log('WebSocket: Connection established');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.startPingTimer();
        
        // Send join message
        this.socket.send(JSON.stringify(joinMessage));
        
        // Notify any listeners that connection is established
        this.callbacks.forEach(callback => callback({
          type: 'websocket_connected',
          playerId: '',
          data: {}
        } as any));
      };

      this.socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as GameMessage;
          this.callbacks.forEach(callback => callback(message));
        } catch (error) {
          console.error('WebSocket: Failed to parse message:', error);
        }
      };

      this.socket.onclose = (event) => {
        console.log('WebSocket: Connection closed', event.code, event.reason);
        this.isConnected = false;
        this.handleDisconnect();
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket: Error occurred', error);
        this.isConnected = false;
        this.handleDisconnect();
      };

      return this.socket;

    } catch (error) {
      console.error('WebSocket: Failed to create connection:', error);
    }
  }

  disconnect() {
    console.log('WebSocket: Disconnecting...');
    if (this.socket) {
      this.socket.close();
    }
    this.stopPingTimer();
    this.isConnected = false;
    this.reconnectAttempts = 0;
  }

  send(message: GameMessage) {
    if (!this.isConnected || !this.socket) {
      console.warn('WebSocket: Cannot send message - not connected', message);
      return;
    }
    
    try {
      console.log('WebSocket: Sending message', message);
      this.socket.send(JSON.stringify(message));
    } catch (error) {
      console.error('WebSocket: Failed to send message:', error);
    }
  }

  addMessageListener(callback: WebSocketCallback) {
    console.log('WebSocket: Adding message listener');
    this.callbacks.push(callback);
  }

  removeMessageListener(callback: WebSocketCallback) {
    console.log('WebSocket: Removing message listener');
    this.callbacks = this.callbacks.filter(cb => cb !== callback);
  }

  private handleDisconnect() {
    console.log('WebSocket: Handling disconnect, attempt:', this.reconnectAttempts);
    this.isConnected = false;
    this.stopPingTimer();

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`WebSocket: Attempting to reconnect in ${this.reconnectDelay}ms`);
      setTimeout(() => this.connect({}), this.reconnectDelay);
    } else {
      console.log('WebSocket: Max reconnection attempts reached');
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
      // this.socket.send('ping');
    }
  }
}

export const webSocketService = WebSocketService.getInstance();