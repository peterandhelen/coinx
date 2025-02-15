<template>
  <view class="prediction-container">
    <view class="prediction-header">
      <text class="title">价格预测</text>
      <text class="accuracy">历史准确率: {{historyAccuracy}}%</text>
    </view>
    
    <view class="prediction-content">
      <view class="prediction-item">
        <text class="label">预测方向</text>
        <text class="value" :class="prediction.direction === '上涨' ? 'up' : 'down'">
          {{prediction.direction}}
        </text>
      </view>
      
      <view class="prediction-item">
        <text class="label">目标价格</text>
        <text class="value">{{prediction.targetPrice}}</text>
      </view>
      
      <view class="prediction-item">
        <text class="label">预计时间</text>
        <text class="value">{{prediction.estimatedTime}}</text>
      </view>
      
      <view class="prediction-item">
        <text class="label">预测概率</text>
        <text class="value">{{prediction.probability}}%</text>
      </view>
    </view>
    
    <view class="prediction-detail">
      <view class="detail-item" v-for="(signal, index) in signals" :key="index">
        <text class="signal-name">{{signal.name}}</text>
        <text class="signal-value" :class="signal.direction">{{signal.value}}</text>
      </view>
    </view>
  </view>
</template>

<script>
import { calculateMACD, calculateRSI } from '@/utils/klineUtils';
import formatter from '@/utils/formatter';

export default {
  props: {
    klineData: {
      type: Array,
      required: true
    }
  },
  data() {
    return {
      prediction: {
        direction: '',
        targetPrice: 0,
        estimatedTime: '',
        probability: 0
      },
      historyAccuracy: 0,
      signals: []
    }
  },
  watch: {
    klineData: {
      handler(newVal) {
        if (newVal.length > 0) {
          this.analyzeTrend();
        }
      },
      deep: true
    }
  },
  methods: {
    analyzeTrend() {
      const data = {
        values: this.klineData
      };
      
      // 计算各种技术指标
      const macd = calculateMACD(data);
      const rsi = calculateRSI(data);
      
      // 分析信号
      const signals = this.analyzeSignals(macd, rsi, data);
      this.signals = signals;
      
      // 综合分析结果
      const prediction = this.generatePrediction(signals, data);
      this.prediction = prediction;
      
      // 计算历史准确率
      this.calculateHistoryAccuracy();
    },
    
    analyzeSignals(macd, rsi, data) {
      const signals = [];
      const currentPrice = parseFloat(data.values[data.values.length - 1][4]);
      
      // MACD信号
      const macdSignal = {
        name: 'MACD',
        value: macd.macd[macd.macd.length - 1] > 0 ? '看涨' : '看跌',
        direction: macd.macd[macd.macd.length - 1] > 0 ? 'up' : 'down',
        weight: 0.3
      };
      signals.push(macdSignal);
      
      // RSI信号
      const lastRSI = rsi[rsi.length - 1];
      const rsiSignal = {
        name: 'RSI',
        value: lastRSI > 70 ? '超买' : lastRSI < 30 ? '超卖' : '中性',
        direction: lastRSI > 70 ? 'down' : lastRSI < 30 ? 'up' : 'neutral',
        weight: 0.3
      };
      signals.push(rsiSignal);
      
      return signals;
    },
    
    generatePrediction(signals, data) {
      let bullishWeight = 0;
      let bearishWeight = 0;
      
      signals.forEach(signal => {
        if (signal.direction === 'up') {
          bullishWeight += signal.weight;
        } else if (signal.direction === 'down') {
          bearishWeight += signal.weight;
        }
      });
      
      const currentPrice = parseFloat(data.values[data.values.length - 1][4]);
      const volatility = this.calculateVolatility(data);
      
      const prediction = {
        direction: bullishWeight > bearishWeight ? '上涨' : '下跌',
        probability: Math.round(Math.max(bullishWeight, bearishWeight) / (bullishWeight + bearishWeight) * 100),
        targetPrice: this.calculateTargetPrice(currentPrice, volatility, bullishWeight > bearishWeight),
        estimatedTime: this.estimateTime(volatility)
      };
      
      return prediction;
    },
    
    calculateVolatility(data) {
      // 计算价格波动率
      const prices = data.values.map(item => parseFloat(item[4]));
      let sum = 0;
      for (let i = 1; i < prices.length; i++) {
        sum += Math.abs(prices[i] - prices[i - 1]) / prices[i - 1];
      }
      return sum / (prices.length - 1);
    },
    
    calculateTargetPrice(currentPrice, volatility, isBullish) {
      const movement = currentPrice * volatility * (isBullish ? 1 : -1);
      return formatter.formatPrice(currentPrice + movement);
    },
    
    estimateTime(volatility) {
      // 基于波动率估计时间
      const hours = Math.round(24 / (volatility * 100));
      if (hours < 24) {
        return `${hours}小时内`;
      } else {
        const days = Math.round(hours / 24);
        return `${days}天内`;
      }
    },
    
    calculateHistoryAccuracy() {
      // 这里应该实现历史预测准确率的计算
      // 需要存储历史预测记录并与实际结果对比
      this.historyAccuracy = 75; // 示例值
    }
  }
}
</script>

<style>
.prediction-container {
  background: #fff;
  padding: 20rpx;
  border-radius: 10rpx;
  margin: 20rpx;
}

.prediction-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.prediction-content {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
}

.prediction-item {
  background: #f5f5f5;
  padding: 20rpx;
  border-radius: 8rpx;
}

.label {
  font-size: 24rpx;
  color: #666;
}

.value {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  margin-top: 10rpx;
}

.prediction-detail {
  margin-top: 20rpx;
  border-top: 1px solid #eee;
  padding-top: 20rpx;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10rpx;
}

.up { color: #00b897; }
.down { color: #ff4e3f; }
.neutral { color: #666; }
</style> 