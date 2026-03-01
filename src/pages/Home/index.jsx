import { useState, useEffect } from "react";
import "./style.scss";
import FloorScheme from "../../components/FloorScheme";
import LazyImage from "../../components/LazyImage";

const catalogueMain = [
  { title: "Розы", img: "/catalogue/roses.webp" },
  { title: "Экзотика", img: "/catalogue/exotics.webp" },
  { title: "Хризантема", img: "/catalogue/chrysant.webp" },
  { title: "Гвоздика", img: "/catalogue/dianthus.webp" },
  { title: "Зелень", img: "/catalogue/green.webp" },
  { title: "Горшечные", img: "/catalogue/plants.webp" },
];

const catalogueExtra = [
  { title: "Удобрения", img: "/catalogue/drugs.webp" },
  { title: "Сухоцветы", img: "/catalogue/dried.webp" },
  { title: "Инструменты", img: "/catalogue/accessories.webp" },
  { title: "Упаковка", img: "/catalogue/packing.webp" },
  { title: "Ящики", img: "/catalogue/boxes.webp" },
  { title: "Корзины", img: "/catalogue/korzina.webp" },
  { title: "Горшки", img: "/catalogue/plastic.webp" },
  { title: "Декор", img: "/catalogue/dekor.webp" },
  { title: "Игрушки", img: "/catalogue/iqruwki.webp" },
];

export default function Home() {
  const [showNotice, setShowNotice] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem("launchNoticeDismissed");
    if (!dismissed) {
      setShowNotice(true);
    }
  }, []);

  const closeNotice = () => {
    localStorage.setItem("launchNoticeDismissed", "true");
    setShowNotice(false);
  };

  return (
    <div className="home-page">

      {showNotice && (
        <div className="launch-notice glass">
          <div className="notice-content">
            <h3>GFCC — Версия 1.0.0</h3>
            <p>
              Приложение запущено в раннем доступе из-за высокого спроса на прайс-лист.
              Возможны технические сбои.
            </p>
            <p>
              При проблемах: Профиль → Связь с разработчиком.
            </p>
            <p>
              Мы активно дорабатываем функционал. Следите за обновлениями в Telegram.
            </p>
            <button onClick={closeNotice}>Понятно</button>
          </div>
        </div>
      )}

      <div className="catalogue-wrapper">

        <h1 className="catalogue-title">Каталог товаров</h1>

        <div className="catalogue-grid">
          {catalogueMain.map((item) => (
            <CatalogueCard key={item.title} item={item} />
          ))}
        </div>

        <h1 className="catalogue-title">Сопутствующие</h1>

        <div className="catalogue-grid">
          {catalogueExtra.map((item) => (
            <CatalogueCard key={item.title} item={item} />
          ))}
        </div>

      </div>

      <FloorScheme />

    </div>
  );
}

function CatalogueCard({ item }) {
  return (
    <div className="catalogue-card glass">
      <div className="image-wrapper">
        <LazyImage
          src={item.img}
          alt={item.title}
          className="catalogue-image"
        />
      </div>
      <p>{item.title}</p>
    </div>
  );
}