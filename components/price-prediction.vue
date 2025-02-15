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
import { indicators } from '@/utils/klineUtils';

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
        direction: '--',
        targetPrice: '--',
        estimatedTime: '--',
        probability: 0
      },
      historyAccuracy: 0,
      signals: [],
      isAnalyzing: false
    }
  },
  watch: {
    klineData: {
      handler(newVal) {
        // 确保有足够的数据进行分析
        if (newVal && newVal.length >= 30 && !this.isAnalyzing) {
          this.analyzeTrend();
        }
      },
      deep: true
    }
  },
  methods: {
    analyzeTrend() {
      try {
        if (!this.klineData || this.klineData.length < 30) return;
        
        // 使用新的分析工具进行预测
        const prediction = indicators.predictTrend(this.klineData);
        
        // 更新预测结果
        this.prediction = {
          direction: prediction.direction,
          targetPrice: prediction.targetPrice,
          estimatedTime: prediction.timeframe,
          probability: prediction.probability.toFixed(2)
        };
        
        // 更新信号指标
        this.signals = [
          {
            name: 'MACD',
            value: prediction.signals.macd > 0 ? '看涨' : '看跌',
            direction: prediction.signals.macd > 0 ? 'up' : 'down'
          },
          {
            name: 'RSI',
            value: prediction.signals.rsi > 0 ? '超卖' : 
                   prediction.signals.rsi < 0 ? '超买' : '中性',
            direction: prediction.signals.rsi > 0 ? 'up' : 
                      prediction.signals.rsi < 0 ? 'down' : 'neutral'
          },
          {
            name: 'BOLL',
            value: prediction.signals.boll > 0 ? '突破下轨' : 
                   prediction.signals.boll < 0 ? '突破上轨' : '区间内',
            direction: prediction.signals.boll > 0 ? 'up' : 
                      prediction.signals.boll < 0 ? 'down' : 'neutral'
          },
          {
            name: '趋势强度',
            value: prediction.signals.trend > 0 ? '强势上涨' : 
                   prediction.signals.trend < 0 ? '强势下跌' : '震荡',
            direction: prediction.signals.trend > 0 ? 'up' : 
                      prediction.signals.trend < 0 ? 'down' : 'neutral'
          }
        ];
        
      } catch (error) {
        console.error('Error analyzing trend:', error);
      }
    },

    calculateMACD(prices) {
      try {
        const shortPeriod = 12;
        const longPeriod = 26;
        const signalPeriod = 9;

        if (prices.length < Math.max(shortPeriod, longPeriod, signalPeriod)) {
          return { dif: [], dea: [], macd: [] };
        }

        return calculateMACD(prices, shortPeriod, longPeriod, signalPeriod);
      } catch (error) {
        console.error('Error calculating MACD:', error);
        return { dif: [], dea: [], macd: [] };
      }
    },

    calculateRSI(prices) {
      try {
        const period = 14;
        if (prices.length < period) {
          return [];
        }

        return calculateRSI(prices, period);
      } catch (error) {
        console.error('Error calculating RSI:', error);
        return [];
      }
    },

    analyzeSignals(macd, rsi, prices) {
      try {
        if (!macd.macd.length || !rsi.length || !prices.length) {
          return [];
        }

        const signals = [];
        const currentPrice = prices[prices.length - 1];

        // MACD信号
        if (macd.macd.length > 0) {
          const macdValue = macd.macd[macd.macd.length - 1];
          signals.push({
            name: 'MACD',
            value: macdValue > 0 ? '看涨' : '看跌',
            direction: macdValue > 0 ? 'up' : 'down',
            weight: 0.3
          });
        }

        // RSI信号
        if (rsi.length > 0) {
          const lastRSI = rsi[rsi.length - 1];
          signals.push({
            name: 'RSI',
            value: lastRSI > 70 ? '超买' : lastRSI < 30 ? '超卖' : '中性',
            direction: lastRSI > 70 ? 'down' : lastRSI < 30 ? 'up' : 'neutral',
            weight: 0.3
          });
        }

        return signals;
      } catch (error) {
        console.error('Error analyzing signals:', error);
        return [];
      }
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
      
      const currentPrice = parseFloat(data[data.length - 1]);
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
      const prices = data.map(item => parseFloat(item[4]));
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