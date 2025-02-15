<template>
  <view class="market-container">
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
        <text class="col price">{{formatPrice(item.lastPrice)}}</text>
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
      ]
    }
  },
  computed: {
    filteredMarketList() {
      let list = this.marketList;
      
      // 搜索过滤
      if (this.searchKey) {
        list = list.filter(item => 
          item.symbol.toLowerCase().includes(this.searchKey.toLowerCase())
        );
      }
      
      // 排序
      list = [...list].sort((a, b) => {
        switch(this.currentSort) {
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
      
      return list;
    }
  },
  onLoad() {
    this.loadMarketData();
  },
  methods: {
    async loadMarketData() {
      try {
        this.loading = true;
        const response = await binanceApi.get24hrTicker();
        // 只保留USDT交易对
        this.marketList = response.filter(item => item.symbol.endsWith('USDT'));
      } catch (error) {
        uni.showToast({
          title: '加载数据失败',
          icon: 'none'
        });
      } finally {
        this.loading = false;
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
      return parseFloat(price).toFixed(2);
    },
    
    formatChange(change) {
      return parseFloat(change).toFixed(2);
    },
    
    formatVolume(volume) {
      if (volume > 1000000) {
        return (volume / 1000000).toFixed(2) + 'M';
      } else if (volume > 1000) {
        return (volume / 1000).toFixed(2) + 'K';
      }
      return volume;
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
</style> 