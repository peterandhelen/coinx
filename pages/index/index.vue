<template>
	<view class="container">
		<!-- 搜索框 -->
		<view class="search-box">
			<input type="text" v-model="searchKey" placeholder="搜索币种" @input="onSearch"/>
			<view class="search-list" v-if="searchResults.length > 0">
				<view class="search-item" v-for="(item, index) in searchResults" 
					  :key="index" @tap="goToKline(item)">
					{{item.symbol}}
				</view>
			</view>
		</view>
		
		<!-- 热门币种K线图列表 -->
		<view class="kline-list">
			<view class="kline-item" v-for="(item, index) in hotSymbols" 
					:key="index" @tap="goToKline(item)">
				<kline-card :symbol="item"></kline-card>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				searchKey: '',
				searchResults: [],
				hotSymbols: ['BTCUSDT', 'ETHUSDT', 'BNBUSDT'], // 热门币种
			}
		},
		onLoad() {

		},
		methods: {
			onSearch() {
				// 实现搜索逻辑
			},
			goToKline(symbol) {
				uni.navigateTo({
					url: `/pages/kline/kline?symbol=${symbol}`
				})
			}
		}
	}
</script>

<style>
	.container {
		padding: 20rpx;
	}
	.search-box {
		position: relative;
		margin-bottom: 20rpx;
	}
	.search-list {
		position: absolute;
		width: 100%;
		background: #fff;
		z-index: 999;
	}
</style>
