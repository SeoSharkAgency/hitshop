/** Базова ціна товару: гість = price, зареєстрований = memberPrice (або price). */
export function resolveBasePrice(product, isMember) {
  const guest = Number(product.price) || 0;
  if (!isMember) return guest;
  if (product.memberPrice == null || product.memberPrice === '') return guest;
  const member = Number(product.memberPrice);
  return Number.isFinite(member) ? member : guest;
}

export function getCartItemUnitPrice(item, isMember) {
  const guest = Number(item.basePriceGuest ?? item.basePrice ?? item.price) || 0;
  const memberRaw = item.basePriceMember;
  const member =
    memberRaw == null || memberRaw === ''
      ? guest
      : Number(memberRaw) || 0;
  const base = isMember ? member : guest;
  return (
    base +
    (Number(item.printNumberPrice) || 0) +
    (Number(item.printNamePrice) || 0)
  );
}
