import { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
    const [activeOrder, setActiveOrder] = useState([]);
    const [history, setHistory] = useState([]);

    /* ===== ЗАГРУЗКА ===== */
    useEffect(() => {
        const saved = localStorage.getItem("gfcc_cart");
        if (saved) {
            const parsed = JSON.parse(saved);
            setActiveOrder(parsed.activeOrder || []);
            setHistory(parsed.history || []);
        }
    }, []);

    /* ===== СОХРАНЕНИЕ ===== */
    useEffect(() => {
        localStorage.setItem(
            "gfcc_cart",
            JSON.stringify({ activeOrder, history })
        );
    }, [activeOrder, history]);

    /* ===== ДОБАВИТЬ ТОВАР ===== */
    const addToCart = (product) => {
        setActiveOrder(prev => {
            const existing = prev.find(p => p.id === product.id);

            if (existing) {
                return prev.map(p =>
                    p.id === product.id
                        ? { ...p, quantity: p.quantity + 1 }
                        : p
                );
            }

            return [...prev, { ...product, quantity: 1 }];
        });
    };

    /* ===== ИЗМЕНИТЬ КОЛ-ВО ===== */
    const updateQuantity = (id, delta) => {
        setActiveOrder(prev =>
            prev
                .map(item =>
                    item.id === id
                        ? { ...item, quantity: Math.max(1, item.quantity + delta) }
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
                                : Math.max(1, Number(value))
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
        setActiveOrder(order.items);
    };

    /* ===== УДАЛИТЬ ===== */
    const removeItem = (id) => {
        setActiveOrder(prev => prev.filter(p => p.id !== id));
    };

    /* ===== СФОРМИРОВАТЬ ЗАКАЗ ===== */
    const finalizeOrder = () => {
        if (!activeOrder.length) return;

        const total = activeOrder.reduce(
            (acc, i) => acc + i.price * i.quantity,
            0
        );

        const newOrder = {
            id: Date.now(),
            date: new Date().toLocaleDateString("ru-RU"),
            items: activeOrder,
            total,
        };

        setHistory(prev => [newOrder, ...prev].slice(0, 5));
        setActiveOrder([]);

        copyOrder(newOrder);
    };

    /* ===== КОПИРОВАНИЕ ===== */
    const copyOrder = (order) => {
        const text = `
Заказ от ${order.date}

${order.items
                .map(i => `${i.name} — ${i.quantity} шт`)
                .join("\n")}

ИТОГО: ${order.total.toLocaleString("ru-RU")} ₽
`;

        navigator.clipboard.writeText(text);
    };

    return (
        <CartContext.Provider
            value={{
                activeOrder,
                history,
                addToCart,
                updateQuantity,
                removeItem,
                finalizeOrder,
                setQuantity,
                deleteHistory,
                editHistory,
                copyOrder,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export const useCart = () => useContext(CartContext);