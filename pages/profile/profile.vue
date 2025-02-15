<template>
  <view class="profile-container">
    <!-- 用户信息 -->
    <view class="user-info">
      <image class="avatar" :src="userInfo.avatar || '/static/default-avatar.png'"></image>
      <view class="user-detail">
        <text class="username">{{userInfo.nickname || '未登录'}}</text>
        <text class="user-id" v-if="userInfo.id">ID: {{userInfo.id}}</text>
      </view>
    </view>
    
    <!-- 功能列表 -->
    <view class="function-list">
      <view class="function-item" v-for="(item, index) in functions" 
            :key="index" @tap="handleFunction(item)">
        <text class="function-icon">{{item.icon}}</text>
        <text class="function-name">{{item.name}}</text>
        <text class="arrow">></text>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      userInfo: {},
      functions: [
        {id: 'favorite', name: '我的收藏', icon: '⭐'},
        {id: 'notification', name: '消息通知', icon: '🔔'},
        {id: 'settings', name: '系统设置', icon: '⚙️'},
        {id: 'about', name: '关于我们', icon: 'ℹ️'}
      ]
    }
  },
  methods: {
    handleFunction(func) {
      switch(func.id) {
        case 'favorite':
          uni.navigateTo({url: '/pages/profile/favorite'});
          break;
        case 'notification':
          uni.navigateTo({url: '/pages/profile/notification'});
          break;
        case 'settings':
          uni.navigateTo({url: '/pages/profile/settings'});
          break;
        case 'about':
          uni.navigateTo({url: '/pages/profile/about'});
          break;
      }
    }
  }
}
</script>

<style>
.profile-container {
  background: #f5f5f5;
}
.user-info {
  display: flex;
  align-items: center;
  padding: 40rpx;
  background: #fff;
}
.avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 60rpx;
  margin-right: 30rpx;
}
.function-list {
  margin-top: 20rpx;
  background: #fff;
}
.function-item {
  display: flex;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1px solid #eee;
}
.function-icon {
  margin-right: 20rpx;
}
.function-name {
  flex: 1;
}
.arrow {
  color: #999;
}
</style> 