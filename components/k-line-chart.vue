<template>
  <view class="chart-container">
    <qiun-data-charts 
      type="mix"
      :opts="opts"
      :chartData="chartData"
      :canvas2d="true"
      canvasId="klineChart"
    />
  </view>
</template>

<script>
import { formatTime } from '@/utils/formatter.js';

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
    },
    indicators: {
      type: Array,
      default: () => ['ma']
    }
  },
  data() {
    return {
      opts: {
        padding: [15, 15, 0, 15],
        enableScroll: true,
        enableScale: true,
        xAxis: {
          itemCount: 5,
          disableGrid: true,
          labelCount: 4,
          scrollShow: true,
          scrollAlign: 'right'
        },
        yAxis: {
          data: [
            {
              position: 'right',
              title: '价格',
              min: null, // 自动计算最小值
              max: null, // 自动计算最大值
              format: 'val'
            },
            {
              position: 'left',
              title: '成交量',
              min: 0,
              max: null,
              format: 'val',
              tofix: 0
            }
          ]
        },
        extra: {
          candle: {
            color: {
              upLine: '#00b897',
              upFill: '#00b897',
              downLine: '#ff4e3f',
              downFill: '#ff4e3f'
            }
          },
          column: {
            width: 8
          }
        }
      },
      chartData: {
        categories: [],
        series: []
      }
    }
  },
  watch: {
    klineData: {
      handler(newVal) {
        if (newVal.length > 0) {
          this.updateChart();
        }
      },
      deep: true
    }
  },
  methods: {
    updateChart() {
      const categories = [];
      const candleData = [];
      const volumeData = [];
      
      // 计算最大最小值用于Y轴自适应
      let maxPrice = -Infinity;
      let minPrice = Infinity;
      let maxVolume = -Infinity;
      
      this.klineData.forEach(item => {
        const timestamp = parseInt(item[0]);
        const open = parseFloat(item[1]);
        const high = parseFloat(item[2]);
        const low = parseFloat(item[3]);
        const close = parseFloat(item[4]);
        const volume = parseFloat(item[5]);
        
        categories.push(formatTime(timestamp));
        
        candleData.push([open, close, low, high]);
        volumeData.push(volume);
        
        // 更新最大最小值
        maxPrice = Math.max(maxPrice, high);
        minPrice = Math.min(minPrice, low);
        maxVolume = Math.max(maxVolume, volume);
      });

      // 设置Y轴范围
      this.opts.yAxis.data[0].min = minPrice * 0.998;
      this.opts.yAxis.data[0].max = maxPrice * 1.002;
      this.opts.yAxis.data[1].max = maxVolume * 1.1;

      this.chartData = {
        categories: categories,
        series: [
          {
            name: 'K线',
            type: 'candle',
            data: candleData
          },
          {
            name: '成交量',
            type: 'column',
            data: volumeData,
            yAxisIndex: 1
          }
        ]
      };
    }
  }
}
</script>

<style>
.chart-container {
  width: 100%;
  height: 100%;
  background: #fff;
}
</style> 