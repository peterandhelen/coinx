<template>
  <view class="market-container">
    <!-- 添加更新延迟显示 -->
    <view class="update-info" v-if="updateDelay">
      <text>延迟: {{updateDelay}}s</text>
    </view>
    
    <!-- 搜索栏 -->
    <view class="search-bar">
      <input type="text" v-model="searchKey" placeholder="搜索币种" @input="onSearch"/>
    </view>
    
    <!-- 排序选项 -->
    <view class="sort-options">
      <view class="sort-item" 
            v-for="(item, index) in sortOptions" 
            :key="index"
            :class="{active: currentSort === item.value}"
            @tap="changeSort(item.value)">
        {{item.label}}
      </view>
    </view>

    <!-- 市场行情列表 -->
    <scroll-view class="market-list" scroll-y @scrolltolower="loadMore">
      <view class="market-header">
        <text class="col symbol">交易对</text>
        <text class="col price">最新价</text>
        <text class="col change">24h涨跌</text>
        <text class="col volume">24h成交量</text>
      </view>
      
      <view class="market-item" 
            v-for="(item, index) in filteredMarketList" 
            :key="index" 
            @tap="goToKline(item.symbol)">
        <text class="col symbol">{{formatSymbol(item.symbol)}}</text>
        <text class="col price" 
              :class="{ 
                'price-up': item.priceUp === true,
                'price-down': item.priceUp === false
              }">
          {{formatPrice(item.lastPrice)}}
        </text>
        <text class="col change" 
              :class="parseFloat(item.priceChangePercent) >= 0 ? 'up' : 'down'">
          {{formatChange(item.priceChangePercent)}}%
        </text>
        <text class="col volume">{{formatVolume(item.volume)}}</text>
      </view>
      
      <view class="loading" v-if="loading">加载中...</view>
    </scroll-view>
  </view>
</template>

<script>
import binanceApi from '@/api/binance.js';
import BinanceWebSocket from '@/api/websocket.js';
import formatter from '@/utils/formatter.js';

export default {
  data() {
    return {
      marketList: [],
      searchKey: '',
      loading: false,
      currentSort: 'volume',
      sortOptions: [
        { label: '成交量', value: 'volume' },
        { label: '涨跌幅', value: 'change' },
        { label: '最新价', value: 'price' }
      ],
      ws: null,
      marketMap: new Map(),
      lastPrices: new Map(),
      updateTime: Date.now(),
      updateDelay: null
    }
  },
  computed: {
    filteredMarketList() {
      const searchKey = this.searchKey.toLowerCase();
      const currentSort = this.currentSort;
      
      let list = this.marketList;
      
      // 搜索过滤
      if (searchKey) {
        list = list.filter(item => 
          item.symbol.toLowerCase().includes(searchKey)
        );
      }
      
      // 排序
      return list.sort((a, b) => {
        switch(currentSort) {
          case 'volume':
            return parseFloat(b.volume) - parseFloat(a.volume);
          case 'change':
            return parseFloat(b.priceChangePercent) - parseFloat(a.priceChangePercent);
          case 'price':
            return parseFloat(b.lastPrice) - parseFloat(a.lastPrice);
          default:
            return 0;
        }
      });
    }
  },
  onLoad() {
    // 先加载初始数据
    this.loadInitialData();
  },
  onShow() {
    // 页面显示时才连接WebSocket
    if (!this.ws) {
      this.ws = new BinanceWebSocket();
      this.ws.subscribeAllTickers(this.updateMarketData);
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
        this.loading = true;
        const response = await binanceApi.get24hrTicker();
        
        // 初始化市场数据
        this.marketMap.clear();
        const usdtPairs = response.filter(item => item.symbol.endsWith('USDT'));
        
        usdtPairs.forEach(item => {
          this.marketMap.set(item.symbol, {
            symbol: item.symbol,
            lastPrice: item.lastPrice,
            priceChange: item.priceChange,
            priceChangePercent: item.priceChangePercent,
            volume: item.volume,
            highPrice: item.highPrice,
            lowPrice: item.lowPrice
          });
        });
        
        this.marketList = Array.from(this.marketMap.values());
      } catch (error) {
        console.error('Error loading market data:', error);
        uni.showToast({
          title: '加载数据失败',
          icon: 'none'
        });
      } finally {
        this.loading = false;
      }
    },
    
    updateMarketData(data) {
      try {
        this.updateTime = Date.now();
        
        // 批量更新数据
        data.forEach(ticker => {
          if (ticker.s.endsWith('USDT')) {
            const prevPrice = this.marketMap.get(ticker.s)?.lastPrice;
            
            // 更新市场数据
            const marketData = {
              symbol: ticker.s,
              lastPrice: ticker.c,
              priceChange: ticker.p,
              priceChangePercent: ticker.P,
              volume: ticker.v,
              highPrice: ticker.h,
              lowPrice: ticker.l,
              priceUp: prevPrice ? parseFloat(ticker.c) > parseFloat(prevPrice) : null
            };
            
            this.marketMap.set(ticker.s, marketData);
          }
        });
        
        // 更新列表数据
        this.marketList = Array.from(this.marketMap.values());
        
        // 计算更新延迟
        const delay = Date.now() - this.updateTime;
        this.updateDelay = (delay / 1000).toFixed(2);
      } catch (error) {
        console.error('Error updating market data:', error);
      }
    },
    
    onSearch() {
      // 搜索功能通过computed属性实现
    },
    
    changeSort(sortType) {
      this.currentSort = sortType;
    },
    
    goToKline(symbol) {
      uni.navigateTo({
        url: `/pages/kline/kline?symbol=${symbol}`
      });
    },
    
    // 格式化函数
    formatSymbol(symbol) {
      return symbol.replace('USDT', '');
    },
    
    formatPrice(price) {
      return formatter.formatPrice(price);
    },
    
    formatChange(change) {
      return formatter.formatChange(change);
    },
    
    formatVolume(volume) {
      return formatter.formatVolume(volume);
    },
    
    loadMore() {
      // 实现加载更多逻辑
    }
  }
}
</script>

<style>
.market-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.search-bar {
  padding: 20rpx;
  background: #fff;
}

.search-bar input {
  background: #f5f5f5;
  padding: 10rpx 20rpx;
  border-radius: 30rpx;
}

.sort-options {
  display: flex;
  padding: 20rpx;
  background: #fff;
  border-bottom: 1px solid #eee;
}

.sort-item {
  padding: 10rpx 30rpx;
  margin-right: 20rpx;
  border-radius: 30rpx;
  background: #f5f5f5;
}

.sort-item.active {
  background: #007AFF;
  color: #fff;
}

.market-list {
  flex: 1;
  background: #fff;
}

.market-header {
  display: flex;
  padding: 20rpx;
  background: #f5f5f5;
  font-size: 24rpx;
  color: #666;
}

.market-item {
  display: flex;
  padding: 20rpx;
  border-bottom: 1px solid #eee;
}

.col {
  flex: 1;
  text-align: right;
}

.symbol {
  flex: 1.5;
  text-align: left;
  font-weight: bold;
}

.up { color: #00b897; }
.down { color: #ff4e3f; }

.loading {
  text-align: center;
  padding: 20rpx;
  color: #999;
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
  z-index: 999;
}

.price-up {
  animation: priceUp 0.5s ease-out;
  background: rgba(0,184,151,0.1);
}

.price-down {
  animation: priceDown 0.5s ease-out;
  background: rgba(255,78,63,0.1);
}

@keyframes priceUp {
  from {
    background: rgba(0,184,151,0.3);
  }
  to {
    background: transparent;
  }
}

@keyframes priceDown {
  from {
    background: rgba(255,78,63,0.3);
  }
  to {
    background: transparent;
  }
}
</style> 