<template>
  <view class="kline-container">
    <!-- K线图组件 -->
    <view class="chart-wrapper">
      <k-line-chart 
        :klineData="klineData"
        :indicators="activeIndicators"
        :width="chartWidth"
        :height="chartHeight"
        ref="klineChart"
      />
    </view>
    
    <!-- 周期选择 -->
    <scroll-view class="period-selector" scroll-x>
      <view class="period-list">
        <view class="period-item" 
              v-for="(period, index) in periods" 
              :key="index"
              :class="{active: currentPeriod === period.value}"
              @tap="changePeriod(period.value)">
          {{period.label}}
        </view>
      </view>
    </scroll-view>
    
    <!-- 指标选择 -->
    <scroll-view class="indicator-selector" scroll-x>
      <view class="indicator-list">
        <view class="indicator-item" 
              v-for="(indicator, index) in indicators" 
              :key="index"
              :class="{active: activeIndicators.includes(indicator.value)}"
              @tap="toggleIndicator(indicator.value)">
          {{indicator.label}}
        </view>
      </view>
    </scroll-view>
    
    <!-- 价格预测 -->
    <price-prediction :klineData="klineData" />
    
    <!-- 添加更新延迟显示 -->
    <view class="update-info">
      <text>更新延迟: {{updateDelay}}</text>
    </view>
    
    <!-- 价格趋势分析 -->
    <view class="trend-analysis">
      <view class="trend-header">
        <text class="title">趋势分析</text>
        <text class="time">{{currentTime}}</text>
      </view>
      <view class="trend-content">
        <view class="trend-item">
          <text class="label">短期趋势(10分钟)</text>
          <text :class="['value', shortTrend.direction]">{{shortTrend.text}}</text>
        </view>
        <view class="trend-item">
          <text class="label">中期趋势(30分钟)</text>
          <text :class="['value', midTrend.direction]">{{midTrend.text}}</text>
        </view>
        <view class="trend-item">
          <text class="label">长期趋势(1小时)</text>
          <text :class="['value', longTrend.direction]">{{longTrend.text}}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import KLineChart from '@/components/k-line-chart.vue';
import PricePrediction from '@/components/price-prediction.vue';
import binanceApi from '@/api/binance.js';
import BinanceWebSocket from '@/api/websocket.js';
import { calculateMA, calculateMACD, calculateRSI } from '@/utils/klineUtils.js';
import { formatTime } from '@/utils/formatter.js';

export default {
  components: {
    KLineChart,
    PricePrediction
  },
  data() {
    return {
      symbol: '',
      klineData: [],
      chartWidth: 375,
      chartHeight: 500,
      currentPeriod: '1m',
      periods: [
        {label: '1分钟', value: '1m'},
        {label: '5分钟', value: '5m'},
        {label: '15分钟', value: '15m'},
        {label: '1小时', value: '1h'},
        {label: '4小时', value: '4h'},
        {label: '1天', value: '1d'},
        {label: '1周', value: '1w'},
        {label: '1月', value: '1M'}
      ],
      indicators: [
        {label: 'MA', value: 'ma'},
        {label: 'BOLL', value: 'boll'},
        {label: 'KDJ', value: 'kdj'},
        {label: 'MACD', value: 'macd'},
        {label: 'RSI', value: 'rsi'}
      ],
      activeIndicators: ['ma'],
      ws: null,
      lastUpdate: null,
      updateInterval: null,
      updateDelay: null,
      currentTime: '',
      shortTrend: { direction: '', text: '' },
      midTrend: { direction: '', text: '' },
      longTrend: { direction: '', text: '' },
      lastKline: null,
      updateStats: {
        count: 0,
        totalDelay: 0,
        maxDelay: 0,
        minDelay: Infinity
      }
    }
  },
  onLoad(options) {
    this.symbol = options.symbol;
    const systemInfo = uni.getSystemInfoSync();
    this.chartWidth = systemInfo.windowWidth;
    this.chartHeight = systemInfo.windowHeight * 0.6;
    
    // 先加载历史数据
    this.loadInitialData();
  },
  onShow() {
    // 页面显示时才连接WebSocket
    if (!this.ws) {
      this.ws = new BinanceWebSocket();
      this.subscribeToUpdates();
    }
  },
  onHide() {
    // 页面隐藏时关闭WebSocket
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  },
  methods: {
    async loadInitialData() {
      try {
        uni.showLoading({ title: '加载中' });
        
        // 获取历史K线数据
        const response = await binanceApi.getKlineData(this.symbol, this.currentPeriod, 500);
        
        if (Array.isArray(response) && response.length > 0) {
          // 格式化K线数据
          this.klineData = response.map(item => ([
            item[0], // 开盘时间
            item[1], // 开盘价
            item[2], // 最高价
            item[3], // 最低价
            item[4], // 收盘价
            item[5], // 成交量
            item[6], // 收盘时间
            item[7], // 成交额
            item[8], // 成交笔数
            item[9], // 主动买入成交量
            item[10] // 主动买入成交额
          ]));
          
          // 初始化图表
          this.$nextTick(() => {
            if (this.$refs.klineChart) {
              this.$refs.klineChart.updateChart(this.klineData);
            }
          });
          
          // 分析趋势
          if (this.klineData.length > 30) {
            this.analyzeTrend();
          }
        } else {
          throw new Error('Invalid kline data');
        }
      } catch (error) {
        console.error('Error loading kline data:', error);
        uni.showToast({
          title: '加载数据失败',
          icon: 'none'
        });
      } finally {
        uni.hideLoading();
      }
    },
    subscribeToUpdates() {
      if (!this.ws) return;
      
      // 取消之前的订阅
      if (this.currentStream) {
        this.ws.unsubscribe(this.currentStream);
      }
      
      // 订阅新的K线数据
      this.currentStream = `${this.symbol.toLowerCase()}@kline_${this.currentPeriod}`;
      this.ws.subscribeKline(this.symbol, this.currentPeriod, (data) => {
        if (Array.isArray(data)) {
          data.forEach(kline => this.updateKline(kline));
        } else {
          this.updateKline(data);
        }
      });
    },
    updateKline(kline) {
      try {
        if (!kline || !this.klineData.length) return;
        
        const now = Date.now();
        this.lastUpdate = now;
        
        // 更新K线数据
        const lastIndex = this.klineData.length - 1;
        const newKlineData = [
          kline.t, // 开盘时间
          kline.o, // 开盘价
          kline.h, // 最高价
          kline.l, // 最低价
          kline.c, // 收盘价
          kline.v, // 成交量
          kline.T, // 收盘时间
          kline.q, // 成交额
          kline.n, // 成交笔数
          kline.V, // 主动买入成交量
          kline.Q  // 主动买入成交额
        ];

        if (lastIndex >= 0 && kline.t === this.klineData[lastIndex][0]) {
          // 更新当前K线
          this.$set(this.klineData, lastIndex, newKlineData);
        } else {
          // 添加新K线
          this.klineData.push(newKlineData);
          
          // 保持数据量
          if (this.klineData.length > 500) {
            this.klineData.shift();
          }
        }

        // 更新图表
        this.$nextTick(() => {
          if (this.$refs.klineChart) {
            this.$refs.klineChart.updateChart(this.klineData);
          }
        });

        // 更新统计信息
        this.updateStats.count++;
        const delay = now - kline.T;
        this.updateStats.totalDelay += delay;
        this.updateStats.maxDelay = Math.max(this.updateStats.maxDelay, delay);
        this.updateStats.minDelay = Math.min(this.updateStats.minDelay, delay);
        this.updateDelay = (delay / 1000).toFixed(2);

      } catch (error) {
        console.error('Error updating kline:', error);
      }
    },
    updateTicker(data) {
      // 处理24小时行情数据
      console.log('24小时行情:', data);
    },
    changePeriod(period) {
      this.currentPeriod = period;
      this.loadKlineData();
    },
    toggleIndicator(indicator) {
      const index = this.activeIndicators.indexOf(indicator);
      if (index > -1) {
        this.activeIndicators.splice(index, 1);
      } else {
        this.activeIndicators.push(indicator);
      }
    },
    async loadKlineData() {
      try {
        uni.showLoading({
          title: '加载中'
        });
        const data = await binanceApi.getKlineData(this.symbol, this.currentPeriod);
        this.klineData = data;
      } catch (error) {
        uni.showToast({
          title: '加载K线数据失败',
          icon: 'none'
        });
      } finally {
        uni.hideLoading();
      }
    },
    analyzeTrend() {
      try {
        if (!this.klineData.length) return;
        
        const closePrices = this.klineData.map(item => parseFloat(item[4]));
        
        // 计算各周期MA
        const ma5 = calculateMA(5, closePrices);
        const ma10 = calculateMA(10, closePrices);
        const ma30 = calculateMA(30, closePrices);
        
        // 计算RSI
        const rsi = calculateRSI(closePrices);
        
        // 更新趋势分析
        if (ma5.length && ma10.length && ma30.length && rsi.length) {
          this.updateTrendAnalysis(ma5, ma10, ma30, rsi);
          this.currentTime = formatTime(Date.now());
        }
      } catch (error) {
        console.error('Error analyzing trend:', error);
      }
    },
    
    updateTrendAnalysis(ma5, ma10, ma30, rsi) {
      const lastIndex = ma30.length - 1;
      
      // 短期趋势
      this.shortTrend = this.getTrendInfo(ma5[lastIndex], ma5[lastIndex - 1], rsi[lastIndex]);
      
      // 中期趋势
      this.midTrend = this.getTrendInfo(ma10[lastIndex], ma10[lastIndex - 1], rsi[lastIndex]);
      
      // 长期趋势
      this.longTrend = this.getTrendInfo(ma30[lastIndex], ma30[lastIndex - 1], rsi[lastIndex]);
    },
    
    getTrendInfo(currentMA, prevMA, rsi) {
      if (currentMA > prevMA) {
        return {
          direction: 'up',
          text: rsi > 70 ? '上涨(超买)' : '上涨'
        };
      } else if (currentMA < prevMA) {
        return {
          direction: 'down',
          text: rsi < 30 ? '下跌(超卖)' : '下跌'
        };
      }
      return {
        direction: 'neutral',
        text: '盘整'
      };
    },
    // 添加性能监控方法
    logPerformance() {
      console.log('Update Statistics:', {
        count: this.updateStats.count,
        avgDelay: (this.updateStats.totalDelay / this.updateStats.count).toFixed(2) + 'ms',
        maxDelay: this.updateStats.maxDelay + 'ms',
        minDelay: this.updateStats.minDelay + 'ms'
      });
    }
  },
  
  // 添加定时性能日志
  mounted() {
    setInterval(() => {
      this.logPerformance();
    }, 60000); // 每分钟记录一次性能数据
  }
}
</script>

<style>
.kline-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.chart-wrapper {
  height: 60vh;
  width: 100%;
}

.period-selector,
.indicator-selector {
  background: #fff;
  white-space: nowrap;
  padding: 10rpx 0;
}

.period-list,
.indicator-list {
  display: inline-flex;
  padding: 0 20rpx;
}

.period-item,
.indicator-item {
  padding: 10rpx 30rpx;
  margin-right: 20rpx;
  border-radius: 30rpx;
  background: #f5f5f5;
  font-size: 24rpx;
}

.period-item.active,
.indicator-item.active {
  background: #007AFF;
  color: #fff;
}

.update-info {
  position: absolute;
  top: 10rpx;
  right: 10rpx;
  background: rgba(0,0,0,0.5);
  color: #fff;
  padding: 4rpx 10rpx;
  border-radius: 4rpx;
  font-size: 24rpx;
}

.trend-analysis {
  background: #fff;
  padding: 20rpx;
  margin-top: 20rpx;
}

.trend-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.trend-header .title {
  font-weight: bold;
}

.trend-header .time {
  color: #666;
  font-size: 24rpx;
}

.trend-content {
  display: flex;
  justify-content: space-between;
}

.trend-item {
  flex: 1;
  text-align: center;
}

.trend-item .label {
  display: block;
  color: #666;
  font-size: 24rpx;
  margin-bottom: 10rpx;
}

.trend-item .value {
  font-weight: bold;
}

.trend-item .value.up {
  color: #00b897;
}

.trend-item .value.down {
  color: #ff4e3f;
}

.trend-item .value.neutral {
  color: #666;
}
</style> 