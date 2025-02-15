// 处理K线数据格式
export function splitData(rawData) {
  const categoryData = [];
  const values = [];
  
  for (let i = 0; i < rawData.length; i++) {
    categoryData.push(rawData[i].splice(0, 1)[0]);
    values.push(rawData[i]);
  }
  return {
    categoryData: categoryData,
    values: values
  };
}

// 计算EMA
function calculateEMA(data, period) {
  const k = 2 / (period + 1);
  const result = [data[0]];
  
  for (let i = 1; i < data.length; i++) {
    result.push(data[i] * k + result[i - 1] * (1 - k));
  }
  
  return result;
}

// 计算各种技术指标和趋势分析
export const indicators = {
  // 计算移动平均线
  calculateMA(prices, period) {
    if (!prices || prices.length < period) return [];
    const result = [];
    for (let i = 0; i < prices.length; i++) {
      if (i < period - 1) {
        result.push(null);
        continue;
      }
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += prices[i - j];
      }
      result.push(+(sum / period).toFixed(8));
    }
    return result;
  },

  // 计算BOLL指标
  calculateBOLL(prices, period = 20, multiplier = 2) {
    const ma = this.calculateMA(prices, period);
    const upperBand = [];
    const lowerBand = [];
    
    for (let i = 0; i < prices.length; i++) {
      if (i < period - 1) {
        upperBand.push(null);
        lowerBand.push(null);
        continue;
      }
      
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += Math.pow(prices[i - j] - ma[i], 2);
      }
      const std = Math.sqrt(sum / period);
      upperBand.push(ma[i] + multiplier * std);
      lowerBand.push(ma[i] - multiplier * std);
    }
    
    return { middle: ma, upper: upperBand, lower: lowerBand };
  },

  // 计算KDJ指标
  calculateKDJ(highs, lows, closes, period = 9) {
    const rsv = [];
    const k = [];
    const d = [];
    const j = [];
    
    for (let i = 0; i < closes.length; i++) {
      if (i < period - 1) {
        rsv.push(null);
        k.push(50);
        d.push(50);
        j.push(50);
        continue;
      }
      
      let high = Math.max(...highs.slice(i - period + 1, i + 1));
      let low = Math.min(...lows.slice(i - period + 1, i + 1));
      let close = closes[i];
      
      let rsvValue = ((close - low) / (high - low)) * 100;
      rsv.push(rsvValue);
      
      k[i] = (2/3 * (k[i-1] || 50)) + (1/3 * rsvValue);
      d[i] = (2/3 * (d[i-1] || 50)) + (1/3 * k[i]);
      j[i] = 3 * k[i] - 2 * d[i];
    }
    
    return { k, d, j };
  },

  // 计算MACD指标
  calculateMACD(prices, shortPeriod = 12, longPeriod = 26, signalPeriod = 9) {
    const shortEMA = calculateEMA(prices, shortPeriod);
    const longEMA = calculateEMA(prices, longPeriod);
    const dif = shortEMA.map((short, i) => short - longEMA[i]);
    const dea = calculateEMA(dif, signalPeriod);
    const macd = dif.map((dif, i) => (dif - dea[i]) * 2);
    
    return { dif, dea, macd };
  },

  // 计算RSI指标
  calculateRSI(prices, period = 14) {
    const gains = [];
    const losses = [];
    const rsi = [];
    
    // 计算涨跌幅
    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      gains.push(change >= 0 ? change : 0);
      losses.push(change < 0 ? -change : 0);
    }
    
    // 计算RSI
    let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
    let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
    
    for (let i = 0; i < period; i++) {
      rsi.push(null);
    }
    
    for (let i = period; i < prices.length; i++) {
      avgGain = ((avgGain * (period - 1)) + gains[i - 1]) / period;
      avgLoss = ((avgLoss * (period - 1)) + losses[i - 1]) / period;
      
      const rs = avgGain / avgLoss;
      rsi.push(100 - (100 / (1 + rs)));
    }
    
    return rsi;
  },

  // 计算趋势强度
  calculateTrendStrength(prices, period = 14) {
    const changes = [];
    for (let i = 1; i < prices.length; i++) {
      changes.push(((prices[i] - prices[i - 1]) / prices[i - 1]) * 100);
    }
    
    const adx = [];
    const pdi = [];
    const ndi = [];
    
    // 计算方向指标
    for (let i = period - 1; i < changes.length; i++) {
      let sumUp = 0;
      let sumDown = 0;
      
      for (let j = 0; j < period; j++) {
        if (changes[i - j] > 0) sumUp += changes[i - j];
        if (changes[i - j] < 0) sumDown += Math.abs(changes[i - j]);
      }
      
      pdi.push(sumUp / period);
      ndi.push(sumDown / period);
      
      const dx = Math.abs(pdi[pdi.length - 1] - ndi[ndi.length - 1]) / 
                (pdi[pdi.length - 1] + ndi[ndi.length - 1]) * 100;
      
      if (adx.length === 0) {
        adx.push(dx);
      } else {
        adx.push((adx[adx.length - 1] * (period - 1) + dx) / period);
      }
    }
    
    return { adx, pdi, ndi };
  },

  // 预测价格趋势
  predictTrend(klineData) {
    try {
      const closes = klineData.map(k => parseFloat(k[4]));
      const volumes = klineData.map(k => parseFloat(k[5]));
      
      // 计算各种技术指标
      const macd = this.calculateMACD(closes);
      const rsi = this.calculateRSI(closes);
      const boll = this.calculateBOLL(closes);
      const trend = this.calculateTrendStrength(closes);
      
      // 添加错误检查
      if (!macd.macd || !rsi || !boll.upper || !trend.adx) {
        throw new Error('Invalid technical indicators data');
      }
      
      // 综合分析各指标
      const lastIndex = closes.length - 1;
      const signals = {
        macd: macd.macd[lastIndex] > 0 ? 1 : -1,
        rsi: rsi[lastIndex] > 70 ? -1 : rsi[lastIndex] < 30 ? 1 : 0,
        boll: closes[lastIndex] > boll.upper[lastIndex] ? -1 : 
              closes[lastIndex] < boll.lower[lastIndex] ? 1 : 0,
        trend: trend.adx[trend.adx.length - 1] > 25 ? 
               (trend.pdi[trend.pdi.length - 1] > trend.ndi[trend.ndi.length - 1] ? 1 : -1) : 0
      };
      
      // 计算综合得分
      const score = Object.values(signals).reduce((a, b) => a + b, 0);
      const probability = Math.abs(score) / Object.keys(signals).length * 100;
      
      // 计算目标价格
      const volatility = this.calculateVolatility(closes);
      const targetPrice = closes[lastIndex] * (1 + (score > 0 ? volatility : -volatility));
      
      return {
        direction: score > 0 ? '上涨' : score < 0 ? '下跌' : '盘整',
        probability: Math.min(probability, 100),
        targetPrice: targetPrice.toFixed(8),
        timeframe: this.estimateTimeframe(volatility),
        signals
      };
    } catch (error) {
      console.error('Error in predictTrend:', error);
      return {
        direction: '--',
        probability: 0,
        targetPrice: '--',
        timeframe: '--',
        signals: {
          macd: 0,
          rsi: 0,
          boll: 0,
          trend: 0
        }
      };
    }
  },

  // 计算波动率
  calculateVolatility(prices, period = 20) {
    if (prices.length < period) return 0;
    
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push(Math.log(prices[i] / prices[i - 1]));
    }
    
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
    
    return Math.sqrt(variance);
  },

  // 估计时间框架
  estimateTimeframe(volatility) {
    const hours = Math.round(24 / (volatility * 100));
    if (hours < 24) {
      return `${hours}小时内`;
    } else {
      const days = Math.round(hours / 24);
      return `${days}天内`;
    }
  }
};

// 为了兼容现有代码，提供单独的导出
export function calculateMA(prices, period) {
  return indicators.calculateMA(prices, period);
}

export function calculateMACD(prices, shortPeriod = 12, longPeriod = 26, signalPeriod = 9) {
  return indicators.calculateMACD(prices, shortPeriod, longPeriod, signalPeriod);
}

export function calculateRSI(prices, period = 14) {
  return indicators.calculateRSI(prices, period);
}

// 导出 EMA 计算函数
export { calculateEMA }; 