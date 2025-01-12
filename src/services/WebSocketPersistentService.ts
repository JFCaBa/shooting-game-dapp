import { GameMessage, MessageType } from '../types/game';

type WebSocketCallback = (message: GameMessage) => void;

export class WebSocketPersistentService {
  private static instance: WebSocketPersistentService;
  private socket: WebSocket | null = null;
  private isConnected = false;
  private isConnecting = false;
  private reconnectAttempts = 0;
  private cleanup = false;
  private readonly maxReconnectAttempts = 5;
  private readonly reconnectDelay = 3000;
  private pingTimer: NodeJS.Timer | null = null;
  private callbacks: Set<WebSocketCallback> = new Set();
  private messageQueue: GameMessage[] = [];
  private wsUrl: string;
  private playerId: string | null = null;

  private constructor() {
    this.wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:8182';
    console.log('[WebSocketPersistent] Initialized with URL:', this.wsUrl);
  }

  static getInstance(): WebSocketPersistentService {
    if (!WebSocketPersistentService.instance) {
      WebSocketPersistentService.instance = new WebSocketPersistentService();
    }
    return WebSocketPersistentService.instance;
  }

  initialize(playerId: string): void {
    this.playerId = playerId;
    if (!this.isConnected && !this.isConnecting) {
      this.connect();
    }
  }

  connect(): void {
    if (!this.playerId) {
      console.warn('[WebSocketPersistent] Cannot connect without playerId');
      return;
    }

    if (
      this.cleanup ||
      this.isConnecting ||
      (this.isConnected && this.socket?.readyState === WebSocket.OPEN)
    ) {
      return;
    }

    console.log('[WebSocketPersistent] Attempting connection to:', this.wsUrl);
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
      console.error('[WebSocketPersistent] Setup error:', error);
      this.handleError(error as Event);
    }
  }

  private handleOpen(): void {
    console.log('[WebSocketPersistent] Connected successfully');
    this.isConnected = true;
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.startPingTimer();

    // Send any queued messages
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) this.send(message);
    }

    // Notify connection established
    const message: GameMessage = {
      type: MessageType.WEBSOCKET_CONNECTED,
      playerId: this.playerId || '',
      data: {},
    };
    this.notifyListeners(message);
  }

  private handleMessage(event: MessageEvent): void {
    try {
      if (event.data === 'pong') {
        return;
      }

      const message = JSON.parse(event.data) as GameMessage;
      this.notifyListeners(message);
    } catch (error) {
      console.error('[WebSocketPersistent] Message parsing error:', error);
    }
  }

  private notifyListeners(message: GameMessage): void {
    this.callbacks.forEach((callback) => {
      try {
        callback(message);
      } catch (error) {
        console.error(
          '[WebSocketPersistent] Error in message listener:',
          error
        );
      }
    });
  }

  private handleError(event: Event): void {
    console.error('[WebSocketPersistent] Error occurred:', event);
    this.isConnected = false;
    this.isConnecting = false;
    this.handleDisconnect();
  }

  private handleClose(event: CloseEvent): void {
    if (this.cleanup) return;

    console.log(`[WebSocketPersistent] Closed with code: ${event.code}`);
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
      setTimeout(() => this.connect(), this.reconnectDelay);
    }
  }

  disconnect(): void {
    this.cleanup = true;
    this.stopPingTimer();
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.isConnected = false;
    this.isConnecting = false;
    this.playerId = null;
  }

  send(message: GameMessage): void {
    if (!this.isConnected || !this.socket) {
      this.messageQueue.push(message);
      return;
    }

    try {
      const messageStr = JSON.stringify(message);
      this.socket.send(messageStr);
    } catch (error) {
      console.error('[WebSocketPersistent] Send error:', error);
      this.messageQueue.push(message);
    }
  }

  addMessageListener(callback: WebSocketCallback): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  removeMessageListener(callback: WebSocketCallback): void {
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
}

export const webSocketPersistentService =
  WebSocketPersistentService.getInstance();
