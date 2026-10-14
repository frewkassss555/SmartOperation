import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './design/fonts';
import './design/tokens.css';
import './design/base.css';
import { normalizeHash } from './app/router';
import { Shell } from './app/Shell';
import { applyRecurring } from './db/recurring';

normalizeHash();
// Repeating transactions (subscriptions, travel) are created when the app opens.
void applyRecurring();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Shell />
  </StrictMode>,
);
