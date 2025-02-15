export default class BinanceWebSocket {
  constructor() {
    this.baseUrl = 'wss://stream.binance.com:9443/ws';
    this.ws = null;
    this.subscriptions = new Set();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.handlers = new Map();
    this.pingInterval = null;
    this.pongTimeout = null;
    this.pingTime = 1000; // 降低到1秒
    this.pongTime = 3000; // 降低到3秒
    this.buffer = new Map(); // 添加缓冲区
    this.bufferTimeout = null;
  }

  // 连接WebSocket
  connect() {
    if (this.ws) {
      this.ws.close();
    }

    this.ws = new WebSocket(this.baseUrl);
    
    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.resubscribe();
      this.startHeartbeat();
    };

    this.ws.onclose = () => {
      console.log('WebSocket closed');
      this.stopHeartbeat();
      this.reconnect();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleMessage(data);
    };
  }

  // 重新连接
  reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    setTimeout(() => {
      console.log('Attempting to reconnect...');
      this.connect();
    }, 1000 * Math.pow(2, this.reconnectAttempts));
  }

  // 订阅K线数据
  subscribeKline(symbol, interval, callback) {
    const stream = `${symbol.toLowerCase()}@kline_${interval}`;
    this.subscribe(stream);
    this.handlers.set(stream, callback);
  }

  // 订阅24小时行情
  subscribeTicker(symbol, callback) {
    const stream = `${symbol.toLowerCase()}@ticker`;
    this.subscribe(stream);
    this.handlers.set(stream, callback);
  }

  // 订阅全市场行情
  subscribeAllTickers(callback) {
    const stream = '!ticker@arr';
    this.subscribe(stream);
    this.handlers.set(stream, callback);
  }

  // 发送订阅消息
  subscribe(stream) {
    if (!this.subscriptions.has(stream)) {
      this.subscriptions.add(stream);
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          method: 'SUBSCRIBE',
          params: [stream],
          id: Date.now()
        }));
      }
    }
  }

  // 重新订阅
  resubscribe() {
    if (this.subscriptions.size > 0) {
      this.ws.send(JSON.stringify({
        method: 'SUBSCRIBE',
        params: Array.from(this.subscriptions),
        id: Date.now()
      }));
    }
  }

  // 处理消息
  handleMessage(data) {
    if (data.type === 'pong') {
      if (this.pongTimeout) {
        clearTimeout(this.pongTimeout);
        this.pongTimeout = null;
      }
      return;
    }

    // 使用 requestAnimationFrame 优化渲染
    if (Array.isArray(data)) {
      // 批量处理市场数据
      const handler = this.handlers.get('!ticker@arr');
      if (handler) {
        if (this.bufferTimeout) {
          clearTimeout(this.bufferTimeout);
        }
        
        // 更新缓冲区
        data.forEach(ticker => {
          this.buffer.set(ticker.s, ticker);
        });

        // 使用 requestAnimationFrame 在下一帧更新
        requestAnimationFrame(() => {
          if (this.buffer.size > 0) {
            handler(Array.from(this.buffer.values()));
            this.buffer.clear();
          }
        });
      }
    } else {
      // 单个数据直接处理
      if (data.e === 'kline') {
        const handler = this.handlers.get(`${data.s.toLowerCase()}@kline_${data.k.i}`);
        if (handler) handler(data.k);
      } else if (data.e === '24hrTicker') {
        const handler = this.handlers.get(`${data.s.toLowerCase()}@ticker`);
        if (handler) handler(data);
      }
    }
  }

  // 取消订阅
  unsubscribe(stream) {
    if (this.subscriptions.has(stream)) {
      this.subscriptions.delete(stream);
      this.handlers.delete(stream);
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          method: 'UNSUBSCRIBE',
          params: [stream],
          id: Date.now()
        }));
      }
    }
  }

  // 关闭连接
  close() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.subscriptions.clear();
    this.handlers.clear();
    this.stopHeartbeat();
  }

  startHeartbeat() {
    this.pingInterval = setInterval(() => {
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ method: 'ping' }));
        
        this.pongTimeout = setTimeout(() => {
          console.log('Pong timeout - reconnecting...');
          this.reconnect();
        }, this.pongTime);
      }
    }, this.pingTime);
  }

  stopHeartbeat() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    if (this.pongTimeout) {
      clearTimeout(this.pongTimeout);
      this.pongTimeout = null;
    }
  }
} 