
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './style.css';

// ── Global scroll-reveal observer ───────────────────────────
// Watches every .reveal element on the page and adds
// the .visible class once it enters the viewport.
const startScrollReveal = () => {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    },
    { rootMargin: '-60px', threshold: 0.08 }
  );

  const observe = () => {
    document.querySelectorAll<HTMLElement>('.reveal:not(.visible)').forEach((el) => {
      io.observe(el);
    });
  };

  observe();

  // Re-scan after route changes / dynamic content
  const mo = new MutationObserver(observe);
  mo.observe(document.body, { childList: true, subtree: true });
};

// Run after first paint
requestAnimationFrame(startScrollReveal);

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
