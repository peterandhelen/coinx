export default {
  // 智能格式化价格
  formatPrice(price) {
    const num = parseFloat(price);
    if (num < 0.00001) {
      return num.toExponential(4);
    } else if (num < 0.0001) {
      return num.toFixed(8);
    } else if (num < 0.01) {
      return num.toFixed(6);
    } else if (num < 1) {
      return num.toFixed(4);
    } else if (num < 10) {
      return num.toFixed(3);
    } else {
      return num.toFixed(2);
    }
  },

  // 格式化成交量
  formatVolume(volume) {
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
}

export function formatTime(timestamp) {
  const date = new Date(timestamp);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hour = date.getHours().toString().padStart(2, '0');
  const minute = date.getMinutes().toString().padStart(2, '0');
  return `${month}-${day} ${hour}:${minute}`;
} 