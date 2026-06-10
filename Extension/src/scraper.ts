import { Review } from './types';

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function getHtml(url: string): Promise<Document | null> {
  if (!url) return null;

  const result = await chrome.runtime.sendMessage({
    type: 'SCRAPE_URL',
    url,
  });

  if (!result?.html) {
    console.warn('No HTML returned for:', url);
    return null;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(result.html, 'text/html');

  const isBlocked =
    doc.querySelector('form[action="/errors/validateCaptcha"]') ||
    doc.title?.toLowerCase().includes('robot check');

  if (isBlocked) {
    console.warn('Amazon bot-check triggered.');
    return null;
  }

  return doc;
}

export function extractNextPageUrl(doc: Document, asin: string): string | null {
  const raw = doc
    .querySelector('a[data-hook="show-more-button"]')
    ?.getAttribute('data-reviews-state-param');

  if (!raw) return null;

  const { pageNumber, nextPageToken } = JSON.parse(raw);

  return `https://www.amazon.in/product-reviews/${asin}/ref=cm_cr_arp_d_paging_btm?_encoding=UTF8&ie=UTF8&reviewerType=all_reviews&pageNumber=${pageNumber}&nextPageToken=${nextPageToken}`;
}

function extractReviews(doc: Document, seenBodies: Set<string>): Review[] {
  const elements = doc.querySelectorAll('[data-hook="review"]');
  const reviews: Review[] = [];

  elements.forEach((el) => {
    const titleEl = el.querySelector('a[data-hook="review-title"]');
    const titleSpans = titleEl?.querySelectorAll('span');
    const title = titleSpans?.[titleSpans.length - 1]?.textContent?.trim() ?? '';

    const body = el.querySelector('[data-hook="review-body"]')?.textContent?.trim() ?? '';
    const ratingText = el.querySelector('[data-hook="review-star-rating"]')?.textContent?.trim() ?? '';
    const rating = ratingText ? parseFloat(ratingText) : null;
    const verified = !!el.querySelector('[data-hook="avp-badge"]');
    const date = el.querySelector('[data-hook="review-date"]')?.textContent?.trim() ?? '';

    if (body && !seenBodies.has(body) && body.length > 10) {
      seenBodies.add(body);
      reviews.push({ title, body, rating, verified, date });
    }
  });

  return reviews;
}

export async function scrapeReviews(asin: string, limit: number = 20): Promise<Review[]> {
  const totalReviews: Review[] = [];
  const seenBodies = new Set<string>();
  const visitedUrls = new Set<string>();
  let currentPage = 1;

  const startUrl = `https://www.amazon.in/product-reviews/${asin}?pageNumber=1&reviewerType=all_reviews&sortBy=recent`;
  let currentUrl = startUrl;
  let doc = await getHtml(startUrl);

  while (doc && totalReviews.length < limit) {
    const titleSpans = [...(doc.querySelectorAll('[data-hook="review-title"] span') || [])];
    const firstReview = titleSpans.find(span =>
      span.textContent!.trim().length > 0 &&
      !span.classList.contains('a-icon-alt') &&
      !span.classList.contains('a-letter-space')
    );
    console.log(`Page ${currentPage} first review:`, firstReview?.textContent?.trim());

    const reviews = extractReviews(doc, seenBodies);
    totalReviews.push(...reviews);
    console.log(`Page scraped: ${reviews.length} | Total: ${totalReviews.length}`);

    if (reviews.length === 0) {
      console.warn('No new reviews, stopping.');
      break;
    }

    const nextUrl = extractNextPageUrl(doc, asin);
    if (!nextUrl || visitedUrls.has(nextUrl)) break;

    visitedUrls.add(nextUrl);
    currentUrl = nextUrl;

    await delay(2000 + Math.random() * 1000);
    doc = await getHtml(currentUrl);
    currentPage++;
  }

  console.log(`Scraped ${totalReviews.length} reviews`, totalReviews);
  return totalReviews;
}