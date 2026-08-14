export const PRICE_BASES = {
  GOLD: "gold",
  OASIS: "oasis"
};

const PRICE_BASE_ORDER = [
  PRICE_BASES.GOLD,
  PRICE_BASES.OASIS
];

const DEFAULT_PRICES_API_URL = "https://api.gfcc-oasis.ru/prices/";
const PRICES_API_URL = (
  import.meta.env.VITE_PRICES_API_URL || DEFAULT_PRICES_API_URL
);
export const PRICES_STATUS_API_URL = "https://api.gfcc-oasis.ru/status/";

const toText = (value) => (value === null || value === undefined ? "" : String(value).trim());

export function normalizePriceBase(value) {
  return PRICE_BASE_ORDER.includes(value) ? value : PRICE_BASES.GOLD;
}

export function resolvePriceBaseByWarehouse(warehouse) {
  const normalizedWarehouse = toText(warehouse).toLowerCase();

  if (!normalizedWarehouse) {
    return null;
  }

  if (
    normalizedWarehouse.includes("oasis") ||
    normalizedWarehouse.includes("оазис")
  ) {
    return PRICE_BASES.OASIS;
  }

  if (
    normalizedWarehouse.includes("gold") ||
    normalizedWarehouse.includes("golden") ||
    normalizedWarehouse.includes("голд") ||
    normalizedWarehouse.includes("голден")
  ) {
    return PRICE_BASES.GOLD;
  }

  return null;
}

export function resolvePriceBaseByClient(client) {
  return resolvePriceBaseByWarehouse(client?.sklad);
}

export function getPriceBaseLabel(base) {
  const normalizedBase = normalizePriceBase(base);

  if (normalizedBase === PRICE_BASES.OASIS) {
    return "Oasis Flowers";
  }

  return "Golden Flowers";
}

export function getPriceBaseShortLabel(base) {
  const normalizedBase = normalizePriceBase(base);

  return normalizedBase === PRICE_BASES.OASIS ? "Oasis" : "Gold";
}

export function getPriceBaseExcelTitle(base) {
  return getPriceBaseLabel(base).toUpperCase();
}

export function getPriceBaseOptions() {
  return PRICE_BASE_ORDER.map((base) => ({
    value: base,
    label: getPriceBaseShortLabel(base),
    title: getPriceBaseLabel(base)
  }));
}

export function getPricesApiUrl(base) {
  const normalizedBase = normalizePriceBase(base);

  if (/^https?:\/\//i.test(PRICES_API_URL)) {
    const url = new URL(PRICES_API_URL);
    url.searchParams.set("base", normalizedBase);

    return url.toString();
  }

  const normalizedApiUrl = PRICES_API_URL.replace(/\/+$/, "");
  const separator = normalizedApiUrl.includes("?") ? "&" : "?";
  return `${normalizedApiUrl}${separator}base=${encodeURIComponent(normalizedBase)}`;
}
