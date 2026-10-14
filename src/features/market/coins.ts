/** Default watch list; prices arrive with the quotes client. */
export const DEFAULT_COINS = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
  { id: 'solana', symbol: 'SOL', name: 'Solana' },
] as const;

export type Coin = (typeof DEFAULT_COINS)[number];

export function coinById(id: string): Coin {
  return DEFAULT_COINS.find((c) => c.id === id) ?? DEFAULT_COINS[0];
}
