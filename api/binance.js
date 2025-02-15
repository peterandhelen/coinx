const BASE_URL = 'https://api.binance.com/api/v3';

export default {
  // 获取K线数据
  async getKlineData(symbol, interval, limit = 500) {
    try {
      const { data } = await uni.request({
        url: `${BASE_URL}/klines`,
        method: 'GET',
        data: {
          symbol: symbol,
          interval: interval,
          limit: limit
        }
      });
      return data;
    } catch (error) {
      console.error('获取K线数据失败:', error);
      throw error;
    }
  },
  
  // 获取所有交易对
  async getAllSymbols() {
    try {
      const { data } = await uni.request({
        url: `${BASE_URL}/exchangeInfo`,
        method: 'GET'
      });
      return data.symbols.filter(item => item.status === 'TRADING');
    } catch (error) {
      console.error('获取交易对失败:', error);
      throw error;
    }
  },

  // 获取24小时行情数据
  async get24hrTicker() {
    try {
      const { data } = await uni.request({
        url: `${BASE_URL}/ticker/24hr`,
        method: 'GET'
      });
      return data;
    } catch (error) {
      console.error('获取24小时行情数据失败:', error);
      throw error;
    }
  },
  
  // 获取最新价格
  async getLatestPrice(symbol) {
    try {
      const { data } = await uni.request({
        url: `${BASE_URL}/ticker/price`,
        method: 'GET',
        data: { symbol }
      });
      return data;
    } catch (error) {
      console.error('获取最新价格失败:', error);
      throw error;
    }
  }
} 