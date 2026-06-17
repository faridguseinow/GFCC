export const PRICE_TIERS = {
  WHOLESALE: "wholesale",
  EXTRA: "extra",
  RETAIL: "retail"
};

const PRICE_TIER_ORDER = [
  PRICE_TIERS.WHOLESALE,
  PRICE_TIERS.EXTRA,
  PRICE_TIERS.RETAIL
];

const toFiniteNumber = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

export function normalizePriceTier(value) {
  return PRICE_TIER_ORDER.includes(value) ? value : PRICE_TIERS.EXTRA;
}

export function isPriceTierAllowed(tier, hasClientCard) {
  const normalizedTier = normalizePriceTier(tier);

  if (normalizedTier === PRICE_TIERS.WHOLESALE) {
    return Boolean(hasClientCard);
  }

  return true;
}

export function getDefaultPriceTier(hasClientCard) {
  return hasClientCard ? PRICE_TIERS.WHOLESALE : PRICE_TIERS.EXTRA;
}

export function getPriceTierLabel(tier) {
  const normalizedTier = normalizePriceTier(tier);

  if (normalizedTier === PRICE_TIERS.WHOLESALE) {
    return "Оптовая";
  }

  if (normalizedTier === PRICE_TIERS.RETAIL) {
    return "Розничная";
  }

  return "Оптовая +5%";
}

export function getPriceTierSubtitle(tier) {
  const normalizedTier = normalizePriceTier(tier);

  if (normalizedTier === PRICE_TIERS.WHOLESALE) {
    return "Оптовые цены";
  }

  if (normalizedTier === PRICE_TIERS.RETAIL) {
    return "Розничные цены (оптовые + 25%)";
  }

  return "Цены для частных лиц (оптовые + 5%)";
}

export function getPriceTierExcelTitle(tier) {
  const normalizedTier = normalizePriceTier(tier);

  if (normalizedTier === PRICE_TIERS.WHOLESALE) {
    return "ОПТОВЫЕ ЦЕНЫ";
  }

  if (normalizedTier === PRICE_TIERS.RETAIL) {
    return "РОЗНИЧНЫЕ ЦЕНЫ — ОПТ +25%";
  }

  return "ЦЕНЫ ДЛЯ ЧАСТНЫХ ЛИЦ — ОПТ +5%";
}

export function resolvePriceByTier(item, tier) {
  const normalizedTier = normalizePriceTier(tier);
  const primaryValue =
    normalizedTier === PRICE_TIERS.WHOLESALE
      ? item?.wholesalePrice
      : normalizedTier === PRICE_TIERS.RETAIL
        ? item?.retailPrice
        : item?.extraPrice;

  const fallbacks = [
    primaryValue,
    item?.extraPrice,
    item?.wholesalePrice,
    item?.retailPrice,
    item?.legacyPrice,
    item?.price,
    item?.cost
  ];

  for (const candidate of fallbacks) {
    const numeric = toFiniteNumber(candidate);
    if (numeric !== null) {
      return numeric;
    }
  }

  return null;
}

export function getPriceTierOptions(hasClientCard) {
  return PRICE_TIER_ORDER.map((tier) => ({
    value: tier,
    label: getPriceTierLabel(tier),
    subtitle: getPriceTierSubtitle(tier),
    allowed: isPriceTierAllowed(tier, hasClientCard)
  }));
}
