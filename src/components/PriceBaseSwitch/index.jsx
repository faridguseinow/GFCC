/* eslint-disable react/prop-types */
import { usePriceSource } from "../../context/PriceSourceContext";
import "./style.scss";

export default function PriceBaseSwitch({
  compact = false,
  value,
  onChange
}) {
  const { availablePriceBases, priceBase, setPriceBase } = usePriceSource();
  const activeBase = value || priceBase;
  const handleChange = onChange || setPriceBase;

  return (
    <div className={`price-base-switch ${compact ? "compact" : ""}`} aria-label="Выбор базы прайса">
      {availablePriceBases.map((base) => (
        <button
          key={base.value}
          type="button"
          className={base.value === activeBase ? "active" : ""}
          onClick={() => handleChange(base.value)}
          title={base.title}
        >
          {base.label}
        </button>
      ))}
    </div>
  );
}
