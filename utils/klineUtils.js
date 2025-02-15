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

// 计算MA线
export function calculateMA(dayCount, data) {
  const result = [];
  for (let i = 0; i < data.values.length; i++) {
    if (i < dayCount) {
      result.push('-');
      continue;
    }
    let sum = 0;
    for (let j = 0; j < dayCount; j++) {
      sum += data.values[i - j][1];
    }
    result.push((sum / dayCount).toFixed(2));
  }
  return result;
}

// 计算MACD
export function calculateMACD(data, shortPeriod = 12, longPeriod = 26, signalPeriod = 9) {
  const closePrices = data.values.map(item => parseFloat(item[4]));
  const emaShort = calculateEMA(closePrices, shortPeriod);
  const emaLong = calculateEMA(closePrices, longPeriod);
  
  const dif = [];
  for (let i = 0; i < closePrices.length; i++) {
    dif.push(emaShort[i] - emaLong[i]);
  }
  
  const dea = calculateEMA(dif, signalPeriod);
  const macd = [];
  
  for (let i = 0; i < dif.length; i++) {
    macd.push((dif[i] - dea[i]) * 2);
  }
  
  return {
    dif: dif,
    dea: dea,
    macd: macd
  };
}

// 计算RSI
export function calculateRSI(data, period = 14) {
  const closePrices = data.values.map(item => parseFloat(item[4]));
  const gains = [];
  const losses = [];
  
  for (let i = 1; i < closePrices.length; i++) {
    const difference = closePrices[i] - closePrices[i - 1];
    gains.push(Math.max(difference, 0));
    losses.push(Math.max(-difference, 0));
  }
  
  const rsi = [];
  let avgGain = gains.slice(0, period).reduce((a, b) => a + b) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b) / period;
  
  for (let i = period; i < closePrices.length; i++) {
    const rs = avgGain / avgLoss;
    rsi.push(100 - (100 / (1 + rs)));
    
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
  }
  
  return rsi;
} 