import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global error & quota monitoring for Google Maps Platform SDK
(window as unknown as { gm_authFailure?: () => void }).gm_authFailure = () => {
  window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
};

const origError = console.error;
console.error = (...args: unknown[]) => {
  const msg = args.map((a) => String(a)).join(' ');
  if (
    msg.includes('DEMO_MAP_ID') ||
    msg.includes('Unable to fetch configuration for mapId') ||
    msg.includes('without a valid Map ID') ||
    msg.includes('prevent use of Advanced Markers') ||
    msg.includes('OverQuotaMapError') ||
    msg.includes('QuotaExceededError') ||
    msg.includes('ApiProjectMapError') ||
    msg.includes('ExpiredKeyMapError') ||
    msg.includes('RefererNotAllowedMapError') ||
    msg.includes('Google Maps JavaScript API error') ||
    msg.includes('Script error.')
  ) {
    window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
    return;
  }
  origError.apply(console, args);
};

// Catch and suppress cross-origin script errors and unhandled rejections from external third-party SDKs
window.addEventListener(
  'error',
  (event) => {
    const msg = String(event.message || '');
    const file = String(event.filename || '');
    if (
      msg.includes('Script error') ||
      msg.includes('ResizeObserver') ||
      !file ||
      file.includes('maps.googleapis.com') ||
      file.includes('gstatic.com')
    ) {
      if (event.stopImmediatePropagation) event.stopImmediatePropagation();
      event.preventDefault();
      window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
      return true;
    }
  },
  true
);

window.onerror = function (msg, url) {
  const m = String(msg || '');
  const u = String(url || '');
  if (
    m.includes('Script error') ||
    m.includes('ResizeObserver') ||
    !u ||
    u.includes('maps.googleapis.com') ||
    u.includes('gstatic.com')
  ) {
    window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
    return true;
  }
  return false;
};

window.addEventListener(
  'unhandledrejection',
  (event) => {
    const reason = String(event.reason || '');
    if (
      reason.includes('OverQuotaMapError') ||
      reason.includes('QuotaExceededError') ||
      reason.includes('ApiProjectMapError') ||
      reason.includes('maps.googleapis.com') ||
      reason.includes('Script error.')
    ) {
      if (event.stopImmediatePropagation) event.stopImmediatePropagation();
      event.preventDefault();
      window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
    }
  },
  true
);

createRoot(document.getElementById('root')!).render(<App />);
