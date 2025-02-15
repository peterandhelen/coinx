export default class BinanceWebSocket {
  constructor() {
    this.worker = null;
    this.handlers = new Map();
    this.isConnected = false;
    this.pendingStreams = new Set();
  }

  initWorker() {
    if (!this.worker) {
      this.worker = new Worker('/workers/websocket.worker.js');
      this.worker.onmessage = this.handleWorkerMessage.bind(this);
    }
  }

  connect(streams) {
    this.initWorker();
    const streamArray = Array.isArray(streams) ? streams : [streams];
    this.worker.postMessage({
      type: 'connect',
      data: { streams: streamArray }
    });
    this.isConnected = true;
  }

  handleWorkerMessage(event) {
    const { type, data } = event.data;
    const handler = this.handlers.get(type);
    
    if (handler) {
      try {
        handler(data);
      } catch (error) {
        console.error('Error in message handler:', error);
      }
    }
  }

  // 订阅市场行情
  subscribeAllTickers(callback) {
    const stream = '!ticker@arr';
    this.subscribe(stream, callback);
  }

  // 订阅单个K线
  subscribeKline(symbol, interval, callback) {
    const stream = `${symbol.toLowerCase()}@kline_${interval}`;
    this.subscribe(stream, callback);
  }

  subscribe(stream, callback) {
    this.handlers.set(stream, callback);
    this.pendingStreams.add(stream);
    
    if (this.isConnected) {
      this.connect(Array.from(this.pendingStreams));
    } else {
      this.connect(stream);
    }
  }

  unsubscribe(stream) {
    this.handlers.delete(stream);
    this.pendingStreams.delete(stream);
    if (this.worker) {
      this.worker.postMessage({
        type: 'unsubscribe',
        data: { stream }
      });
    }
  }

  close() {
    if (this.worker) {
      this.worker.postMessage({ type: 'disconnect' });
      this.worker.terminate();
      this.worker = null;
    }
    this.handlers.clear();
    this.pendingStreams.clear();
    this.isConnected = false;
  }
} 