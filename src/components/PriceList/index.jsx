import React from "react";
import { useCart } from "../../context/CartContext";
import { useToast } from "../../context/ToastContext";
import "./style.scss";

const normalizeCategory = (value) => {
  if (!value) return "";
  return value
    .replace(/^[^a-zA-Zа-яА-Я]+/, "")
    .replace(/[.,]/g, "")
    .trim()
    .toUpperCase();
};

function format(num) {
  return typeof num === "number"
    ? num.toLocaleString("ru-RU")
    : "–";
}

export default function PriceList({
  data,
  selectedCategory,
  searchTerm,
  fontSize
}) {

  /* ✅ Хук внутри компонента */
  const { addToCart } = useCart();

  const { showToast } = useToast();

  const filtered = data.filter((item) => {
    const cleanCategory = normalizeCategory(item.category);

    const matchesCategory = selectedCategory
      ? cleanCategory === selectedCategory
      : true;

    const matchesSearch = item.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  const sorted = filtered.sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  return (
    <div className="price-wrapper">
      <table
        className="price-table"
        style={{ fontSize: `${fontSize}px` }}
      >
        <thead>
          <tr>
            <th>Наименование</th>
            <th>Цена</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          {sorted.map((item, idx) => (
            <tr key={idx}>
              <td>{item.name?.toUpperCase()}</td>
              <td>{format(item.extraPrice)}</td>

              {/* ✅ Кнопка внутри td */}
              <td>
                <button
                  className="add-btn"
                  onClick={() => {
                    addToCart({
                      id: item.id,
                      name: item.name,
                      price: item.extraPrice
                    });

                    showToast("Добавлено в корзину");
                  }}
                >
                  +
                </button>
              </td>

            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}