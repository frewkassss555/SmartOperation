import { useEffect, useState } from 'react';
import { Button, Dialog, Field } from '../../design';
import { MAX_WATCH, type Watch } from '../../db/types';
import { RateLimitError, searchCoins, type SearchHit } from '../../lib/coingecko';
import { addCoin, coinLabel, moveCoin, removeCoin } from './coins';
import styles from './MarketSection.module.css';

const SEARCH_DELAY_MS = 400;

type Props = { open: boolean; onClose: () => void; list: readonly Watch[] };

export function WatchDialog({ open, onClose, list }: Props) {
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  // Search after a pause in typing: the keyless API is rate limited.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setHits([]);
      setMessage(null);
      return;
    }
    let cancelled = false;
    setMessage('Поиск…');
    const timer = window.setTimeout(async () => {
      try {
        const found = await searchCoins(q);
        if (cancelled) return;
        setHits(found);
        setMessage(found.length ? null : 'Ничего не найдено');
      } catch (error) {
        if (cancelled) return;
        setHits([]);
        setMessage(
          error instanceof RateLimitError
            ? 'Слишком много запросов, попробуйте через минуту'
            : navigator.onLine
              ? 'Поиск не ответил, попробуйте ещё раз'
              : 'Поиск работает только с сетью',
        );
      }
    }, SEARCH_DELAY_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query]);

  const full = list.length >= MAX_WATCH;
  const watched = new Set(list.map((w) => w.coinId));

  return (
    <Dialog open={open} onClose={onClose} kicker={`Монеты · ${list.length} из ${MAX_WATCH}`} title="Список монет" actions={<Button variant="primary" onClick={onClose}>Готово</Button>}>
      <ul className={styles.watchList}>
        {list.map((w, i) => (
          <li key={w.coinId} className={styles.watchRow}>
            <span className={styles.symbol}>{coinLabel(w)}</span>
            <span className={styles.coinName}>{w.name ?? w.coinId}</span>
            <span className={styles.watchTools}>
              <button type="button" className={styles.tool} disabled={i === 0} onClick={() => moveCoin(w.coinId, -1)} aria-label={`Поднять ${coinLabel(w)}`}>
                <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
                  <path d="M1 8 L6 3 L11 8" stroke="currentColor" strokeWidth="2" fill="none" />
                </svg>
              </button>
              <button type="button" className={styles.tool} disabled={i === list.length - 1} onClick={() => moveCoin(w.coinId, 1)} aria-label={`Опустить ${coinLabel(w)}`}>
                <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
                  <path d="M1 4 L6 9 L11 4" stroke="currentColor" strokeWidth="2" fill="none" />
                </svg>
              </button>
              <button type="button" className={styles.tool} disabled={list.length <= 1} onClick={() => removeCoin(w)} aria-label={`Убрать ${coinLabel(w)}`}>
                <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
                  <path d="M1 1 L11 11 M11 1 L1 11" stroke="currentColor" strokeWidth="2" fill="none" />
                </svg>
              </button>
            </span>
          </li>
        ))}
      </ul>

      <Field
        label="Добавить монету"
        type="search"
        placeholder="Название или тикер, например dogecoin"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        hint={full ? `В списке уже ${MAX_WATCH} монет — уберите одну, чтобы добавить новую` : undefined}
      />
      {message && <p className="label" role="status">{message}</p>}
      {hits.length > 0 && (
        <ul className={styles.watchList} aria-label="Результаты поиска">
          {hits.map((hit) => (
            <li key={hit.id} className={styles.watchRow}>
              <span className={styles.symbol}>{hit.symbol}</span>
              <span className={styles.coinName}>
                {hit.name}
                {hit.rank ? ` · #${hit.rank}` : ''}
              </span>
              <Button
                variant="secondary"
                disabled={full || watched.has(hit.id)}
                onClick={async () => {
                  if (await addCoin(hit)) setQuery('');
                }}
              >
                {watched.has(hit.id) ? 'В списке' : 'Добавить'}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Dialog>
  );
}
