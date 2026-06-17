/* eslint-disable react/prop-types */
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { usePriceTier } from "../../context/PriceTierContext";
import { PRICE_TIERS } from "../../utils/priceTier";
import "./style.scss";

export default function PriceTierSelector({ isOpen, onClose }) {
  const modalRoot = typeof document !== "undefined"
    ? document.getElementById("modal-root")
    : null;
  const portalTarget = modalRoot || (typeof document !== "undefined" ? document.body : null);
  const { availablePriceTiers, hasClientCard, priceTier, setPriceTier } = usePriceTier();

  useEffect(() => {
    if (!isOpen) {
      return () => {};
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !portalTarget) {
    return null;
  }

  return createPortal(
    <div
      className="price-tier-backdrop"
      onClick={onClose}
    >
      <div
        className="price-tier-sheet"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="price-tier-title"
      >
        <div className="price-tier-head">
          <div>
            <div className="price-tier-label">Настройка</div>
            <h2 id="price-tier-title">Тип цены</h2>
          </div>

          <button
            type="button"
            className="price-tier-close"
            onClick={onClose}
            aria-label="Закрыть выбор цены"
          >
            ×
          </button>
        </div>

        <div className="price-tier-list">
          {availablePriceTiers.map((tier) => {
            const isActive = tier.value === priceTier;
            const isWholesaleLocked = tier.value === PRICE_TIERS.WHOLESALE && !hasClientCard;

            return (
              <button
                key={tier.value}
                type="button"
                className={`price-tier-option ${isActive ? "active" : ""}`}
                onClick={() => {
                  if (!tier.allowed) {
                    return;
                  }

                  setPriceTier(tier.value);
                  onClose();
                }}
                disabled={!tier.allowed}
              >
                <div className="price-tier-copy">
                  <strong>{tier.label}</strong>
                  <span>{tier.subtitle}</span>
                  {isWholesaleLocked && (
                    <em>Доступно с картой клиента</em>
                  )}
                </div>

                <div className="price-tier-meta">
                  {isWholesaleLocked ? (
                    <span className="price-tier-lock" aria-hidden="true">🔒</span>
                  ) : (
                    <span className={`price-tier-dot ${isActive ? "active" : ""}`} />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>,
    portalTarget
  );
}
