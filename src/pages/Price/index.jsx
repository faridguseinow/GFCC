import React, { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import PriceList from "../../components/PriceList";
import NavListItem from "../../components/NavListItem";
import "./style.scss";

import {
  priceCategoriesConfig,
  DEFAULT_CATEGORY_ICON
} from "../../config/priceCategories";

const normalizeCategory = (value) => {
  if (!value) return "";
  return value
    .replace(/^[^a-zA-Zа-яА-Я]+/, "")
    .replace(/[.,]/g, "")
    .trim()
    .toUpperCase();
};

export default function Price() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const selectedCategory = searchParams.get("category");

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const categoriesScrollRef = useRef(null);
  const productsScrollRef = useRef(null);

  /* =============================
     SAVE SCROLL
  ============================== */

  const saveCategoriesScroll = () => {
    if (categoriesScrollRef.current) {
      sessionStorage.setItem(
        "categoriesScroll",
        categoriesScrollRef.current.scrollTop
      );
    }
  };

  const saveProductsScroll = () => {
    if (productsScrollRef.current) {
      sessionStorage.setItem(
        "productsScroll",
        productsScrollRef.current.scrollTop
      );
    }
  };

  /* =============================
     RESTORE SCROLL
  ============================== */

  useEffect(() => {
    if (!selectedCategory && categoriesScrollRef.current) {
      const saved = sessionStorage.getItem("categoriesScroll");
      if (saved) {
        categoriesScrollRef.current.scrollTop = Number(saved);
      }
    }
  }, [selectedCategory]);

  useEffect(() => {
    if (selectedCategory && productsScrollRef.current) {
      const saved = sessionStorage.getItem("productsScroll");
      if (saved) {
        productsScrollRef.current.scrollTop = Number(saved);
      }
    }
  }, [selectedCategory]);

  /* ============================= */

  useEffect(() => {
    fetch("https://gfcc-price-api-server.onrender.com/api/prices")
      .then((res) => res.json())
      .then((json) => {
        const cleaned = Array.isArray(json)
          ? json.filter((i) => i.name && i.category)
          : [];
        setData(cleaned);
        setLoading(false);
      });
  }, []);

  const getCategoryIcon = (key) => {
    const match = priceCategoriesConfig.find(
      (item) => item.key === key
    );
    return match ? match.icon : DEFAULT_CATEGORY_ICON;
  };

  if (loading) {
    return <p className="price-loading">Загрузка свежего прайса...</p>;
  }

  /* =============================
     PRODUCTS MODE
  ============================== */

  if (selectedCategory) {
    return (
      <div className="price-page">

        <div className="sticky-header">
          <div className="header-row">
            <button
              className="price-back-btn"
              onClick={() => {
                saveProductsScroll();
                navigate("/price");
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="currentColor"><path d="M400-80 0-480l400-400 71 71-329 329 329 329-71 71Z" /></svg>
            </button>

            <input
              className="price-search"
              placeholder="Поиск товара..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div
          className="price-scroll-container"
          ref={productsScrollRef}
          onScroll={saveProductsScroll}
        >
          <PriceList
            data={data}
            selectedCategory={selectedCategory}
            searchTerm={searchTerm}
            fontSize={14}
          />
        </div>

      </div>
    );
  }

  /* =============================
     CATEGORIES MODE
  ============================== */

  const categoryMap = {};

  data.forEach((item) => {
    const clean = normalizeCategory(item.category);
    if (!categoryMap[clean]) categoryMap[clean] = 0;
    categoryMap[clean]++;
  });

  const categories = Object.entries(categoryMap)
    .sort((a, b) => {
      const configA = priceCategoriesConfig.find(c => c.key === a[0]);
      const configB = priceCategoriesConfig.find(c => c.key === b[0]);

      const orderA = configA ? configA.order : 999;
      const orderB = configB ? configB.order : 999;

      return orderA - orderB;
    })
    .map(([key, count]) => ({
      key,
      title: key,
      count
    }));

  return (
    <div className="price-page">

      <div className="categories-header">
        <h2>Прайс-лист Gold и Oasis</h2>
        <p>Выберите категорию для просмотра ассортимента</p>
      </div>

      <div
        className="price-scroll-container"
        ref={categoriesScrollRef}
        onScroll={saveCategoriesScroll}
      >
        {categories.map((cat) => {
          const Icon = getCategoryIcon(cat.key);
          return (
            <NavListItem
              key={cat.key}
              title={cat.title}
              subtitle={`${cat.count} позиций`}
              to={`/price?category=${cat.key}`}
              icon={<Icon />}
            />
          );
        })}
      </div>

    </div>
  );
}