const isProductPage = window.location.href.includes("/dp/");

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

if (isProductPage) {

  const startScraping = async () => {
    let { asin, reviewHref } = getProductMetaData();

    let totalReviews = [];
    let seenBodies = new Set();
    const limit = 20;
    const visitedUrls = new Set();
    let currentPage = 1; // ✅ declared here
    let currentUrl = reviewHref;
    let previousUrl = null;

    let reviewPageDoc = await getHtml(reviewHref); // ✅ fetched BEFORE the loop

    while (reviewPageDoc && totalReviews.length < limit) {

      const titleSpans = [...(reviewPageDoc?.querySelectorAll('[data-hook="review-title"] span') || [])];
      const firstReview = titleSpans.find(span => span.textContent.trim().length > 0 && !span.classList.contains('a-icon-alt') && !span.classList.contains('a-letter-space'));
      console.log(`Page ${currentPage} first review:`, firstReview?.textContent?.trim());

      let reviews = getReviews(reviewPageDoc, seenBodies);
      totalReviews.push(...reviews);
      console.log(`Page scraped: ${reviews.length} reviews | Total so far: ${totalReviews.length}`);

      if (reviews.length === 0) {
        console.warn("Amazon Soft block or no more reviews.");
        break;
      }

      previousUrl = currentUrl;
      currentUrl = extractNextReviewPageUrl(reviewPageDoc, asin);
      if (!currentUrl) break;

      if (visitedUrls.has(currentUrl)) {
        console.warn("Duplicate page URL detected, stopping.");
        break;
      }
      visitedUrls.add(currentUrl);

      await delay(2000 + Math.random() * 1000);

      reviewPageDoc = await getHtml(currentUrl);
      currentPage++; // ✅ increment after fetch
    }

    console.log(`Scraped ${totalReviews.length} reviews`, totalReviews);
  }
  startScraping();

}

function extractNextReviewPageUrl(doc, asin) {
  const nextPageDetails = doc.querySelector('a[data-hook="show-more-button"]')
    ?.getAttribute("data-reviews-state-param");

  if (!nextPageDetails) return null;

  const data = JSON.parse(nextPageDetails);
  console.log('Raw pagination data:', data);

  const { pageNumber, nextPageToken } = data;
  console.log('Page number extracted:', pageNumber);
  console.log('Token number extracted:', nextPageToken);

  const nextPageUrl = `https://www.amazon.in/product-reviews/${asin}/ref=cm_cr_arp_d_paging_btm?_encoding=UTF8&ie=UTF8&reviewerType=all_reviews&pageNumber=${pageNumber}&nextPageToken=${nextPageToken}`;
  console.log("Next page URL:", nextPageUrl);
  return nextPageUrl;
}

function getProductMetaData() {
  const asin = window.location.pathname.split('/dp/')[1]?.split('/')[0];
  const reviewHref = `https://www.amazon.in/product-reviews/${asin}?pageNumber=1&reviewerType=all_reviews&sortBy=recent`;
  return { asin, reviewHref };
}

async function getHtml(url) {
  if (!url) return null;

  const result = await chrome.runtime.sendMessage({
    type: 'SCRAPE_URL',
    url: url
  });

  if (!result?.html) {
    console.warn('No HTML returned for:', url);
    return null;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(result.html, 'text/html');

  const isBlocked = doc.querySelector('form[action="/errors/validateCaptcha"]')
                 || doc.title?.toLowerCase().includes('robot check');
  if (isBlocked) {
    console.warn('Amazon bot-check triggered. Stopping.');
    return null;
  }

  return doc;
}

function getReviews(doc, seenBodies) {
  const reviews = doc.querySelectorAll('[data-hook="review"]');
  console.log(`Raw reviews found on page: ${reviews.length}`);

  const extractedReviews = [];

  reviews.forEach(review => {
    const WholeTitle = review.querySelector('a[data-hook="review-title"]');
    const spanTitle = WholeTitle?.querySelectorAll("span");
    const title = spanTitle[spanTitle.length - 1]?.textContent?.trim();
    const rating = review.querySelector('[data-hook="review-star-rating"]')?.textContent?.trim();
    const body = review.querySelector('[data-hook="review-body"]')?.textContent?.trim();
    const verified = !!review.querySelector('[data-hook="avp-badge"]');
    const date = review.querySelector('[data-hook="review-date"]')?.textContent?.trim();

    extractedReviews.push({ title, body, rating, verified, date });
  });

  return cleanReviews(extractedReviews, seenBodies);
}

function cleanReviews(extractedReviews, seenBodies) {
  const cleanedReviews = [];

  extractedReviews.forEach(review => {
    const title = review.title?.trim();
    const body = review.body?.trim();
    const rating = review.rating ? parseFloat(review.rating) : null;
    const verified = review.verified;
    const date = review.date;

    if (!seenBodies.has(body) && body?.length > 10) {
      seenBodies.add(body);
      cleanedReviews.push({ title, body, rating, verified, date });
    }
  });

  return cleanedReviews;
}