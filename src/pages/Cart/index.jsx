import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Info } from "lucide-react";
import PriceTierSelector from "../../components/PriceTierSelector";
import { useCart } from "../../context/CartContext";
import { usePriceTier } from "../../context/PriceTierContext";
import { useToast } from "../../context/ToastContext";
import {
  getActiveClient,
  subscribeToActiveClientCardChanges
} from "../../utils/clientAccess";
import { buildOrderFileName, buildOrderPdfBlob } from "../../utils/orderPdf";
import {
  canSharePdfFile,
  downloadPdfBlob,
  sharePdfFile
} from "../../utils/sharePdf";
import { getPriceTierLabel, resolvePriceByTier } from "../../utils/priceTier";

import "./style.scss";

const INFO_TEXT = [
  "1. Добавьте товары из прайса в корзину.",
  "2. Проверьте количество вручную.",
  "3. Учитывайте, что товары могут продаваться упаковками: 5, 10, 25, 50 шт и т.д.",
  "4. Если нужно, добавьте комментарий к заказу.",
  "5. Нажмите “Сформировать заказ”.",
  "6. После формирования PDF нажмите “Поделиться” или “Скачать PDF”.",
  "7. Заказ сохранится в истории заказов.",
  "8. Из истории можно снова поделиться PDF-файлом или скачать его.",
  "9. Перед отправкой обязательно проверьте количество."
];

const SHARE_FALLBACK_MESSAGE = "На этом устройстве отправка файла через меню Поделиться недоступна. Скачайте PDF и отправьте его вручную.";
const MAX_CART_ITEM_NAME_LENGTH = 72;
const SWIPE_DELETE_THRESHOLD = -80;
const SWIPE_MAX_OFFSET = -112;
const SWIPE_RESET_THRESHOLD = -18;
const CART_REMOVE_ANIMATION_MS = 220;

const toText = (value) => (value === null || value === undefined ? "" : String(value).trim());

const truncateText = (value, maxLength = MAX_CART_ITEM_NAME_LENGTH) => {
  const text = toText(value);

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
};

const normalizeQuantity = (value) => {
  const numeric = Number(value);

  if (!Number.isFinite(numeric) || numeric <= 0) {
    return 0;
  }

  return Math.max(1, Math.floor(numeric));
};

const parseDateValue = (value) => {
  if (!value) {
    return new Date();
  }

  const directDate = new Date(value);
  if (!Number.isNaN(directDate.getTime())) {
    return directDate;
  }

  if (typeof value === "string") {
    const match = value.match(
      /^(\d{2})\.(\d{2})\.(\d{4})(?:\s+(\d{2}):(\d{2}))?$/
    );

    if (match) {
      const [, day, month, year, hours = "00", minutes = "00"] = match;
      return new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hours),
        Number(minutes)
      );
    }
  }

  return new Date("");
};

const formatHistoryDateTime = (value) => {
  const date = parseDateValue(value);

  if (Number.isNaN(date.getTime())) {
    return toText(value);
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
};

const buildPdfFile = (blob, fileName) => {
  if (typeof File !== "function") {
    return null;
  }

  return new File([blob], fileName, {
    type: "application/pdf"
  });
};

const isValidCartItem = (item) => {
  const name = toText(item?.name);
  const quantity = normalizeQuantity(item?.quantity);

  return Boolean(name && quantity > 0);
};

const buildShareTitle = (clientName) => {
  const safeClientName = toText(clientName) || "клиента";
  return `Заказ ${safeClientName}`;
};

export default function Cart() {
  const modalRoot = typeof document !== "undefined"
    ? document.getElementById("modal-root")
    : null;
  const summaryRoot = modalRoot || (typeof document !== "undefined" ? document.body : null);
  const historyTouchStartRef = useRef({});
  const cartTouchStartRef = useRef({});

  const { showToast } = useToast();

  const {
    activeOrder,
    history,
    updateQuantity,
    setQuantity,
    removeItem,
    deleteHistory,
    clearCart,
    restoreCart,
    restoreRemovedItem,
    saveOrderToHistory
  } = useCart();

  const [activeClient, setActiveClient] = useState(() => getActiveClient());
  const [comment, setComment] = useState("");
  const [infoOpen, setInfoOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [preparedOrder, setPreparedOrder] = useState(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const [priceTierSelectorOpen, setPriceTierSelectorOpen] = useState(false);
  const [swipeOffsets, setSwipeOffsets] = useState({});
  const [removingItemIds, setRemovingItemIds] = useState({});
  const { priceTier, hasClientCard } = usePriceTier();

  useEffect(() => {
    setActiveClient(getActiveClient());

    return subscribeToActiveClientCardChanges((client) => {
      setActiveClient(client);
    });
  }, []);

  useEffect(() => {
    if (!infoOpen && !historyOpen) {
      return () => {};
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setInfoOpen(false);
        setHistoryOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [historyOpen, infoOpen]);

  const total = activeOrder.reduce(
    (acc, item) => {
      const unitPrice = resolvePriceByTier(item, priceTier);
      return acc + (Number.isFinite(unitPrice) ? unitPrice * normalizeQuantity(item.quantity) : 0);
    },
    0
  );

  const handleQuantityInput = (id, rawValue) => {
    const digitsOnly = rawValue.replace(/\D/g, "");
    setQuantity(id, digitsOnly === "" ? "" : digitsOnly);
  };

  const buildOrderData = () => ({
    id: Date.now(),
    createdAt: new Date().toISOString(),
    clientName: toText(activeClient?.name) || "Клиент GFCC",
    clientCode: toText(activeClient?.code),
    clientSklad: toText(activeClient?.sklad) || "Склад клиента",
    comment: toText(comment),
    priceTier,
    items: activeOrder.map((item) => ({
      name: toText(item?.name) || "Товар",
      quantity: normalizeQuantity(item?.quantity),
      wholesalePrice: item?.wholesalePrice,
      extraPrice: item?.extraPrice,
      retailPrice: item?.retailPrice,
      legacyPrice: item?.legacyPrice
    }))
  });

  const validateBeforePdf = () => {
    if (activeOrder.length === 0) {
      return "Корзина пуста";
    }

    if (activeOrder.some((item) => !isValidCartItem(item))) {
      return "Проверьте количество товаров перед формированием заказа";
    }

    return "";
  };

  const handleRestorePreparedOrder = () => {
    if (!preparedOrder?.cartSnapshot?.length) {
      return;
    }

    restoreCart(preparedOrder.cartSnapshot);
    setComment(preparedOrder.comment || "");
  };

  const handleBuildOrder = async () => {
    const validationError = validateBeforePdf();

    if (validationError) {
      showToast(validationError);
      return;
    }

    setIsPreparing(true);

    try {
      const orderData = buildOrderData();
      const cartSnapshot = activeOrder.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        legacyPrice: item.legacyPrice,
        wholesalePrice: item.wholesalePrice,
        extraPrice: item.extraPrice,
        retailPrice: item.retailPrice,
        addedAtPriceTier: item.addedAtPriceTier,
        quantity: normalizeQuantity(item.quantity)
      }));
      const blob = await buildOrderPdfBlob(orderData);
      const fileName = buildOrderFileName(orderData);
      const file = buildPdfFile(blob, fileName);

      saveOrderToHistory(orderData);
      setPreparedOrder({
        order: orderData,
        cartSnapshot,
        comment: toText(comment),
        blob,
        file,
        fileName
      });
      clearCart();
      setComment("");
      showToast("PDF заказа сформирован");
    } catch {
      showToast("Не удалось сформировать PDF");
    } finally {
      setIsPreparing(false);
    }
  };

  const handlePreparedDownload = async () => {
    if (!preparedOrder) {
      return;
    }

    try {
      const result = await downloadPdfBlob(preparedOrder.blob, preparedOrder.fileName);

      if (result?.native) {
        showToast(
          result.publicLocation
            ? "PDF сохранён в документы устройства"
            : "PDF сохранён во внутреннее хранилище приложения"
        );
      }
    } catch {
      showToast("Не удалось сохранить PDF");
    }
  };

  const handlePreparedShare = async () => {
    if (!preparedOrder) {
      return;
    }

    const shareAvailable = await canSharePdfFile(preparedOrder.file);

    if (!shareAvailable) {
      showToast(SHARE_FALLBACK_MESSAGE);
      return;
    }

    try {
      await sharePdfFile({
        file: preparedOrder.file,
        blob: preparedOrder.blob,
        fileName: preparedOrder.fileName,
        title: buildShareTitle(preparedOrder.order?.clientName)
      });
    } catch (error) {
      if (error?.name !== "AbortError") {
        showToast(SHARE_FALLBACK_MESSAGE);
      }
    }
  };

  const handleHistoryDownload = async (order) => {
    try {
      const blob = await buildOrderPdfBlob(order);
      const fileName = buildOrderFileName(order);
      const result = await downloadPdfBlob(blob, fileName);

      if (result?.native) {
        showToast(
          result.publicLocation
            ? "PDF сохранён в документы устройства"
            : "PDF сохранён во внутреннее хранилище приложения"
        );
      }
    } catch {
      showToast("Не удалось сохранить PDF");
    }
  };

  const handleHistoryShare = async (order) => {
    try {
      const blob = await buildOrderPdfBlob(order);
      const fileName = buildOrderFileName(order);
      const file = buildPdfFile(blob, fileName);
      const shareAvailable = await canSharePdfFile(file);

      if (!shareAvailable) {
        showToast(SHARE_FALLBACK_MESSAGE);
        return;
      }

      await sharePdfFile({
        file,
        blob,
        fileName,
        title: buildShareTitle(order?.clientName)
      });
    } catch (error) {
      if (error?.name !== "AbortError") {
        showToast(SHARE_FALLBACK_MESSAGE);
      }
    }
  };

  const handleDeleteHistory = (orderId) => {
    deleteHistory(orderId);
    showToast("Заказ удалён");
  };

  const handleHistoryTouchStart = (orderId, event) => {
    historyTouchStartRef.current[orderId] = event.changedTouches[0]?.clientX || 0;
  };

  const handleHistoryTouchEnd = (orderId, event) => {
    const startX = historyTouchStartRef.current[orderId];
    const endX = event.changedTouches[0]?.clientX || 0;

    delete historyTouchStartRef.current[orderId];

    if (typeof startX !== "number") {
      return;
    }

    if (endX - startX < SWIPE_DELETE_THRESHOLD) {
      handleDeleteHistory(orderId);
    }
  };

  const handleCartTouchStart = (itemId, event) => {
    const touch = event.changedTouches[0];
    cartTouchStartRef.current[itemId] = {
      x: touch?.clientX || 0,
      y: touch?.clientY || 0
    };
  };

  const handleCartTouchMove = (itemId, event) => {
    const touchStart = cartTouchStartRef.current[itemId];
    const touch = event.changedTouches[0];

    if (!touchStart || !touch) {
      return;
    }

    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;

    if (Math.abs(deltaY) > Math.abs(deltaX) || deltaX >= 0) {
      if (deltaX >= 0 && swipeOffsets[itemId]) {
        setSwipeOffsets((prev) => {
          if (!prev[itemId]) {
            return prev;
          }

          const next = { ...prev };
          delete next[itemId];
          return next;
        });
      }

      return;
    }

    const offset = Math.max(SWIPE_MAX_OFFSET, deltaX);
    setSwipeOffsets((prev) => (
      prev[itemId] === offset
        ? prev
        : { ...prev, [itemId]: offset }
    ));
  };

  const handleRemoveWithUndo = (item, index) => {
    if (removingItemIds[item.id]) {
      return;
    }

    setRemovingItemIds((prev) => ({ ...prev, [item.id]: true }));
    setSwipeOffsets((prev) => {
      if (!prev[item.id]) {
        return prev;
      }

      const next = { ...prev };
      delete next[item.id];
      return next;
    });

    window.setTimeout(() => {
      removeItem(item.id);
      setRemovingItemIds((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });

      showToast("Товар удалён из корзины", {
        actionLabel: "Вернуть",
        duration: 4200,
        onAction: () => {
          restoreRemovedItem(item, index);
        }
      });
    }, CART_REMOVE_ANIMATION_MS);
  };

  const handleCartTouchEnd = (itemId, event) => {
    const touchStart = cartTouchStartRef.current[itemId];
    const endX = event.changedTouches[0]?.clientX || 0;
    const currentOffset = swipeOffsets[itemId] || 0;

    delete cartTouchStartRef.current[itemId];

    if (!touchStart || typeof touchStart.x !== "number") {
      return;
    }

    const deltaX = endX - touchStart.x;
    const itemIndex = activeOrder.findIndex((item) => item.id === itemId);
    const item = itemIndex >= 0 ? activeOrder[itemIndex] : null;

    if (item && deltaX < SWIPE_DELETE_THRESHOLD) {
      handleRemoveWithUndo(item, itemIndex);
      return;
    }

    if (currentOffset <= SWIPE_RESET_THRESHOLD) {
      setSwipeOffsets((prev) => ({ ...prev, [itemId]: currentOffset }));
    }

    setSwipeOffsets((prev) => {
      if (!prev[itemId]) {
        return prev;
      }

      const next = { ...prev };
      delete next[itemId];
      return next;
    });
  };

  return (
    <div className={`cart-page ${hasClientCard ? "" : "cart-page-locked"}`}>

      <div className="cart-page-header">
        <div className="cart-header-copy">
          <h1>Корзина</h1>
          <p className="client-caption">
            {toText(activeClient?.name) || "Карта клиента не подключена"}
          </p>
          {hasClientCard && (
            <p className="client-tier">
              {getPriceTierLabel(priceTier)}
            </p>
          )}
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="header-chip"
            onClick={() => setHistoryOpen(true)}
          >
            История заказов
          </button>

          <button
            type="button"
            className="icon-button"
            onClick={() => setPriceTierSelectorOpen(true)}
            aria-label="Выбрать тип цены"
          >
            <span className="price-settings-glyph" aria-hidden="true">₽</span>
          </button>

          <button
            type="button"
            className="icon-button"
            onClick={() => setInfoOpen(true)}
            aria-label="Как оформить заказ"
          >
            <span className="info-glyph" aria-hidden="true">
              <Info size={16} strokeWidth={2.2} />
            </span>
          </button>
        </div>
      </div>

      {!hasClientCard ? (
        <div className="cart-locked-card glass">
          <strong>Функции корзины доступны зарегистрированным клиентам</strong>
          <p>
            Корзина, формирование заказов и отправка по отделам доступны для клиентов
            Golden Flowers или Oasis Flowers с активной картой клиента.
          </p>
        </div>
      ) : activeOrder.length > 0 ? (
        <div className="active-order">
          {activeOrder.map((item) => (
            <div key={item.id} className="cart-item-track">
              <div
                className="cart-item-delete-bg"
                aria-hidden="true"
                style={{
                  opacity: Math.min(1, Math.abs(swipeOffsets[item.id] || 0) / Math.abs(SWIPE_MAX_OFFSET))
                }}
              >
                <div className="cart-item-delete-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" height="28px" viewBox="0 -960 960 960" width="28px" fill="currentColor">
                    <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" />
                  </svg>
                </div>
              </div>

              <div
                className={`cart-item glass ${swipeOffsets[item.id] ? "is-swiping" : ""} ${removingItemIds[item.id] ? "is-removing" : ""}`}
                onTouchStart={(event) => handleCartTouchStart(item.id, event)}
                onTouchMove={(event) => handleCartTouchMove(item.id, event)}
                onTouchEnd={(event) => handleCartTouchEnd(item.id, event)}
                style={{
                  transform: removingItemIds[item.id]
                    ? "translateX(-112%) scale(0.98)"
                    : `translateX(${swipeOffsets[item.id] || 0}px)`
                }}
              >
                {(() => {
                  const unitPrice = resolvePriceByTier(item, priceTier);
                  const itemTotal = Number.isFinite(unitPrice)
                    ? unitPrice * normalizeQuantity(item.quantity)
                    : null;

                  return (
                    <>

                      <div className="item-top">
                        <strong title={toText(item.name)}>
                          {truncateText(item.name)}
                        </strong>
                        <button
                          className="remove"
                          onClick={() => {
                            const itemIndex = activeOrder.findIndex((cartItem) => cartItem.id === item.id);
                            handleRemoveWithUndo(item, itemIndex);
                          }}
                        >
                          ✕
                        </button>
                      </div>

                      <div className="item-bottom">

                        <span className="price">
                          {Number.isFinite(unitPrice)
                            ? `${unitPrice.toLocaleString("ru-RU")} ₽ / шт`
                            : "— / шт"}
                        </span>

                        <div className="qty">

                          <button onClick={() => updateQuantity(item.id, -1)}>−</button>

                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={item.quantity}
                            onChange={(event) =>
                              handleQuantityInput(item.id, event.target.value)
                            }
                            onBlur={() => {
                              if (item.quantity === "" || normalizeQuantity(item.quantity) === 0) {
                                setQuantity(item.id, 1);
                              }
                            }}
                          />

                          <button onClick={() => updateQuantity(item.id, 1)}>+</button>

                        </div>

                        <strong>
                          {Number.isFinite(itemTotal)
                            ? `${itemTotal.toLocaleString("ru-RU")} ₽`
                            : "—"}
                        </strong>

                      </div>
                    </>
                  );
                })()}

              </div>
            </div>
          ))}

          <div className="cart-meta glass">
            <label className="comment-field">
              <span>Комментарий</span>
              <textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="Напишите комментарий к заказу (необязательно)"
                rows={4}
              />
            </label>

            <div className="cart-tip">
              Перед формированием заказа проверьте количество. Некоторые товары продаются упаковками: 5, 10, 25, 50 шт и т.д.
            </div>
          </div>

        </div>
      ) : (
        <p className="no-orders glass">Нет активного заказа. <br />Добавьте товары из прайса в корзину.</p>
      )}

      {preparedOrder && (
        <div className="generated-actions glass">
          <div>
            <strong>PDF готов</strong>
            <p>
              Заказ сохранён в истории. Корзина очищена, но последний заказ можно вернуть для правки.
            </p>
          </div>

          <div className="generated-buttons">
            <button onClick={handlePreparedShare}>
              Поделиться
            </button>

            <button onClick={handlePreparedDownload}>
              Скачать PDF
            </button>

            <button onClick={handleRestorePreparedOrder}>
              Изменить последний заказ
            </button>
          </div>
        </div>
      )}

      {activeOrder.length > 0 && summaryRoot && createPortal(
        <div className="summary">
          <div className="summary-panel glass">
            <div>
              <span>Итого: </span>
              <strong>
                {total.toLocaleString("ru-RU")} ₽
              </strong>
            </div>

            <div className="summary-actions">
              <button
                className="secondary"
                onClick={clearCart}
              >
                Очистить
              </button>

              <button
                onClick={handleBuildOrder}
                disabled={isPreparing}
              >
                {isPreparing ? "Подготовка..." : "Сформировать заказ"}
              </button>
            </div>
          </div>
        </div>,
        summaryRoot
      )}

      <PriceTierSelector
        isOpen={priceTierSelectorOpen}
        onClose={() => setPriceTierSelectorOpen(false)}
      />

      {modalRoot && infoOpen && createPortal(
        <div
          className="cart-sheet-backdrop centered-backdrop"
          onClick={() => setInfoOpen(false)}
        >
          <div
            className="cart-sheet info-sheet"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sheet-header">
              <div>
                <div className="sheet-badge">Информация</div>
                <h2>Как оформить заказ</h2>
              </div>

              <button
                type="button"
                className="sheet-close"
                onClick={() => setInfoOpen(false)}
              >
                ×
              </button>
            </div>

            <div className="sheet-copy">
              {INFO_TEXT.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>

            <button
              type="button"
              className="sheet-action"
              onClick={() => setInfoOpen(false)}
            >
              Закрыть
            </button>
          </div>
        </div>,
        modalRoot
      )}

      {modalRoot && historyOpen && createPortal(
        <div
          className="cart-sheet-backdrop centered-backdrop"
          onClick={() => setHistoryOpen(false)}
        >
          <div
            className="cart-sheet history-sheet"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sheet-header">
              <div>
                <div className="sheet-badge">История</div>
                <h2>История заказов</h2>
                <p className="sheet-description">
                  Здесь хранятся последние сформированные заказы. Их можно снова скачать, отправить или удалить.
                </p>
              </div>

              <button
                type="button"
                className="sheet-close"
                onClick={() => setHistoryOpen(false)}
              >
                ×
              </button>
            </div>

            <div className="history-list">
              {history.length === 0 && (
                <div className="history-empty glass">
                  Заказы ещё не формировались.
                </div>
              )}

              {history.map((order) => (
                <div
                  key={order.id}
                  className="history-card glass"
                  onTouchStart={(event) => handleHistoryTouchStart(order.id, event)}
                  onTouchEnd={(event) => handleHistoryTouchEnd(order.id, event)}
                >
                  <div className="history-head">
                    <div>
                      <strong>{formatHistoryDateTime(order.createdAt)}</strong>
                      <p>{order.clientName || "Клиент GFCC"}</p>
                    </div>

                    <span>{order.items.length} позиций</span>
                  </div>

                  {order.comment && (
                    <div className="history-comment">
                      {order.comment}
                    </div>
                  )}

                  <div className="history-actions">
                    <button onClick={() => handleHistoryShare(order)}>
                      Поделиться
                    </button>

                    <button onClick={() => handleHistoryDownload(order)}>
                      Скачать PDF
                    </button>

                    <button
                      className="danger"
                      onClick={() => handleDeleteHistory(order.id)}
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="sheet-action"
              onClick={() => setHistoryOpen(false)}
            >
              Закрыть
            </button>
          </div>
        </div>,
        modalRoot
      )}

    </div>
  );
}
