const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const CHANNEL_ID = '1376571924343160963';
const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const coinMap = {
  btc: 'bitcoin',
  eth: 'ethereum',
  bnb: 'binancecoin',
  g7: 'game7',
  carv: 'carv',
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
  zk: 'zksync',
  cyber: 'cyberconnect',
  arb: 'arbitrum',
  pi: 'pi-network',
  l3: 'layer3',
  dogs: 'dogs',
  sats: 'sats-ordinals'
};

client.once('ready', () => {
  console.log(`✅ Bot đã online với tên: ${client.user.tag}`);
  sendHourlyPrices();
  setInterval(sendHourlyPrices, 60 * 60 * 1000);
});

client.on('messageCreate', async message => {
  if (message.author.bot) return;

  const args = message.content.trim().split(' ');
  const command = args[0];

  if (command === '!gia') {
    const input = args[1] || 'btc';
    const coinId = await getCoinIdFromSymbol(input);

    if (!coinId) {
      return message.reply(`❌ Không tìm thấy token có ký hiệu "${input}".`);
    }

    try {
      const res = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
        headers: {
          'x-cg-api-key': COINGECKO_API_KEY,
          'User-Agent': 'DiscordBot/1.0'
        },
        params: {
          ids: coinId,
          vs_currencies: 'usd',
          include_24hr_change: 'true'
        }
      });

      const data = res.data[coinId];
      if (!data) throw new Error('Không có dữ liệu trả về từ API');

      const price = data.usd;
      const change = data.usd_24h_change?.toFixed(2) ?? '0.00';
      message.reply(`💰 Giá **${coinId.toUpperCase()}**: **$${price}** (24h: ${change}%)`);
    } catch (err) {
      console.error('Lỗi khi lấy giá token:', err.message);
      message.reply(`❌ Không thể lấy giá "${input}" lúc này. Đảm bảo bạn nhập đúng ký hiệu token.`);
    }
  }

  if (command === '!top') {
    try {
      const res = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
        headers: {
          'x-cg-api-key': COINGECKO_API_KEY,
          'User-Agent': 'DiscordBot/1.0'
        },
        params: {
          vs_currency: 'usd',
          order: 'market_cap_desc',
          per_page: 10,
          page: 1
        }
      });

      const topCoins = res.data.map(coin =>
        `#${coin.market_cap_rank} **${coin.name} (${coin.symbol.toUpperCase()})**: $${coin.current_price} (24h: ${coin.price_change_percentage_24h?.toFixed(2) ?? 0}%)`
      ).join('\n');

      message.reply(`🌐 **Top 10 coin theo Market Cap:**\n${topCoins}`);
    } catch (err) {
      console.error('Lỗi khi lấy top coin:', err.message);
      message.reply('❌ Không thể lấy dữ liệu top coin.');
    }
  }
});

async function getCoinIdFromSymbol(symbol) {
  const lower = symbol.toLowerCase();
  if (coinMap[lower]) return coinMap[lower];

  try {
    const res = await axios.get('https://api.coingecko.com/api/v3/coins/list', {
      headers: {
        'x-cg-api-key': COINGECKO_API_KEY,
        'User-Agent': 'DiscordBot/1.0'
      }
    });

    const coins = res.data;
    const match = coins.find(c => c.symbol.toLowerCase() === lower);
    return match?.id || null;
  } catch (err) {
    console.error('Lỗi khi tra cứu symbol:', err.message);
    return null;
  }
}

async function sendHourlyPrices() {
  const ids = ['bitcoin', 'ethereum', 'binancecoin', 'game7', 'carv'];
  try {
    const channel = await client.channels.fetch(CHANNEL_ID);
    const res = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
      headers: {
        'x-cg-api-key': COINGECKO_API_KEY,
        'User-Agent': 'DiscordBot/1.0'
      },
      params: {
        ids: ids.join(','),
        vs_currencies: 'usd',
        include_24hr_change: 'true'
      }
    });

    const result = ids.map(id => {
      const info = res.data[id];
      if (!info) return `❌ Không có dữ liệu cho ${id}`;
      return `💰 ${id.toUpperCase()}: $${info.usd} (24h: ${info.usd_24h_change?.toFixed(2) ?? 0}%)`;
    }).join('\n');

    channel.send(`📊 **Cập nhật giá mỗi giờ:**\n${result}`);
  } catch (err) {
    console.error('Lỗi khi gửi cập nhật giá:', err.message);
  }
}

client.login(TOKEN);
