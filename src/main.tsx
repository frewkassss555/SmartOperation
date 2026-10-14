import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './design/fonts';
import './design/tokens.css';
import './design/base.css';
import { normalizeHash } from './app/router';
import { Shell } from './app/Shell';
import { applyRecurring } from './db/recurring';
import { setupPwa } from './pwa/pwa';

normalizeHash();
setupPwa();
// Repeating transactions (subscriptions, travel) are created when the app opens.
void applyRecurring();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Shell />
  </StrictMode>,
);
