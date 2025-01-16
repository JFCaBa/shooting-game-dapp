import { GameMessage } from '../types/game';

type WebSocketCallback = (message: GameMessage) => void;

export class WebSocketService {
  private static instance: WebSocketService;
  private socket: WebSocket | null = null;
  private isConnected = false;
  private isConnecting = false;
  private reconnectAttempts = 0;
  private cleanup = false;
  private readonly maxReconnectAttempts = 5;
  private readonly reconnectDelay = 3000;
  private pingTimer: NodeJS.Timer | null = null;
  private callbacks: Set<WebSocketCallback> = new Set();
  private wsUrl: string;

  private constructor() {
    this.wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:8182';
    console.log('[WebSocket] Initialized with URL:', this.wsUrl);
  }

  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  connect(): void {
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

    console.log('[WebSocket] Attempting connection to:', this.wsUrl);
    this.setupConnection();
  }

  private setupConnection(): void {
    try {
      this.isConnecting = true;
      this.socket = new WebSocket(this.wsUrl);

      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
      this.socket.onerror = this.handleError.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
    } catch (error) {
      console.error('[WebSocket] Setup error:', error);
      this.handleError(error as Event);
    }
  }

  private handleOpen(): void {
    console.log('[WebSocket] Connected successfully');
    this.isConnected = true;
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.startPingTimer();
  }

  private handleMessage(event: MessageEvent): void {
    try {
      if (event.data === 'pong') {
        return;
      }

      console.log('[WebSocket] Received message:', event.data);
      const message = JSON.parse(event.data) as GameMessage;
      this.notifyListeners(message);
    } catch (error) {
      console.error('[WebSocket] Message parsing error:', error);
    }
  }

  private notifyListeners(message: GameMessage): void {
    console.log(`[WebSocket] Notifying ${this.callbacks.size} listeners`);
    this.callbacks.forEach((callback) => {
      try {
        callback(message);
      } catch (error) {
        console.error('[WebSocket] Error in message listener:', error);
      }
    });
  }

  private handleError(event: Event): void {
    console.error('[WebSocket] Error occurred:', event);
    this.isConnected = false;
    this.isConnecting = false;
    this.handleDisconnect();
  }

  private handleClose(event: CloseEvent): void {
    if (this.cleanup) return;

    console.log(
      `[WebSocket] Closed with code: ${event.code}, reason: ${event.reason}`
    );
    this.isConnected = false;
    this.isConnecting = false;
    this.handleDisconnect();
  }

  private handleDisconnect(): void {
    if (
      !this.isConnecting &&
      this.reconnectAttempts < this.maxReconnectAttempts
    ) {
      this.reconnectAttempts++;
      console.log(
        `[WebSocket] Attempting to reconnect in ${this.reconnectDelay}ms (Attempt ${this.reconnectAttempts})`
      );
      setTimeout(() => this.connect(), this.reconnectDelay);
    } else {
      console.log(
        '[WebSocket] Max reconnection attempts reached or already connecting'
      );
    }
  }

  disconnect(): void {
    console.log('[WebSocket] Initiating disconnect');
    this.cleanup = true;
    this.stopPingTimer();
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.isConnected = false;
    this.isConnecting = false;
  }

  send(message: GameMessage): void {
    if (!this.isConnected || !this.socket) {
      console.warn('[WebSocket] Cannot send message - not connected:', message);
      return;
    }

    try {
      const messageStr = JSON.stringify(message);
      console.log('[WebSocket] Sending message:', messageStr);
      this.socket.send(messageStr);
    } catch (error) {
      console.error('[WebSocket] Send error:', error);
    }
  }

  addMessageListener(callback: WebSocketCallback): () => void {
    this.callbacks.clear();

    const callbackWrapper = (message: GameMessage) => {
      callback(message);
    };

    console.log(
      '[WebSocket] Adding message listener, current count:',
      this.callbacks.size
    );
    this.callbacks.add(callbackWrapper);
    console.log('[WebSocket] New listener count:', this.callbacks.size);

    // Return cleanup function that removes this specific wrapper
    return () => {
      console.log('[WebSocket] Removing specific message listener');
      this.callbacks.delete(callbackWrapper);
      console.log('[WebSocket] Remaining listeners:', this.callbacks.size);
    };
  }

  removeMessageListener(callback: WebSocketCallback): void {
    console.log('[WebSocket] Removing message listener');
    this.callbacks.delete(callback);
  }

  private startPingTimer(): void {
    this.stopPingTimer();
    this.pingTimer = setInterval(() => this.sendPing(), 30000);
  }

  private stopPingTimer(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private sendPing(): void {
    if (this.socket && this.isConnected) {
      this.socket.send('ping');
    }
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  reconnect(): void {
    console.log('[WebSocket] Manual reconnect requested');
    this.cleanup = false;
    this.reconnectAttempts = 0;
    this.connect();
  }
}
