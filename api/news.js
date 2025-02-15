// 这里使用示例数据，实际项目中需要对接真实的新闻API
const NEWS_DATA = {
  flash: [
    {
      id: 1,
      title: 'BTC突破50000美元',
      content: '比特币价格突破50000美元大关...',
      time: '2024-02-20 10:00',
      source: 'CoinDesk'
    }
    // ... 更多数据
  ],
  article: [
    {
      id: 2,
      title: '加密货币市场分析',
      content: '本周加密货币市场分析报告...',
      time: '2024-02-20 09:00',
      source: 'CoinMarketCap'
    }
    // ... 更多数据
  ]
};

export default {
  async getNewsList(category = 'all', page = 1) {
    return new Promise(resolve => {
      setTimeout(() => {
        if (category === 'all') {
          resolve([...NEWS_DATA.flash, ...NEWS_DATA.article]);
        } else {
          resolve(NEWS_DATA[category] || []);
        }
      }, 500);
    });
  }
} 