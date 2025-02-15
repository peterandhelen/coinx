let ws = null;
let reconnectTimeout = null;
const RECONNECT_DELAY = 5000;
const HEARTBEAT_INTERVAL = 3000;

// 缓存和节流相关
let dataBuffer = new Map();
let lastUpdateTime = new Map();
const UPDATE_THROTTLE = 200; // 200ms 节流

self.onmessage = function(e) {
  const { type, data } = e.data;
  
  switch (type) {
    case 'connect':
      connect(data.streams);
      break;
    case 'disconnect':
      disconnect();
      break;
  }
};

function connect(streams) {
  try {
    const url = `wss://stream.binance.com:9443/stream?streams=${streams.join('/')}`;
    ws = new WebSocket(url);
    
    ws.onopen = () => {
      console.log('WebSocket connected');
      startHeartbeat();
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        processData(data);
      } catch (error) {
        console.error('Error processing message:', error);
      }
    };
    
    ws.onclose = () => {
      console.log('WebSocket closed');
      scheduleReconnect();
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  } catch (error) {
    console.error('Error connecting to WebSocket:', error);
    scheduleReconnect();
  }
}

function processData(data) {
  const now = Date.now();
  const { stream, data: streamData } = data;
  
  // 使用节流控制更新频率
  const lastUpdate = lastUpdateTime.get(stream);
  if (lastUpdate && now - lastUpdate < UPDATE_THROTTLE) {
    // 更新缓冲区
    if (!dataBuffer.has(stream)) {
      dataBuffer.set(stream, []);
    }
    dataBuffer.get(stream).push(streamData);
    return;
  }
  
  // 发送数据到主线程
  const bufferedData = dataBuffer.get(stream) || [];
  if (bufferedData.length > 0) {
    bufferedData.push(streamData);
    self.postMessage({
      type: stream,
      data: bufferedData
    });
    dataBuffer.delete(stream);
  } else {
    self.postMessage({
      type: stream,
      data: [streamData]
    });
  }
  
  lastUpdateTime.set(stream, now);
}

function startHeartbeat() {
  setInterval(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ method: 'ping' }));
    }
  }, HEARTBEAT_INTERVAL);
}

function scheduleReconnect() {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
  }
  
  reconnectTimeout = setTimeout(() => {
    if (ws) {
      connect(Array.from(ws.streams));
    }
  }, RECONNECT_DELAY);
}

function disconnect() {
  if (ws) {
    ws.close();
    ws = null;
  }
  
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
  
  dataBuffer.clear();
  lastUpdateTime.clear();
} 