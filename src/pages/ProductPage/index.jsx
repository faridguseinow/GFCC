import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { getProducts } from "../../data/api";
import "./style.scss";

export default function ProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);

  useEffect(() => {
    getProducts().then(data => {
      const found = data.find(p => String(p.id) === id);
      setProduct(found);
    });
  }, [id]);

  if (!product) return <div>Загрузка...</div>;

  return (
    <div className="product-page">

      <img src={product.image} className="product-image" />

      <h1 className="product-title">{product.title}</h1>

      <div className="product-info">
        <div className="product-row">
          <span className="product-label">GF</span>
          <span className="product-value">{product.locationGF}</span>
        </div>

        <div className="product-row">
          <span className="product-label">OA</span>
          <span className="product-value">{product.locationOA}</span>
        </div>

        <div className="product-row">
          <span className="product-label">Размеры</span>
          <span className="product-value">
            {product.sizes?.join(", ")}
          </span>
        </div>

        <div className="product-row">
          <span className="product-label">Страны</span>
          <span className="product-value">
            {product.countries?.join(", ")}
          </span>
        </div>
      </div>

      <div className="product-description">
        {product.description}
      </div>

      <button className="product-button">
        Перейти в прайс
      </button>

    </div>
  );
}