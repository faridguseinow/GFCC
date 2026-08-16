import { Capacitor, CapacitorHttp } from "@capacitor/core";

const CATALOGUE_SHEET_URL = "https://script.google.com/macros/s/AKfycbz0lsVChjzWLWlpRhDGuBtFASMw9uROdM36dJlBoTMSVI9GCcpv0qrp6xpCebMVYnyEIA/exec";
const CATALOGUE_SHEET_PROXY_URL = `https://corsproxy.io/?${encodeURIComponent(CATALOGUE_SHEET_URL)}`;
const CATALOGUE_CACHE_KEY = "gfcc_catalogue_sheet_cache_v4";

const DEFAULT_CLIENT_LOOKUP_API_URL = "https://api.gfcc-oasis.ru/client-by-code/";
const CLIENT_LOOKUP_API_URL = (
  import.meta.env.VITE_CLIENT_LOOKUP_API_URL || DEFAULT_CLIENT_LOOKUP_API_URL
);
const CLIENTS_INDEX_URL = (
  import.meta.env.VITE_CLIENTS_INDEX_URL || ""
).trim();
const CLIENT_LOOKUP_URL = (code) => {
  const url = new URL(CLIENT_LOOKUP_API_URL);
  url.searchParams.set("code", code);

  return url.toString();
};

const CACHE_TTL_MS = 5 * 60 * 1000;
const FETCH_TIMEOUT_MS = 15000;
const CLIENT_LOOKUP_TIMEOUT_MS = 15000;
const CLIENT_LOOKUP_CACHE_KEY = "gfcc_client_lookup_cache_v2";
const CLIENTS_INDEX_CACHE_KEY = "gfcc_clients_index_cache_v1";
const CLIENTS_INDEX_TTL_MS = 12 * 60 * 60 * 1000;

let memoryCatalogueCache = null;
let cataloguePayloadPromise = null;
let memoryClientsIndexCache = null;
let clientsIndexPromise = null;

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
      return [];
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
  const response = await CapacitorHttp.get({
    url,
    responseType: "json",
    connectTimeout: FETCH_TIMEOUT_MS,
    readTimeout: FETCH_TIMEOUT_MS,
    webFetchExtra: {
      cache: "no-store"
    }
  });

  if (response.status < 200 || response.status >= 300) {
    throw new Error(`HTTP ${response.status}`);
  }

  if (typeof response.data === "string") {
    return JSON.parse(response.data);
  }

  return response.data;
};

const isNativePlatform = () => {
  try {
    return typeof Capacitor?.isNativePlatform === "function" && Capacitor.isNativePlatform();
  } catch {
    return false;
  }
};

const parseJsonSafely = (value) => {
  if (typeof value !== "string") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const unwrapClientPayload = (payload) => {
  let current = parseJsonSafely(payload);

  for (let index = 0; index < 4; index += 1) {
    if (typeof current === "string") {
      const parsed = parseJsonSafely(current);
      if (parsed === current) {
        break;
      }

      current = parsed;
      continue;
    }

    if (!current || typeof current !== "object") {
      break;
    }

    if (current.client || current.found === false) {
      break;
    }

    if ("data" in current && current.data !== current) {
      current = parseJsonSafely(current.data);
      continue;
    }

    if ("body" in current && current.body !== current) {
      current = parseJsonSafely(current.body);
      continue;
    }

    break;
  }

  return current;
};

const fetchClientApiViaFetch = async (url) => {
  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), CLIENT_LOOKUP_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json"
      },
      cache: "no-store",
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const raw = await response.text();
    return unwrapClientPayload(raw);
  } finally {
    globalThis.clearTimeout(timeoutId);
  }
};

const fetchClientApiViaCapacitor = async (url) => {
  const response = await CapacitorHttp.get({
    url,
    responseType: "json",
    connectTimeout: CLIENT_LOOKUP_TIMEOUT_MS,
    readTimeout: CLIENT_LOOKUP_TIMEOUT_MS,
    webFetchExtra: {
      cache: "no-store"
    }
  });

  if (response.status < 200 || response.status >= 300) {
    throw new Error(`HTTP ${response.status}`);
  }

  return unwrapClientPayload(response.data);
};

const readClientLookupCache = () => {
  try {
    return JSON.parse(localStorage.getItem(CLIENT_LOOKUP_CACHE_KEY) || "{}");
  } catch {
    return {};
  }
};

const writeClientLookupCache = (code, clients) => {
  try {
    const cache = readClientLookupCache();
    cache[code] = clients;
    localStorage.setItem(CLIENT_LOOKUP_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // ignore storage errors
  }
};

const getCachedClientsByCode = (code) => {
  const cache = readClientLookupCache();
  const cached = cache?.[code];

  if (Array.isArray(cached)) {
    return cached
      .map((record) => normalizeClientRecord(record, code))
      .filter(Boolean);
  }

  const normalized = normalizeClientRecord(cached, code);
  return normalized ? [normalized] : [];
};

const normalizeClientRecord = (record, fallbackCode) => {
  if (!record || typeof record !== "object") {
    return null;
  }

  const code = toText(record.code || record.clientCode || record.kod || fallbackCode).padStart(6, "0");
  const name = toText(record.name || record.title || record.clientName);
  const sklad = toText(record.sklad || record.warehouse);

  if (!code || !name) {
    return null;
  }

  return { code, name, sklad };
};

const getClientIdentityKey = (record) =>
  [
    toText(record?.code).padStart(6, "0"),
    toText(record?.sklad || record?.warehouse).toLowerCase(),
    toText(record?.name || record?.title || record?.clientName).toLowerCase()
  ].join("|");

const uniqueClientRecords = (records) => {
  const seen = new Set();

  return records.filter((record) => {
    const identity = getClientIdentityKey(record);
    if (!identity || seen.has(identity)) {
      return false;
    }

    seen.add(identity);
    return true;
  });
};

const normalizeClientCollection = (source, fallbackCode) => {
  if (!source) {
    return [];
  }

  if (Array.isArray(source)) {
    return uniqueClientRecords(
      source
        .map((record) => normalizeClientRecord(record, fallbackCode))
        .filter(Boolean)
    );
  }

  if (typeof source !== "object") {
    return [];
  }

  if ("code" in source || "name" in source || "sklad" in source || "warehouse" in source) {
    const normalized = normalizeClientRecord(source, fallbackCode);
    return normalized ? [normalized] : [];
  }

  return uniqueClientRecords(
    Object.entries(source).flatMap(([code, record]) =>
      normalizeClientCollection(record, code)
    )
  );
};

const normalizeClientsIndex = (payload) => {
  const source = payload?.clients || payload?.index || payload?.data || payload;
  const index = {};

  if (Array.isArray(source)) {
    source.forEach((record) => {
      const normalized = normalizeClientRecord(record);
      if (normalized) {
        index[normalized.code] = [...(index[normalized.code] || []), normalized];
      }
    });

    Object.keys(index).forEach((code) => {
      index[code] = uniqueClientRecords(index[code]);
    });

    return index;
  }

  if (source && typeof source === "object") {
    Object.entries(source).forEach(([code, record]) => {
      const normalizedRecords = normalizeClientCollection(record, code);

      normalizedRecords.forEach((normalized) => {
        index[normalized.code] = [...(index[normalized.code] || []), normalized];
      });
    });
  }

  Object.keys(index).forEach((code) => {
    index[code] = uniqueClientRecords(index[code]);
  });

  return index;
};

const readClientsIndexCache = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(CLIENTS_INDEX_CACHE_KEY) || "null");
    if (!raw?.fetchedAt || !raw?.index || typeof raw.index !== "object") {
      return null;
    }

    return raw;
  } catch {
    return null;
  }
};

const writeClientsIndexCache = (index) => {
  const payload = {
    fetchedAt: Date.now(),
    index
  };

  memoryClientsIndexCache = payload;

  try {
    localStorage.setItem(CLIENTS_INDEX_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // ignore storage errors
  }
};

const getClientsFromIndex = (index, code) => {
  if (!index || typeof index !== "object") {
    return [];
  }

  return normalizeClientCollection(index[code], code);
};

const isFreshClientsIndex = (cache) =>
  !!cache?.fetchedAt && Date.now() - cache.fetchedAt < CLIENTS_INDEX_TTL_MS;

const loadClientsIndex = async () => {
  if (isFreshClientsIndex(memoryClientsIndexCache)) {
    return memoryClientsIndexCache.index;
  }

  const localCache = readClientsIndexCache();
  if (isFreshClientsIndex(localCache)) {
    memoryClientsIndexCache = localCache;
    return localCache.index;
  }

  if (!CLIENTS_INDEX_URL) {
    throw new Error("Clients index API is not configured");
  }

  if (clientsIndexPromise) {
    return clientsIndexPromise;
  }

  clientsIndexPromise = (async () => {
    try {
      const payload = isNativePlatform()
        ? await fetchClientApiViaCapacitor(CLIENTS_INDEX_URL)
        : await fetchClientApiViaFetch(CLIENTS_INDEX_URL);

      const index = normalizeClientsIndex(payload);
      writeClientsIndexCache(index);
      return index;
    } catch (error) {
      if (localCache?.index) {
        memoryClientsIndexCache = localCache;
        return localCache.index;
      }

      throw error;
    } finally {
      clientsIndexPromise = null;
    }
  })();

  return clientsIndexPromise;
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
    return [];
  }

  if (payload.found === false) {
    return [];
  }

  const primarySource = payload?.clients || payload?.data?.clients || payload?.body?.clients;
  const primaryClients = normalizeClientCollection(primarySource, code);

  if (primaryClients.length > 0) {
    return primaryClients;
  }

  const fallbackSource = payload.client || payload.data || payload;
  return normalizeClientCollection(fallbackSource, code);
};

export async function getClientsByCode(code) {
  const rawCode = toText(code);
  if (!rawCode) {
    return [];
  }

  const normalizedCode = rawCode.padStart(6, "0");
  const cachedClients = getCachedClientsByCode(normalizedCode);

  if (cachedClients.length > 0) {
    return cachedClients;
  }

  try {
    const url = CLIENT_LOOKUP_URL(normalizedCode);
    const payload = isNativePlatform()
      ? await fetchClientApiViaCapacitor(url)
      : await fetchClientApiViaFetch(url);

    const clients = normalizeClientLookup(payload, normalizedCode);

    if (clients.length > 0) {
      writeClientLookupCache(normalizedCode, clients);
      return clients;
    }

    if (payload?.found === false) {
      try {
        const clientsIndex = await loadClientsIndex();
        const indexedClients = getClientsFromIndex(clientsIndex, normalizedCode);

        if (indexedClients.length > 0) {
          writeClientLookupCache(normalizedCode, indexedClients);
          return indexedClients;
        }
      } catch (indexError) {
        console.warn("Clients index load failed after empty direct lookup:", indexError);
      }

      return null;
    }

    throw new Error("Client lookup returned invalid payload");
  } catch (directLookupError) {
    try {
      const clientsIndex = await loadClientsIndex();
      const indexedClients = getClientsFromIndex(clientsIndex, normalizedCode);

      if (indexedClients.length > 0) {
        writeClientLookupCache(normalizedCode, indexedClients);
        return indexedClients;
      }
    } catch (indexError) {
      console.warn("Clients index load failed after direct lookup error:", indexError);
    }

    console.error("Client lookup API error:", directLookupError);
    throw directLookupError;
  }
}

const matchesPreferredClient = (client, preferredSelection) => {
  if (!preferredSelection) {
    return false;
  }

  const preferredCode = toText(preferredSelection.code).padStart(6, "0");
  const preferredName = toText(preferredSelection.name).toLowerCase();
  const preferredSklad = toText(preferredSelection.sklad).toLowerCase();

  if (preferredCode && client.code !== preferredCode) {
    return false;
  }

  if (preferredSklad && toText(client.sklad).toLowerCase() !== preferredSklad) {
    return false;
  }

  if (preferredName && toText(client.name).toLowerCase() !== preferredName) {
    return false;
  }

  return true;
};

export async function getClientByCode(code, preferredSelection = null) {
  const clients = await getClientsByCode(code);

  if (clients.length === 0) {
    return null;
  }

  const matchedClient = clients.find((client) =>
    matchesPreferredClient(client, preferredSelection)
  );

  return matchedClient || clients[0];
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
