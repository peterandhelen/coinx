<template>
  <view class="chart-container">
    <canvas canvas-id="klineChart" id="klineChart" 
            :style="{ width: width + 'px', height: height + 'px' }"
            type="2d">
    </canvas>
  </view>
</template>

<script>
import uCharts from '@qiun/ucharts';
import { formatTime } from '@/utils/formatter.js';

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
              name: ['MA5', 'MA10', 'MA20'],
              day: [5, 10, 20],
              color: ['#1890ff', '#2fc25b', '#facc14']
            }
          },
          column: {
            width: 8
          }
        }
      }
    }
  },
  watch: {
    klineData: {
      handler: 'updateChart',
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
    
    updateChart() {
      if (!klineChart || !this.klineData.length) return;
      
      const categories = [];
      const candleData = [];
      const volumeData = [];
      
      this.klineData.forEach(item => {
        categories.push(formatTime(item[0]));
        candleData.push([
          parseFloat(item[1]), // 开盘价
          parseFloat(item[4]), // 收盘价
          parseFloat(item[3]), // 最低价
          parseFloat(item[2])  // 最高价
        ]);
        volumeData.push(parseFloat(item[5]));
      });
      
      const config = {
        categories: categories,
        series: [{
          name: 'K线',
          type: 'candle',
          data: candleData
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
}
</style> 