const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');

const TOKEN = process.env.TOKEN; // Thay bằng token thật
const CHANNEL_ID = '1376571924343160963'; // ID kênh bạn muốn bot gửi giá mỗi giờ

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Map viết tắt → tên thật trên CoinGecko
const coinMap = {
  btc: 'bitcoin',
  eth: 'ethereum',
  bnb: 'binancecoin',
  g7: 'game7', // nếu G7 có trên CoinGecko
  carv: 'carv', // tên token đúng trên coingecko là 'carv'
  ape: 'apecoin',
  ada: 'cardano',
  bera: 'berachain',
  scr: 'scroll',
  imx: 'immutable-x',
  sui: 'sui', 
  strk: 'starknet',
  link: 'chainlink',
  near: 'near',
  tia: 'celestia',
  inj: 'injective',
  ron: 'ronin',
  zk: 'zksync', // kiểm tra tên này có thật không
  cyber: 'cyberconnect',
  arb: 'arbitrum',
  pi: 'pi-network' // cần xác minh tên trên CoinGecko
};

client.once('ready', () => {
  console.log(`✅ Bot đã online với tên: ${client.user.tag}`);
  sendHourlyPrices(); // Gửi ngay lần đầu khi bot chạy
  setInterval(sendHourlyPrices, 60 * 60 * 1000); // Mỗi 1 giờ
});

client.on('messageCreate', async message => {
  if (message.author.bot) return;

  const args = message.content.trim().split(' ');
  const command = args[0];

  // Lệnh !gia <token>
  if (command === '!gia') {
    const input = args[1] || 'btc';
    const coin = coinMap[input.toLowerCase()] || input.toLowerCase();

    try {
      const res = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${coin}&vs_currencies=usd&include_24hr_change=true`);
      const price = res.data[coin].usd;
      const change = res.data[coin].usd_24h_change.toFixed(2);
      message.reply(`💰 Giá **${coin.toUpperCase()}**: **$${price}** (24h: ${change}%)`);
    } catch (err) {
      message.reply(`❌ Không tìm thấy token "${input}"`);
    }
  }

  // Lệnh !top
  if (command === '!top') {
    try {
      const res = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
        params: {
          vs_currency: 'usd',
          order: 'market_cap_desc',
          per_page: 10,
          page: 1
        }
      });

      const topCoins = res.data.map(coin =>
        `#${coin.market_cap_rank} **${coin.name} (${coin.symbol.toUpperCase()})**: $${coin.current_price} (24h: ${coin.price_change_percentage_24h.toFixed(2)}%)`
      ).join('\n');

      message.reply(`🌐 **Top 10 coin theo Market Cap:**\n${topCoins}`);
    } catch (err) {
      message.reply('❌ Không thể lấy dữ liệu top coin.');
    }
  }
});

// Tự động gửi giá mỗi 1 giờ
async function sendHourlyPrices() {
  const ids = ['bitcoin', 'ethereum', 'binancecoin', 'g7', 'carv'];
  const channel = await client.channels.fetch(CHANNEL_ID);
  try {
    const res = await axios.get(`https://api.coingecko.com/api/v3/simple/price`, {
      params: {
        ids: ids.join(','),
        vs_currencies: 'usd',
        include_24hr_change: 'true'
      }
    });

    const result = ids.map(id => {
      const info = res.data[id];
      if (!info) return `❌ Không có dữ liệu cho ${id}`;
      return `💰 ${id.toUpperCase()}: $${info.usd} (24h: ${info.usd_24h_change.toFixed(2)}%)`;
    }).join('\n');

    channel.send(`📊 **Cập nhật giá mỗi giờ:**\n${result}`);
  } catch (err) {
    console.error('Lỗi khi gửi cập nhật giá:', err.message);
  }
}

client.login(TOKEN);
