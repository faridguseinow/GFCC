import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import "./style.scss";

export default function CatalogueGrid({
  products = [],
  loading = false,
  title = "",
  linkOnly = false
}) {
  const modalRoot = typeof document !== "undefined"
    ? document.getElementById("modal-root")
    : null;
  const getSkeletonItemsCount = () =>
    window.innerWidth <= 768 ? 4 : 6;

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeImage, setActiveImage] = useState("");
  const [activeItems, setActiveItems] = useState(products);
  const [parentProduct, setParentProduct] = useState(null);

  useEffect(() => {
    if (!selectedProduct) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setSelectedProduct(null);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [selectedProduct]);

  useEffect(() => {
    setActiveItems(products);
    setParentProduct(null);
  }, [products]);

  const currentTitle = parentProduct?.title || title;

  const handleCardClick = (product) => {
    if (linkOnly) {
      if (product.href) {
        window.open(product.href, "_blank", "noopener,noreferrer");
      }
      return;
    }

    if (product.variants?.length) {
      setParentProduct(product);
      setActiveItems(product.variants);
      return;
    }

    openModal(product);
  };

  const openModal = (product) => {
    setSelectedProduct(product);
    setActiveImage(product.images?.[0] || product.image || "");
  };

  const closeModal = () => {
    setSelectedProduct(null);
    setActiveImage("");
  };

  if (loading) {
    return (
      <div className="catalogue-grid">
        {Array.from({ length: getSkeletonItemsCount() }).map((_, i) => (
          <div key={i} className="catalogue-skeleton">
            <div className="skeleton-image" />
            <div className="skeleton-text" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="catalogue-grid">
        {activeItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className="catalogue-card"
            onClick={() => handleCardClick(item)}
          >
            <div className="catalogue-image-wrapper">
              {item.image ? (
                <img
                  src={item.image}
                  className="catalogue-image"
                  alt={item.title}
                  loading="lazy"
                />
              ) : (
                <div className="catalogue-image catalogue-image-placeholder" />
              )}
            </div>

            <div className="catalogue-title">
              {item.title}
            </div>
          </button>
        ))}
      </div>

      {parentProduct && !linkOnly && (
        <div className="catalogue-subheader">
          <button
            type="button"
            className="catalogue-back-btn"
            onClick={() => {
              setParentProduct(null);
              setActiveItems(products);
            }}
          >
            ← Назад
          </button>

          <div className="catalogue-subtitle">
            {parentProduct.title}
          </div>
        </div>
      )}

      {selectedProduct && !linkOnly && modalRoot && createPortal(
        <div
          className="catalogue-modal-backdrop"
          onClick={closeModal}
        >
          <div
            className="catalogue-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="catalogue-modal-close"
              onClick={closeModal}
              aria-label="Закрыть"
            >
              ×
            </button>

            {activeImage && (
              <img
                src={activeImage}
                alt={selectedProduct.title}
                className="catalogue-modal-image"
              />
            )}

            {!!selectedProduct.images?.length && (
              <div className="catalogue-modal-thumbs">
                {selectedProduct.images.map((image) => (
                  <button
                    key={image}
                    type="button"
                    className={`catalogue-modal-thumb ${activeImage === image ? "active" : ""}`}
                    onClick={() => setActiveImage(image)}
                  >
                    <img src={image} alt={selectedProduct.title} />
                  </button>
                ))}
              </div>
            )}

            <div className="catalogue-modal-content">

              <div className="catalogue-modal-category">
                {selectedProduct.category}
              </div>

              <h3 className="catalogue-modal-title">
                {selectedProduct.title}
              </h3>

              {selectedProduct.description && (
                <div
                  className="catalogue-modal-description"
                  dangerouslySetInnerHTML={{
                    __html: selectedProduct.description
                  }}
                />
              )}

              <div className="catalogue-modal-details">
                {selectedProduct.plantation && (
                  <div className="catalogue-detail-row">
                    Плантация: {selectedProduct.plantation}
                  </div>
                )}

                {selectedProduct.quantity && (
                  <div className="catalogue-detail-row">
                    Количество: {selectedProduct.quantity}
                  </div>
                )}

                {selectedProduct.height && (
                  <div className="catalogue-detail-row">
                    Высота: {selectedProduct.height}
                  </div>
                )}

                {selectedProduct.color && (
                  <div className="catalogue-detail-row">
                    Цвет: {selectedProduct.color}
                  </div>
                )}

                {selectedProduct.season && (
                  <div className="catalogue-detail-row">
                    Сезон: {selectedProduct.season}
                  </div>
                )}

                {selectedProduct.size && (
                  <div className="catalogue-detail-row">
                    Размер: {selectedProduct.size}
                  </div>
                )}

                {selectedProduct.department && (
                  <div className="catalogue-detail-row">
                    Категории: {selectedProduct.department}
                  </div>
                )}
              </div>

              {!!selectedProduct.variants?.length && (
                <div className="catalogue-variants">
                  <h4 className="catalogue-variants-title">
                    Варианты
                  </h4>

                  <div className="catalogue-variants-list">
                    {selectedProduct.variants.map((variant) => (
                      <div key={variant.id} className="catalogue-variant-card">
                        <div className="catalogue-variant-name">
                          {variant.title}
                        </div>

                        {variant.description && (
                          <div
                            className="catalogue-variant-description"
                            dangerouslySetInnerHTML={{
                              __html: variant.description
                            }}
                          />
                        )}

                        {variant.plantation && (
                          <div className="catalogue-variant-meta">
                            Плантация: {variant.plantation}
                          </div>
                        )}

                        {variant.quantity && (
                          <div className="catalogue-variant-meta">
                            Количество: {variant.quantity}
                          </div>
                        )}

                        {variant.height && (
                          <div className="catalogue-variant-meta">
                            Высота: {variant.height}
                          </div>
                        )}

                        {variant.color && (
                          <div className="catalogue-variant-meta">
                            Цвет: {variant.color}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedProduct.href && (
                <div className="catalogue-modal-actions">
                  <a
                    href={selectedProduct.href}
                    target="_blank"
                    rel="noreferrer"
                    className="catalogue-link-btn"
                  >
                    Открыть сайт
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>,
        modalRoot
      )}
    </>
  );
}
