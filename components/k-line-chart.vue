<template>
  <view class="chart-container">
    <canvas canvas-id="klineChart" id="klineChart" 
            :style="{ width: width + 'px', height: height + 'px' }"
            type="2d">
    </canvas>
    <!-- 添加技术指标数据显示 -->
    <view class="indicators-info">
      <text class="price">{{currentPrice}}</text>
      <view class="ma-values">
        <text class="ma5">MA5: {{ma5}}</text>
        <text class="ma10">MA10: {{ma10}}</text>
        <text class="ma30">MA30: {{ma30}}</text>
      </view>
    </view>
  </view>
</template>

<script>
import uCharts from '@qiun/ucharts';
import { formatTime, formatPrice } from '@/utils/formatter.js';
import { indicators, calculateMA } from '@/utils/klineUtils';

let klineChart = null;

export default {
  name: 'k-line-chart',
  props: {
    klineData: {
      type: Array,
      default: () => []
    },
    width: {
      type: Number,
      default: 375
    },
    height: {
      type: Number,
      default: 400
    }
  },
  data() {
    return {
      currentPrice: '0.00',
      ma5: '0.00',
      ma10: '0.00',
      ma30: '0.00',
      opts: {
        type: 'mix',
        background: '#FFFFFF',
        padding: [15, 15, 0, 15],
        enableScroll: true,
        enableScale: true,
        legend: {
          show: false
        },
        xAxis: {
          type: 'category',
          scrollShow: true,
          itemCount: 5,
          disableGrid: true
        },
        yAxis: [{
          position: 'right',
          title: '价格',
          format: 'val',
          gridType: 'dash',
          dashLength: 4,
          data: []
        }, {
          position: 'left',
          title: '成交量',
          format: 'val',
          gridType: 'dash',
          dashLength: 4,
          data: []
        }],
        extra: {
          candle: {
            color: {
              upLine: '#00b897',
              upFill: '#00b897',
              downLine: '#ff4e3f',
              downFill: '#ff4e3f'
            },
            average: {
              show: true,
              name: ['MA5', 'MA10', 'MA30'],
              day: [5, 10, 30],
              color: ['#1890ff', '#2fc25b', '#facc14']
            }
          },
          column: {
            width: 8
          }
        }
      },
      updateQueue: [],
      isProcessing: false,
      processTimer: null
    }
  },
  watch: {
    klineData: {
      handler: 'queueUpdate',
      deep: true
    }
  },
  mounted() {
    this.initChart();
  },
  methods: {
    initChart() {
      const query = uni.createSelectorQuery().in(this);
      query.select('#klineChart')
        .fields({ node: true, size: true })
        .exec((res) => {
          if (res[0]) {
            const canvas = res[0].node;
            const ctx = canvas.getContext('2d');
            canvas.width = res[0].width * devicePixelRatio;
            canvas.height = res[0].height * devicePixelRatio;
            ctx.scale(devicePixelRatio, devicePixelRatio);
            
            klineChart = new uCharts({
              type: 'candle',
              context: ctx,
              width: this.width,
              height: this.height,
              categories: [],
              series: [],
              ...this.opts
            });
            
            this.updateChart();
          }
        });
    },
    
    queueUpdate(klineData) {
      this.updateQueue.push(klineData);
      if (!this.isProcessing) {
        this.processUpdateQueue();
      }
    },
    
    async processUpdateQueue() {
      if (this.updateQueue.length === 0) {
        this.isProcessing = false;
        return;
      }
      
      this.isProcessing = true;
      
      // 批量处理更新
      const updates = this.updateQueue.splice(0, 50);
      
      // 使用 requestAnimationFrame 优化渲染
      requestAnimationFrame(() => {
        try {
          this.updateChart(updates);
        } catch (error) {
          console.error('Error updating chart:', error);
        }
        
        // 继续处理队列中的其他更新
        setTimeout(() => {
          this.processUpdateQueue();
        }, 16); // 约60fps
      });
    },
    
    updateChart(updates) {
      if (!klineChart || !updates.length) return;
      
      const categories = [];
      const candleData = [];
      const volumeData = [];
      const closePrices = [];
      
      updates.forEach(item => {
        categories.push(formatTime(item[0]));
        const [timestamp, open, high, low, close, volume] = item.map(parseFloat);
        
        candleData.push([open, close, low, high]);
        volumeData.push(volume);
        closePrices.push(close);
      });
      
      // 计算移动平均线
      const ma5Data = calculateMA(5, closePrices);
      const ma10Data = calculateMA(10, closePrices);
      const ma30Data = calculateMA(30, closePrices);
      
      // 更新当前价格和均线数据
      const lastIndex = closePrices.length - 1;
      this.currentPrice = formatPrice(closePrices[lastIndex]);
      this.ma5 = formatPrice(ma5Data[lastIndex]);
      this.ma10 = formatPrice(ma10Data[lastIndex]);
      this.ma30 = formatPrice(ma30Data[lastIndex]);
      
      const config = {
        categories,
        series: [{
          name: 'K线',
          type: 'candle',
          data: candleData
        }, {
          name: 'MA5',
          type: 'line',
          data: ma5Data
        }, {
          name: 'MA10',
          type: 'line',
          data: ma10Data
        }, {
          name: 'MA30',
          type: 'line',
          data: ma30Data
        }, {
          name: '成交量',
          type: 'column',
          data: volumeData,
          yAxisIndex: 1
        }]
      };
      
      klineChart.updateData(config);
    }
  }
}
</script>

<style>
.chart-container {
  width: 100%;
  height: 100%;
  background: #fff;
  position: relative;
}

.indicators-info {
  position: absolute;
  top: 10rpx;
  left: 10rpx;
  background: rgba(0,0,0,0.7);
  padding: 10rpx;
  border-radius: 4rpx;
  color: #fff;
}

.price {
  font-size: 32rpx;
  font-weight: bold;
  display: block;
  margin-bottom: 10rpx;
}

.ma-values {
  display: flex;
  gap: 20rpx;
  font-size: 24rpx;
}

.ma5 { color: #1890ff; }
.ma10 { color: #2fc25b; }
.ma30 { color: #facc14; }
</style> 