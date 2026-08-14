/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import PriceBaseSwitch from "../PriceBaseSwitch";
import { usePriceSource } from "../../context/PriceSourceContext";
import { usePriceTier } from "../../context/PriceTierContext";
import { PRICE_TIERS } from "../../utils/priceTier";
import "./style.scss";

export default function PriceTierSelector({ isOpen, onClose }) {
  const modalRoot = typeof document !== "undefined"
    ? document.getElementById("modal-root")
    : null;
  const portalTarget = modalRoot || (typeof document !== "undefined" ? document.body : null);
  const { availablePriceTiers, hasClientCard, priceTier, setPriceTier } = usePriceTier();
  const { priceBase, setPriceBase } = usePriceSource();
  const [draftPriceTier, setDraftPriceTier] = useState(priceTier);
  const [draftPriceBase, setDraftPriceBase] = useState(priceBase);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setDraftPriceTier(priceTier);
    setDraftPriceBase(priceBase);
  }, [isOpen, priceBase, priceTier]);

  useEffect(() => {
    if (!isOpen) {
      return () => { };
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
          <div className="price-tier-head-copy">            <h2 id="price-tier-title">Настройки прайса</h2>
            <p>Выберите склад и тип цены для прайс-листа, корзины и экспорта.</p>
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

        <div className="price-base-section">
          <div className="price-base-section-copy">
            <strong>Цены склада Gold или Oasis</strong>
            <span>Выберите, какой склад.</span>
          </div>

          <PriceBaseSwitch
            value={draftPriceBase}
            onChange={setDraftPriceBase}
          />
        </div>

        <div className="price-tier-list">
          {availablePriceTiers.map((tier) => {
            const isActive = tier.value === draftPriceTier;
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

                  setDraftPriceTier(tier.value);
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

        <button
          type="button"
          className="price-settings-save"
          onClick={() => {
            setPriceBase(draftPriceBase);
            setPriceTier(draftPriceTier);
            onClose();
          }}
        >
          Сохранить
        </button>
      </div>
    </div>,
    portalTarget
  );
}
