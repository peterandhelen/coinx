// 智能格式化价格
function formatPrice(price, precision = null) {
  if (!price) return '0.00';
  const num = parseFloat(price);
  
  // 如果指定了精度，直接使用
  if (precision !== null) {
    return num.toFixed(precision);
  }
  
  // 根据价格范围自动判断精度
  if (num < 0.000000001) { // 9位小数
    return num.toExponential(8);
  } else if (num < 0.00001) { // 5位小数
    return num.toFixed(10);
  } else if (num < 0.0001) { // 4位小数
    return num.toFixed(8);
  } else if (num < 0.001) { // 3位小数
    return num.toFixed(7);
  } else if (num < 0.01) { // 2位小数
    return num.toFixed(6);
  } else if (num < 0.1) { // 1位小数
    return num.toFixed(5);
  } else if (num < 1) { // 整数
    return num.toFixed(4);
  } else if (num < 10) {
    return num.toFixed(3);
  } else if (num < 100) {
    return num.toFixed(2);
  } else {
    // 大数字使用千分位分隔
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
}

// 格式化涨跌幅
function formatChange(change) {
  const num = parseFloat(change);
  const sign = num >= 0 ? '+' : '';
  return sign + num.toFixed(2);
}

// 格式化成交量
function formatVolume(volume) {
  const num = parseFloat(volume);
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(2) + 'B';
  } else if (num >= 1000000) {
    return (num / 1000000).toFixed(2) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(2) + 'K';
  }
  return num.toFixed(2);
}

// 格式化时间
function formatTime(timestamp) {
  const date = new Date(timestamp);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hour = date.getHours().toString().padStart(2, '0');
  const minute = date.getMinutes().toString().padStart(2, '0');
  return `${month}-${day} ${hour}:${minute}`;
}

// 导出所有格式化函数
export {
  formatPrice,
  formatChange,
  formatVolume,
  formatTime
};

// 为了兼容之前的代码，保留默认导出
export default {
  formatPrice,
  formatChange,
  formatVolume
}; 