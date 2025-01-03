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
  private isConnecting = false;

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
    if (this.isConnecting) {
      console.log('WebSocket: Already attempting to connect');
      return;
    }

    if (this.isConnected || (this.socket && this.socket.readyState !== WebSocket.CLOSED)) {
      console.log('WebSocket: Already connected or connecting');
      return;
    }

    console.log('WebSocket: Attempting to connect to', API_ENDPOINTS.WEBSOCKET);
    this.isConnecting = true;
    
    try {
      this.socket = new WebSocket(API_ENDPOINTS.WEBSOCKET);
      
      this.socket.onopen = () => {
        console.log('WebSocket: Connection established');
        this.isConnected = true;
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.startPingTimer();
        
        if (joinMessage) {
          this.send(joinMessage);
        }
        
        // Notify connection established
        this.callbacks.forEach(callback => callback({
          type: 'websocket_connected',
          playerId: '',
          data: {}
        } as any));
      };

      this.socket.onmessage = (event) => {
        try {
          if (event.data === 'pong') {
            console.log('WebSocket: Received pong');
            return;
          }
          
          const message = JSON.parse(event.data) as GameMessage;
          this.callbacks.forEach(callback => callback(message));
        } catch (error) {
          console.error('WebSocket: Failed to parse message:', error);
        }
      };

      this.socket.onclose = (event) => {
        console.log('WebSocket: Connection closed', event.code, event.reason);
        this.isConnected = false;
        this.isConnecting = false;
        this.handleDisconnect();
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket: Error occurred', error);
        this.isConnected = false;
        this.isConnecting = false;
        this.handleDisconnect();
      };

    } catch (error) {
      console.error('WebSocket: Failed to create connection:', error);
      this.isConnecting = false;
    }
  }

  disconnect() {
    console.log('WebSocket: Disconnecting...');
    this.isConnected = false;
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.stopPingTimer();
    
    if (this.socket) {
      // Only close if the socket is not already closing or closed
      if (this.socket.readyState !== WebSocket.CLOSING && 
          this.socket.readyState !== WebSocket.CLOSED) {
        this.socket.close();
      }
      this.socket = null;
    }
  }

  send(message: GameMessage) {
    if (!this.isConnected || !this.socket) {
      console.warn('WebSocket: Cannot send message - not connected', message);
      return;
    }
    
    try {
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
    this.callbacks = this.callbacks.filter(cb => cb !== callback);
  }

  private handleDisconnect() {
    if (!this.isConnecting && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`WebSocket: Attempting to reconnect in ${this.reconnectDelay}ms (Attempt ${this.reconnectAttempts})`);
      setTimeout(() => this.connect({}), this.reconnectDelay);
    } else {
      console.log('WebSocket: Max reconnection attempts reached or already connecting');
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