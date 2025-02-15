<template>
  <view class="kline-container">
    <!-- K线图组件 -->
    <view class="chart-wrapper">
      <k-line-chart 
        :klineData="klineData"
        :indicators="activeIndicators"
        :width="chartWidth"
        :height="chartHeight"
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
  </view>
</template>

<script>
import KLineChart from '@/components/k-line-chart.vue';
import PricePrediction from '@/components/price-prediction.vue';
import binanceApi from '@/api/binance.js';

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
      activeIndicators: ['ma']
    }
  },
  onLoad(options) {
    this.symbol = options.symbol;
    const systemInfo = uni.getSystemInfoSync();
    this.chartWidth = systemInfo.windowWidth;
    this.chartHeight = systemInfo.windowHeight * 0.6;
    this.loadKlineData();
  },
  methods: {
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
    }
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
</style> 