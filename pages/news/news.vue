<template>
  <view class="news-container">
    <!-- 资讯分类标签 -->
    <scroll-view class="category-scroll" scroll-x>
      <view class="category-list">
        <view class="category-item" 
              v-for="(item, index) in categories" 
              :key="index"
              :class="{active: currentCategory === item.id}"
              @tap="changeCategory(item.id)">
          {{item.name}}
        </view>
      </view>
    </scroll-view>
    
    <!-- 资讯列表 -->
    <view class="news-list">
      <view class="news-item" v-for="(item, index) in newsList" 
            :key="index" @tap="goToDetail(item)">
        <view class="news-title">{{item.title}}</view>
        <view class="news-info">
          <text class="news-source">{{item.source}}</text>
          <text class="news-time">{{item.time}}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import newsApi from '@/api/news.js';

export default {
  data() {
    return {
      categories: [
        {id: 'all', name: '全部'},
        {id: 'flash', name: '快讯'},
        {id: 'article', name: '文章'},
        {id: 'announcement', name: '公告'}
      ],
      currentCategory: 'all',
      newsList: [],
      loading: false
    }
  },
  methods: {
    changeCategory(categoryId) {
      this.currentCategory = categoryId;
      this.loadNews();
    },
    async loadNews() {
      try {
        this.loading = true;
        const newsList = await newsApi.getNewsList(this.currentCategory);
        this.newsList = newsList;
      } catch (error) {
        uni.showToast({
          title: '加载新闻失败',
          icon: 'none'
        });
      } finally {
        this.loading = false;
      }
    },
    goToDetail(news) {
      uni.navigateTo({
        url: `/pages/news/detail?id=${news.id}`
      });
    }
  }
}
</script>

<style>
.category-scroll {
  white-space: nowrap;
  border-bottom: 1px solid #eee;
}
.category-list {
  display: flex;
  padding: 20rpx;
}
.category-item {
  padding: 10rpx 30rpx;
  margin-right: 20rpx;
  border-radius: 30rpx;
  background: #f5f5f5;
}
.category-item.active {
  background: #007AFF;
  color: #fff;
}
.news-item {
  padding: 20rpx;
  border-bottom: 1px solid #eee;
}
.news-info {
  font-size: 24rpx;
  color: #999;
  margin-top: 10rpx;
}
.news-time {
  margin-left: 20rpx;
}
</style> 