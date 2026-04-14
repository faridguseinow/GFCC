const CATALOGUE_SHEET_URL = "https://script.google.com/macros/s/AKfycbz0lsVChjzWLWlpRhDGuBtFASMw9uROdM36dJlBoTMSVI9GCcpv0qrp6xpCebMVYnyEIA/exec";
const CATALOGUE_SHEET_PROXY_URL = `https://corsproxy.io/?${encodeURIComponent(CATALOGUE_SHEET_URL)}`;
const CATALOGUE_CACHE_KEY = "gfcc_catalogue_sheet_cache_v4";

const DEFAULT_CLIENTS_API_BASE_URL = "https://clients-gf-oas-api.onrender.com";
const CLIENTS_API_BASE_URL = (
  import.meta.env.VITE_CLIENTS_API_BASE_URL || DEFAULT_CLIENTS_API_BASE_URL
).replace(/\/+$/, "");
const CLIENT_LOOKUP_URL = (code) =>
  `${CLIENTS_API_BASE_URL}/client-by-code?code=${encodeURIComponent(code)}`;

const CACHE_TTL_MS = 5 * 60 * 1000;
const FETCH_TIMEOUT_MS = 15000;

let memoryCatalogueCache = null;
let cataloguePayloadPromise = null;

const asArray = (value) => (Array.isArray(value) ? value : []);

const toText = (value) => (value === null || value === undefined ? "" : String(value).trim());

const cleanCatalogueText = (value) => toText(value).replace(/\s*⥤\s*/g, "").trim();

const firstNonEmpty = (...values) => {
  for (const value of values) {
    const text = cleanCatalogueText(value);
    if (text) {
      return text;
    }
  }

  return "";
};

const normalizeUrl = (value) => {
  const raw = toText(value);
  if (!raw) {
    return "";
  }

  return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
};

const pickFirstUrl = (...values) => {
  for (const value of values) {
    const normalized = normalizeUrl(value);
    if (normalized) {
      return normalized;
    }
  }

  return "";
};

const unique = (items) => [...new Set(items.filter(Boolean))];

const sortOrder = (image) => {
  if (!image || typeof image === "string") {
    return Number.MAX_SAFE_INTEGER;
  }

  const parsed = Number(image.sort_order);
  return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER;
};

const normalizeImageList = (images) => {
  const sorted = [...asArray(images)].sort((a, b) => {
    if (typeof a === "string" || typeof b === "string") {
      return 0;
    }

    if (a?.is_cover && !b?.is_cover) {
      return -1;
    }

    if (!a?.is_cover && b?.is_cover) {
      return 1;
    }

    return sortOrder(a) - sortOrder(b);
  });

  const urls = sorted.map((image) => {
    if (typeof image === "string") {
      return normalizeUrl(image);
    }

    return pickFirstUrl(image?.image_url, image?.img, image?.url, image?.src);
  });

  return unique(urls);
};

const mapVariant = (variant, parentItemId, index, parentTitle) => {
  const images = normalizeImageList(variant?.images);
  const category = [toText(variant?.brand), toText(variant?.country)]
    .filter(Boolean)
    .join(" / ");

  return {
    id: `${toText(parentItemId) || "item"}-${toText(variant?.variant_id) || "variant"}-${index}`,
    title: cleanCatalogueText(variant?.title_ru || variant?.title_en || `Вариант ${index + 1}`),
    category: category || parentTitle,
    description: toText(variant?.description_ru || variant?.description_en),
    plantation: toText(variant?.brand),
    quantity: toText(variant?.quantity),
    height: toText(variant?.height),
    color: toText(variant?.color),
    size: "",
    season: toText(variant?.season),
    department: toText(variant?.country),
    href: "",
    image: images[0] || "",
    images,
    variants: []
  };
};

const mapCatalogueItem = (item, index, { fallbackTitle, sectionCategory, keepVariants }) => {
  const sectionId = toText(item?.section_id) || "catalogue";
  const itemId = toText(item?.item_id) || `item-${index}`;
  const title = firstNonEmpty(
    item?.title_ru,
    item?.title_en,
    item?.name,
    item?.item_name,
    itemId,
    `${fallbackTitle} ${index + 1}`
  );
  const images = normalizeImageList(item?.images);

  const variants = keepVariants
    ? asArray(item?.variants).map((variant, variantIndex) =>
      mapVariant(variant, itemId, variantIndex, title)
    )
    : [];

  return {
    id: `${sectionId}-${itemId}-${index}`,
    title,
    category: sectionCategory,
    description: toText(item?.description_ru || item?.description_en || item?.desc || item?.description),
    plantation: "",
    quantity: "",
    height: "",
    season: "",
    color: "",
    size: "",
    department: toText(item?.items || item?.department || item?.country),
    href: pickFirstUrl(item?.href, item?.url, item?.link, item?.site),
    image: images[0] || variants[0]?.image || "",
    images,
    variants
  };
};

const mapCooperationItems = (items) =>
  asArray(items).map((item, index) => {
    const images = unique([
      ...normalizeImageList(item?.images),
      pickFirstUrl(item?.image, item?.image_url, item?.img)
    ]);

    return {
      id: `cooperation-${toText(item?.partner_id || item?.item_id) || index}`,
      title: cleanCatalogueText(
        item?.title_ru || item?.title_en || item?.title || item?.name || `Партнер ${index + 1}`
      ),
      category: "Партнер",
      description: "Поставщик и партнер компании.",
      plantation: "",
      quantity: "",
      height: "",
      season: "",
      color: "",
      size: "",
      department: "",
      href: pickFirstUrl(
        item?.href,
        item?.url,
        item?.website,
        item?.site,
        item?.link,
        item?.site_url,
        item?.company_url
      ),
      image: images[0] || "",
      images,
      variants: []
    };
  });

const readCatalogueCache = () => {
  try {
    const raw = localStorage.getItem(CATALOGUE_CACHE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (!parsed?.fetchedAt) {
      return null;
    }

    return {
      fetchedAt: parsed.fetchedAt,
      sections: asArray(parsed.sections),
      partners: asArray(parsed.partners)
    };
  } catch {
    return null;
  }
};

const writeCatalogueCache = (payload) => {
  try {
    localStorage.setItem(CATALOGUE_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // ignore storage errors
  }
};

const isFresh = (cache) => !!cache?.fetchedAt && Date.now() - cache.fetchedAt < CACHE_TTL_MS;

const fetchJson = async (url) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.json();
  } finally {
    clearTimeout(timeoutId);
  }
};

const loadCataloguePayload = async () => {
  if (isFresh(memoryCatalogueCache)) {
    return memoryCatalogueCache;
  }

  const localCache = readCatalogueCache();
  if (isFresh(localCache)) {
    memoryCatalogueCache = localCache;
    return localCache;
  }

  if (cataloguePayloadPromise) {
    return cataloguePayloadPromise;
  }

  cataloguePayloadPromise = (async () => {
    try {
      let data;

      try {
        data = await fetchJson(CATALOGUE_SHEET_URL);
      } catch {
        data = await fetchJson(CATALOGUE_SHEET_PROXY_URL);
      }

      const payload = {
        fetchedAt: Date.now(),
        sections: asArray(data?.sections),
        partners: asArray(data?.partners)
      };

      memoryCatalogueCache = payload;
      writeCatalogueCache(payload);

      return payload;
    } catch (error) {
      console.error("Catalogue API error:", error);

      if (localCache) {
        memoryCatalogueCache = localCache;
        return localCache;
      }

      return { fetchedAt: 0, sections: [], partners: [] };
    } finally {
      cataloguePayloadPromise = null;
    }
  })();

  return cataloguePayloadPromise;
};

const getSectionItems = (sections, sectionId) =>
  asArray(sections.find((section) => section?.section_id === sectionId)?.items);

const mapSection = (items, config) =>
  asArray(items).map((item, index) => mapCatalogueItem(item, index, config));

export async function getProducts() {
  const payload = await loadCataloguePayload();

  return payload.sections.flatMap((section) =>
    mapSection(section?.items, {
      fallbackTitle: section?.title_ru || "Каталог",
      sectionCategory: toText(section?.title_ru),
      keepVariants: false
    })
  );
}

const normalizeClientLookup = (payload, code) => {
  if (!payload) {
    return null;
  }

  if (payload.found === false) {
    return null;
  }

  const source = payload.client || payload.data || payload;
  const clientCode = toText(source?.code || code);
  const name = toText(source?.name);

  if (!name) {
    return null;
  }

  return {
    code: clientCode,
    name,
    sklad: toText(source?.sklad || source?.warehouse)
  };
};

export async function getClientByCode(code) {
  const normalizedCode = toText(code);
  if (!normalizedCode) {
    return null;
  }

  const url = CLIENT_LOOKUP_URL(normalizedCode);
  const payload = await fetchJson(url);
  return normalizeClientLookup(payload, normalizedCode);
}

export async function getCatalogueProducts() {
  const payload = await loadCataloguePayload();

  const flowers = mapSection(getSectionItems(payload.sections, "catalog_flowers"), {
    fallbackTitle: "Цветок",
    sectionCategory: "Срезанные цветы",
    keepVariants: true
  });

  const chinaFlowers = mapSection(getSectionItems(payload.sections, "catalog_china_flowers"), {
    fallbackTitle: "Цветок Китай",
    sectionCategory: "Цветы Китай",
    keepVariants: true
  });

  return [...flowers, ...chinaFlowers];
}

export async function getPlantsCatalogue() {
  const payload = await loadCataloguePayload();

  return mapSection(getSectionItems(payload.sections, "catalog_plants"), {
    fallbackTitle: "Растение",
    sectionCategory: "Комнатные растения",
    keepVariants: true
  });
}

export async function getAccessoriesCatalogue() {
  const payload = await loadCataloguePayload();

  return mapSection(getSectionItems(payload.sections, "catalog_accessories"), {
    fallbackTitle: "Аксессуар",
    sectionCategory: "Аксессуары и упаковка",
    keepVariants: false
  });
}

export async function getCooperationCatalogue() {
  const payload = await loadCataloguePayload();

  if (payload.partners.length > 0) {
    return mapCooperationItems(payload.partners);
  }

  return mapCooperationItems(getSectionItems(payload.sections, "cooperation"));
}

export const catalogueCacheTtlMs = CACHE_TTL_MS;
