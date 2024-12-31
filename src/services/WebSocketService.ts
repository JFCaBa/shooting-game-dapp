// Based on WebSocketService.swift

import { API_ENDPOINTS } from '../constants/endpoints';
import { GameMessage, MessageType } from '../types/game';

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

  connect() {
    if (this.isConnected) return;

    this.socket = new WebSocket(API_ENDPOINTS.WEBSOCKET);
    
    this.socket.onopen = () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.startPingTimer();
    };

    this.socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as GameMessage;
        this.callbacks.forEach(callback => callback(message));
      } catch (error) {
        console.error('Failed to parse message:', error);
      }
    };

    this.socket.onclose = () => {
      this.handleDisconnect();
    };

    this.socket.onerror = () => {
      this.handleDisconnect();
    };
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
    }
    this.stopPingTimer();
    this.isConnected = false;
    this.reconnectAttempts = 0;
  }

  send(message: GameMessage) {
    if (!this.isConnected || !this.socket) return;
    
    try {
      this.socket.send(JSON.stringify(message));
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }

  addMessageListener(callback: WebSocketCallback) {
    this.callbacks.push(callback);
  }

  removeMessageListener(callback: WebSocketCallback) {
    this.callbacks = this.callbacks.filter(cb => cb !== callback);
  }

  private handleDisconnect() {
    this.isConnected = false;
    this.stopPingTimer();

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => this.connect(), this.reconnectDelay);
    }
  }

  private startPingTimer() {
    this.stopPingTimer();
    this.pingTimer = setInterval(() => this.sendPing(), 30000);
  }

  private stopPingTimer() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private sendPing() {
    if (this.socket && this.isConnected) {
      this.socket.send('ping');
    }
  }
}