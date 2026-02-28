import { useCart } from "../../context/CartContext";
import { useToast } from "../../context/ToastContext";

import "./style.scss";

export default function Cart() {

  const { showToast } = useToast();

  const {
    activeOrder,
    history,
    updateQuantity,
    setQuantity,
    removeItem,
    finalizeOrder,
    copyOrder,
    deleteHistory,
    editHistory
  } = useCart();

  const total = activeOrder.reduce(
    (acc, i) => acc + i.price * i.quantity,
    0
  );

  return (
    <div className="cart-page">

      <h1>Корзина</h1>

      {/* ===== АКТИВНЫЙ ЗАКАЗ ===== */}

      {activeOrder.length > 0 && (
        <div className="active-order">

          {activeOrder.map(item => (
            <div key={item.id} className="cart-item glass">

              <div className="item-top">
                <strong>{item.name}</strong>
                <button
                  className="remove"
                  onClick={() => removeItem(item.id)}
                >
                  ✕
                </button>
              </div>

              <div className="item-bottom">

                <span className="price">
                  {item.price} ₽ / шт
                </span>

                <div className="qty">

                  <button onClick={() => updateQuantity(item.id, -1)}>−</button>

                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) =>
                      setQuantity(item.id, e.target.value)
                    }
                  />

                  <button onClick={() => updateQuantity(item.id, 1)}>+</button>

                </div>

                <strong>
                  {(item.price * item.quantity)
                    .toLocaleString("ru-RU")} ₽
                </strong>

              </div>

            </div>
          ))}

          {/* ===== ИТОГ ===== */}

          <div className="summary glass">
            <div>
              <span>Итого: </span>
              <strong>
                {total.toLocaleString("ru-RU")} ₽
              </strong>
            </div>

            <button
              onClick={() => {
                showToast("Заказ сформирован");
                setTimeout(() => {
                  finalizeOrder();
                }, 50);
              }}
            >
              Сформировать заказ
            </button>
          </div>

        </div>
      )}

      {activeOrder.length === 0 && (
        <p className="no-orders glass">Нет активного заказа</p>
      )}

      {/* ===== ИСТОРИЯ ОТДЕЛЬНО ===== */}

      {history.length > 0 && (
        <div className="history-section">

          <h2>История сформированных заказов</h2>

          {history.map(order => (
            <div key={order.id} className="history-card glass">

              <div className="history-head">
                <div>
                  <strong>{order.date}</strong>
                  <p>{order.items.length} позиций</p>
                </div>

                <strong>
                  {order.total.toLocaleString("ru-RU")} ₽
                </strong>
              </div>

              <div className="history-actions">
                <button onClick={() => {
                  showToast("Заказ скопирован");
                  copyOrder(order);
                }}
                >
                  Копировать
                </button>

                <button onClick={() => editHistory(order)}>
                  Изменить
                </button>

                <button
                  className="danger"
                  onClick={() => deleteHistory(order.id)}
                >
                  Удалить
                </button>
              </div>

            </div>
          ))}

        </div>
      )}

    </div>
  );
}