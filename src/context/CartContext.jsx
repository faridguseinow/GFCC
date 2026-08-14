/* eslint-disable react/prop-types, react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from "react";
import { normalizePriceBase, PRICE_BASES } from "../utils/priceBase";
import { normalizePriceTier, PRICE_TIERS } from "../utils/priceTier";

const CartContext = createContext();

const STORAGE_KEY = "gfcc_cart";
const HISTORY_LIMIT = 10;

const toText = (value) => (value === null || value === undefined ? "" : String(value).trim());

const normalizeQuantity = (value, fallback = 1) => {
    const numeric = Number(value);

    if (!Number.isFinite(numeric) || numeric <= 0) {
        return fallback;
    }

    return Math.max(1, Math.floor(numeric));
};

const normalizeOptionalPrice = (value) => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
};

const resolveLegacyPrice = (item) => {
    const candidates = [
        item?.legacyPrice,
        item?.price,
        item?.cost,
        item?.extraPrice,
        item?.wholesalePrice,
        item?.retailPrice
    ];

    for (const candidate of candidates) {
        const numeric = normalizeOptionalPrice(candidate);
        if (numeric !== null) {
            return numeric;
        }
    }

    return 0;
};

const buildFallbackId = (item, index = 0) => {
    const safeName = toText(item?.name).toLowerCase().replace(/\s+/g, "-") || "item";
    const safePrice = resolveLegacyPrice(item);
    return `${safeName}-${safePrice}-${index}`;
};

const normalizeCartItem = (item, index = 0) => ({
    id: toText(item?.id) || buildFallbackId(item, index),
    sourceId: toText(item?.sourceId) || toText(item?.id) || buildFallbackId(item, index),
    name: toText(item?.name) || "Товар",
    price: resolveLegacyPrice(item),
    legacyPrice: resolveLegacyPrice(item),
    wholesalePrice: normalizeOptionalPrice(item?.wholesalePrice),
    extraPrice: normalizeOptionalPrice(item?.extraPrice ?? item?.price),
    retailPrice: normalizeOptionalPrice(item?.retailPrice),
    addedAtPriceTier: normalizePriceTier(item?.addedAtPriceTier || PRICE_TIERS.EXTRA),
    priceBase: normalizePriceBase(item?.priceBase || item?.addedAtPriceBase || PRICE_BASES.GOLD),
    quantity: normalizeQuantity(item?.quantity)
});

const normalizeCartItems = (items = []) =>
    Array.isArray(items)
        ? items.map((item, index) => normalizeCartItem(item, index))
        : [];

const normalizeHistoryOrder = (order, index = 0) => ({
    id: order?.id || Date.now() + index,
    createdAt: order?.createdAt || order?.date || new Date().toISOString(),
    clientName: toText(order?.clientName),
    clientCode: toText(order?.clientCode),
    clientSklad: toText(order?.clientSklad),
    comment: toText(order?.comment),
    priceTier: normalizePriceTier(order?.priceTier || PRICE_TIERS.EXTRA),
    items: Array.isArray(order?.items)
        ? order.items.map((item, itemIndex) => ({
            ...normalizeCartItem(item, itemIndex),
            name: toText(item?.name) || "Товар",
            quantity: normalizeQuantity(item?.quantity)
        }))
        : []
});

const readCartStorage = () => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) {
            return { activeOrder: [], history: [] };
        }

        const parsed = JSON.parse(saved);

        return {
            activeOrder: Array.isArray(parsed?.activeOrder)
                ? parsed.activeOrder.map((item, index) => normalizeCartItem(item, index))
                : [],
            history: Array.isArray(parsed?.history)
                ? parsed.history.map((order, index) => normalizeHistoryOrder(order, index))
                : []
        };
    } catch {
        return { activeOrder: [], history: [] };
    }
};

export function CartProvider({ children }) {
    const [activeOrder, setActiveOrder] = useState([]);
    const [history, setHistory] = useState([]);

    /* ===== ЗАГРУЗКА ===== */
    useEffect(() => {
        const savedState = readCartStorage();
        setActiveOrder(savedState.activeOrder);
        setHistory(savedState.history);
    }, []);

    /* ===== СОХРАНЕНИЕ ===== */
    useEffect(() => {
        try {
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify({ activeOrder, history })
            );
        } catch {
            // ignore storage errors
        }
    }, [activeOrder, history]);

    /* ===== ДОБАВИТЬ ТОВАР ===== */
    const addToCart = (product) => {
        setActiveOrder(prev => {
            const normalizedProduct = normalizeCartItem(product, prev.length);
            const existing = prev.find(p => p.id === normalizedProduct.id);

            if (existing) {
                return prev.map(p =>
                    p.id === normalizedProduct.id
                        ? { ...p, quantity: normalizeQuantity(p.quantity + 1) }
                        : p
                );
            }

            return [...prev, normalizedProduct];
        });
    };

    /* ===== ИЗМЕНИТЬ КОЛ-ВО ===== */
    const updateQuantity = (id, delta) => {
        setActiveOrder(prev =>
            prev
                .map(item =>
                    item.id === id
                        ? {
                            ...item,
                            quantity: normalizeQuantity(
                                Number(item.quantity || 1) + Number(delta || 0)
                            )
                        }
                        : item
                )
        );
    };

    /* ===== УСТАНОВИТЬ КОЛИЧЕСТВО ВРУЧНУЮ ===== */
    const setQuantity = (id, value) => {
        setActiveOrder(prev =>
            prev.map(item =>
                item.id === id
                    ? {
                        ...item,
                        quantity:
                            value === ""
                                ? ""
                                : normalizeQuantity(value)
                    }
                    : item
            )
        );
    };

    /* ===== УДАЛИТЬ ИСТОРИЮ ===== */
    const deleteHistory = (id) => {
        setHistory(prev => prev.filter(o => o.id !== id));
    };

    /* ===== РЕДАКТИРОВАТЬ ИЗ ИСТОРИИ ===== */
    const editHistory = (order) => {
        setActiveOrder(normalizeCartItems(order?.items));
    };

    /* ===== УДАЛИТЬ ===== */
    const removeItem = (id) => {
        setActiveOrder(prev => prev.filter(p => p.id !== id));
    };

    const clearCart = () => {
        setActiveOrder([]);
    };

    const restoreCart = (items) => {
        setActiveOrder(normalizeCartItems(items));
    };

    const restoreRemovedItem = (item, index = 0) => {
        const normalizedItem = normalizeCartItem(item, index);

        setActiveOrder(prev => {
            if (prev.some((cartItem) => cartItem.id === normalizedItem.id)) {
                return prev;
            }

            const safeIndex = Math.min(Math.max(0, index), prev.length);
            const next = [...prev];
            next.splice(safeIndex, 0, normalizedItem);
            return next;
        });
    };

    const saveOrderToHistory = (order) => {
        const normalizedOrder = normalizeHistoryOrder(order);

        setHistory(prev => [normalizedOrder, ...prev].slice(0, HISTORY_LIMIT));
    };

    return (
        <CartContext.Provider
            value={{
                activeOrder,
                history,
                addToCart,
                updateQuantity,
                removeItem,
                setQuantity,
                deleteHistory,
                editHistory,
                clearCart,
                restoreCart,
                restoreRemovedItem,
                saveOrderToHistory,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export const useCart = () => useContext(CartContext);
