import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import PriceList from "../../components/PriceList";
import NavListItem from "../../components/NavListItem";
import * as XLSX from "xlsx";
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

  const [isDesktop, setIsDesktop] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const selectedCategory = searchParams.get("category");

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const handleExport = () => {

    if (!Array.isArray(data) || data.length === 0) {
      console.error("Нет данных для экспорта");
      return;
    }

    const sorted = [...data]
      .filter(item => item.category && item.name)
      .sort((a, b) => {
        const catCompare =
          normalizeCategory(a.category)
            .localeCompare(normalizeCategory(b.category), 'ru');

        if (catCompare !== 0) return catCompare;

        return a.name.localeCompare(b.name, 'ru');
      });

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet([]);

    const today = new Date().toLocaleDateString('ru-RU');

    XLSX.utils.sheet_add_aoa(worksheet, [
      ["ПРАЙС ЛИСТ GFCC"],
      [`ЦЕНЫ ДЛЯ ЧАСТНЫХ ЛИЦ НА ${today}`],
      [],
      ["КАТЕГОРИЯ", "НАИМЕНОВАНИЕ", "ЦЕНА"]
    ], { origin: "A1" });

    const rows = sorted.map(item => [
      (item.category || '').toUpperCase(),
      (item.name || '').toUpperCase(),
      item.extraPrice ?? item.price ?? item.cost ?? ''
    ]);

    XLSX.utils.sheet_add_aoa(worksheet, rows, { origin: -1 });

    worksheet["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 2 } }
    ];

    worksheet["!cols"] = [
      { wch: 30 },
      { wch: 55 },
      { wch: 15 }
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, "ПРАЙС");

    XLSX.writeFile(workbook, `GFCC_Price_${today}.xlsx`);
  };



  /* DESKTOP */
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth > 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  /* FETCH */
  useEffect(() => {
    fetch("https://gfcc-price-api-server.onrender.com/api/prices")
      .then(res => res.json())
      .then(json => {
        const cleaned = Array.isArray(json)
          ? json.filter(i => i.name && i.category)
          : [];
        setData(cleaned);
        setLoading(false);
      });
  }, []);

  /* SCROLL RESET */
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [selectedCategory]);

  if (loading) {
    return <p className="price-loading">Загрузка свежего прайса...</p>;
  }

  /* CATEGORY MAP */
  const categoryMap = {};
  data.forEach(item => {
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
    .map(([key, count]) => ({ key, title: key, count }));

  const showProducts = Boolean(selectedCategory);

  return (
    <div className="price-page">

      {/* HEADER всегда один */}
      <div className={`sticky-header ${!selectedCategory ? "main-header" : ""}`}>
        <div className={showProducts ? "header-row" : "categories-header"}>

          {showProducts ? (
            <>
              <button
                className="price-back-btn"
                onClick={() => {
                  setSearchTerm("");
                  navigate("/price");
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor">
                  <path d="M400-80 0-480l400-400 71 71-329 329 329 329-71 71Z" />
                </svg>
              </button>

              <input
                className="price-search"
                placeholder="Поиск товара..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </>
          ) : (
            <>
              <h2>Прайс-лист Gold и Oasis</h2>
              <p>Цены для частных лиц (оптовые + 5%)</p>

              <div className="header-controls">
                <input
                  className="price-search"
                  placeholder="Поиск товара..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />

                {isDesktop && (
                  <button
                    className="export-btn"
                    onClick={handleExport}
                  >
                    Скачать прайс лист Excel
                  </button>
                )}
              </div>
            </>
          )}

        </div>
      </div>



      <div className="price-scroll-container">

        {showProducts || searchTerm.trim() !== "" ? (
          <PriceList
            data={data}
            selectedCategory={
              searchTerm.trim() !== "" ? null : selectedCategory
            }
            searchTerm={searchTerm}
            fontSize={14}
          />
        ) : (
          categories.map((cat) => {
            const Icon =
              priceCategoriesConfig.find(c => c.key === cat.key)?.icon
              || DEFAULT_CATEGORY_ICON;

            return (
              <NavListItem
                key={cat.key}
                title={cat.title}
                subtitle={`${cat.count} позиций`}
                to={`/price?category=${cat.key}`}
                icon={<Icon />}
              />
            );
          })
        )}

      </div>
    </div>
  );
}