/* eslint-disable react/prop-types */
import { useCart } from "../../context/CartContext";
import { usePriceSource } from "../../context/PriceSourceContext";
import { usePriceTier } from "../../context/PriceTierContext";
import { useToast } from "../../context/ToastContext";
import { resolvePriceByTier } from "../../utils/priceTier";
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

const toText = (value) => (value === null || value === undefined ? "" : String(value).trim());

const buildFallbackId = (item) => {
  const safeName = toText(item?.name).toLowerCase().replace(/\s+/g, "-") || "item";
  const safeCategory = normalizeCategory(item?.category).toLowerCase() || "catalogue";
  const safePrice = resolvePriceByTier(item, "extra") ?? 0;
  return `${safeCategory}-${safeName}-${safePrice}`;
};

const buildCartItemId = (item, priceBase) =>
  `${priceBase}:${toText(item?.id) || buildFallbackId(item)}`;

const buildCartProduct = (item, priceTier, priceBase) => ({
  id: buildCartItemId(item, priceBase),
  sourceId: toText(item?.id) || buildFallbackId(item),
  name: toText(item?.name) || "Товар",
  price: resolvePriceByTier(item, priceTier) ?? 0,
  legacyPrice: resolvePriceByTier(item, priceTier) ?? 0,
  wholesalePrice: Number.isFinite(Number(item?.wholesalePrice)) ? Number(item.wholesalePrice) : null,
  extraPrice: Number.isFinite(Number(item?.extraPrice)) ? Number(item.extraPrice) : null,
  retailPrice: Number.isFinite(Number(item?.retailPrice)) ? Number(item.retailPrice) : null,
  addedAtPriceTier: priceTier,
  priceBase,
  quantity: 1
});

export default function PriceList({
  data,
  selectedCategory,
  searchTerm,
  fontSize
}) {

  /* ✅ Хук внутри компонента */
  const { activeOrder, addToCart, removeItem, setQuantity } = useCart();
  const { priceBase } = usePriceSource();
  const { priceTier } = usePriceTier();
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
          {sorted.map((item, idx) => {
            const itemId = buildCartItemId(item, priceBase);
            const isSelected = activeOrder.some((cartItem) => cartItem.id === itemId);

            return (
            <tr key={itemId || idx} className={isSelected ? "selected-row" : ""}>
              <td>{item.name?.toUpperCase()}</td>
              <td>{format(resolvePriceByTier(item, priceTier))}</td>

              <td>
                <button
                  className={`add-btn ${isSelected ? "selected-btn" : ""}`}
                  onClick={() => {
                    const previousItem = activeOrder.find((cartItem) => cartItem.id === itemId);
                    const previousQuantity = previousItem ? Number(previousItem.quantity || 1) : 0;

                    addToCart(buildCartProduct(item, priceTier, priceBase));
                    showToast("Добавлено в корзину", {
                      actionLabel: "Отмена",
                      duration: 4200,
                      onAction: () => {
                        if (previousQuantity <= 0) {
                          removeItem(itemId);
                          return;
                        }

                        setQuantity(itemId, previousQuantity);
                      }
                    });
                  }}
                >
                  +
                </button>
              </td>

            </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
