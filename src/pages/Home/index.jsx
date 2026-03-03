import { useState, useEffect } from "react";
import "./style.scss";
import FloorScheme from "../../components/FloorScheme";
import LazyImage from "../../components/LazyImage";
import DepartmentVideosSection from "../../components/DepartmentVideosSection";
import ClientQR from "../../components/ClientQR";

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
            <ul>GFCC — Версия 1.1.0 - полноценная</ul>
            <li>
              Это доработанная первая
              версия приложения. Изменения:<br />1. Добавили поиск товара прямо из категорий; <br />2. Улучшили функционал и дизайн раздела контактов; <br />3. При клике на адрес компании в разделе контактов кидает в яндекс карты;<br />4. Добавили Карту клиента;<br />3. Добавили видеораздел с обзорами отделов компании Golden Flowers.
            </li>
            <li>
              При проблемах: Профиль → Связь с разработчиком.
            </li>
            <li>
              Мы активно дорабатываем функционал. Следите за обновлениями в Telegram.
            </li>
            <button onClick={closeNotice}>Понятно</button>
          </div>
        </div>
      )}

      <ClientQR />

      <div className="qr-about-wrapper">
        <h2>Карта клиента — это быстрый доступ к вашему профилю в базе.
        </h2>
        <p>- Введите 6-значный код и создайте персональный штрих-код для сканирования на зоне подсчёта товаров (на диктовке). <br />

          - Сотруднику больше не нужно искать вас по фамилии — достаточно одного сканирования.
          Это быстрее, удобнее и исключает ошибки. <br />

          - Получить код можно на кассе, в офисе или через раздел «Профиль → Связь с разработчиком».</p>
      </div>

      <DepartmentVideosSection />

      <div className="catalogue-wrapper">

        <h1 className="catalogue-title">Основной ассортимент</h1>

        <div className="catalogue-grid">
          {catalogueMain.map((item) => (
            <CatalogueCard key={item.title} item={item} />
          ))}
        </div>

        <h1 className="catalogue-title">Сопутствующие товары</h1>

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