export function parsePrice(price?: string) {
  if (!price) return 0;
  const match = price.match(/\d+/g);
  return match ? Number(match.join("")) : 0;
}

export function getMinPrice(services: any[]) {
  const prices = services
    .map((s) => parsePrice(s.price))
    .filter(Boolean);

  return prices.length ? Math.min(...prices) : 0;
}