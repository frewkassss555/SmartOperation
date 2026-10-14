// Serves deterministic CoinGecko responses to a Playwright context, built from the same
// generator as VITE_DEMO_MARKET (Node strips the TypeScript types on import).
import { demoChart, demoMarkets, demoSearch } from '../src/lib/demoMarket.ts';

export async function mockCoinGecko(context) {
  await context.route('https://api.coingecko.com/**', async (route) => {
    const url = new URL(route.request().url());
    let body;
    if (url.pathname.endsWith('/coins/markets')) {
      body = demoMarkets(url.searchParams.get('ids').split(',')).map((q) => ({
        id: q.id,
        symbol: q.symbol.toLowerCase(),
        name: q.name,
        current_price: q.price,
        price_change_percentage_24h: q.change24h,
        last_updated: new Date(q.updatedAt).toISOString(),
      }));
    } else if (url.pathname.includes('/market_chart')) {
      const id = url.pathname.split('/').at(-2);
      body = { prices: demoChart(id, Number(url.searchParams.get('days'))) };
    } else if (url.pathname.endsWith('/search')) {
      body = { coins: demoSearch(url.searchParams.get('query') ?? '').map((h) => ({ ...h, market_cap_rank: h.rank })) };
    } else {
      return route.fulfill({ status: 404, body: '{}' });
    }
    await route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(body) });
  });
}
