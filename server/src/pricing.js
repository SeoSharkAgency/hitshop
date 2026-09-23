/** Базова ціна товару: гість = price, зареєстрований = memberPrice (або price, якщо не задано). */
function resolveBasePrice(product, isMember) {
  const guest = parseFloat(product.price) || 0;
  if (!isMember) return guest;
  if (product.memberPrice == null || product.memberPrice === '') return guest;
  const member = parseFloat(product.memberPrice);
  return Number.isFinite(member) ? member : guest;
}

module.exports = { resolveBasePrice };
