import { scrapeReviews } from './scraper';
import mountFloatingButton from './components/FloatingButton';

const isProductPage = window.location.href.includes('/dp/');

if (isProductPage) {
  injectUI();
}

function getAsin(): string {
  return window.location.pathname.split('/dp/')[1]?.split('/')[0] ?? '';
}

function injectUI(): void {
  const container = document.createElement('div');
  container.id = 'amazon-ai-assistant-root';
  document.body.appendChild(container);

  mountFloatingButton(container, getAsin(), scrapeReviews);
}