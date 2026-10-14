import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './design/fonts';
import './design/tokens.css';
import './design/base.css';
import { normalizeHash } from './app/router';
import { Shell } from './app/Shell';

normalizeHash();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Shell />
  </StrictMode>,
);
