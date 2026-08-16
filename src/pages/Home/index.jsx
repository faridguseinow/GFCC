import { useEffect, useMemo, useState } from "react";
import "./style.scss";

import DepartmentVideosSection from "../../components/DepartmentVideosSection";
import ClientQR from "../../components/ClientQR";
import CatalogueGrid from "../../components/CatalogueGrid";

import {
  catalogueCacheTtlMs,
  getAccessoriesCatalogue,
  getCatalogueProducts,
  getCooperationCatalogue,
  getPlantsCatalogue
} from "../../data/api";

const APP_VERSION = "1.5.3";
const LAUNCH_NOTICE_STORAGE_KEY = "launchNoticeDismissedVersion";

const SECTION_DEFINITIONS = [
  {
    id: "flowers",
    title: "Срезанные цветы",
    description: "Основной цветочный каталог с сортами и подробными вариантами.",
    unit: "товаров",
    coverImage: "https://sun9-40.userapi.com/s/v1/ig2/AcY_mjqAFTYSDvec1bK8yoco1V-fdNA67tZofMAj82BBad_M9MacC1LEMQY4PC7USzFbu5v5MT0CQS5j_6XWJm9e.jpg?quality=95&as=32x24,48x36,72x54,108x81,160x120,240x180,360x270,480x360,540x405,640x480,720x540,1080x810,1280x960,1440x1080,2560x1920&from=bu&cs=1280x0"
  },
  {
    id: "plants",
    title: "Растения",
    description: "Живые растения для дома и офиса с описанием ухода.",
    unit: "товаров",
    coverImage: "https://sun9-13.userapi.com/s/v1/ig2/dIMkLLEH6pKdLnQjEmKH1bgys5th6yQtr1_F6l2_uxVVVb0Whx84I0yQ7VqpnIZ0WacEDqxiVFQKYTFNXl0CWtlz.jpg?quality=95&as=32x21,48x32,72x48,108x72,160x107,240x160,360x240,480x320,540x360,640x427,720x480,1080x720,1280x853,1440x960,2560x1707&from=bu&cs=1280x0"
  },
  {
    id: "accessories",
    title: "Аксессуары и упаковка",
    description: "Упаковка, декор, корзины и сопутствующие товары для флористики.",
    unit: "товаров",
    coverImage: "https://sun9-79.userapi.com/s/v1/ig2/UgWvtSLNmtm2ciIZxl8PS4_DgER1JgTUKISwK2h5FKWBvEDKwC7xaw6unTLJAo-NdqPYIAYlY7zcbN8q9KE1rz4x.jpg?quality=95&as=32x17,48x25,72x38,108x56,160x84,240x125,360x188,480x251,540x282,640x334,720x376,1080x564,1280x669,1440x753,2497x1305&from=bu&cs=1280x0"
  },
  {
    id: "cooperation",
    title: "Партнеры и поставщики",
    description: "Производители и бренды, с которыми мы сотрудничаем.",
    unit: "компаний",
    coverImage: "https://sun9-84.userapi.com/s/v1/ig2/hpWSrA4T7bzxl0FSefGo6wTsoWd4fC0uKzHQ44uZu-pe42DVauKNxhdCzbXe5zk18mqZm4hb792XrY6-NxamE6WI.jpg?quality=95&as=32x21,48x32,72x48,108x72,160x107,240x160,360x240,480x320,540x360,640x427,720x480,1080x720,1280x853,1440x960,2560x1707&from=bu&cs=1280x0"
  }
];

const SECTION_LOADERS = {
  flowers: getCatalogueProducts,
  plants: getPlantsCatalogue,
  accessories: getAccessoriesCatalogue,
  cooperation: getCooperationCatalogue
};

const getInnerItemsCount = (products = []) =>
  products.reduce((total, product) => {
    const variantsCount = Array.isArray(product?.variants) ? product.variants.length : 0;
    return total + (variantsCount > 0 ? variantsCount : 1);
  }, 0);

const getSectionSubtitle = (sectionId, state) => {
  if (state?.loading) {
    return "Загрузка...";
  }

  if (state?.loaded) {
    const sectionMeta = SECTION_DEFINITIONS.find((entry) => entry.id === sectionId);
    const unit = sectionMeta?.unit || "позиций";
    const innerCount = getInnerItemsCount(state.products);

    return `${innerCount} ${unit}`;
  }

  return "Нажмите, чтобы загрузить";
};

export default function Home() {
  const [showNotice, setShowNotice] = useState(false);
  const [hasClientBarcode, setHasClientBarcode] = useState(() =>
    !!localStorage.getItem("client_code")
  );
  const [openSectionId, setOpenSectionId] = useState("");
  const [sectionStates, setSectionStates] = useState(() =>
    SECTION_DEFINITIONS.reduce((acc, section) => {
      acc[section.id] = {
        products: [],
        loading: false,
        loaded: false,
        loadedAt: 0
      };

      return acc;
    }, {})
  );

  useEffect(() => {
    const dismissedVersion = localStorage.getItem(LAUNCH_NOTICE_STORAGE_KEY);
    if (dismissedVersion !== APP_VERSION) {
      setShowNotice(true);
    }
  }, []);

  useEffect(() => {
    const handleClientCodeReady = (event) => {
      setHasClientBarcode(!!event.detail?.ready);
    };

    window.addEventListener("gfcc:client-code-ready", handleClientCodeReady);

    return () => {
      window.removeEventListener("gfcc:client-code-ready", handleClientCodeReady);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    setSectionStates((prev) =>
      SECTION_DEFINITIONS.reduce((acc, section) => {
        const current = prev[section.id];
        const isFresh = current?.loaded && Date.now() - current.loadedAt < catalogueCacheTtlMs;

        acc[section.id] = isFresh || current?.loading
          ? current
          : {
            ...current,
            loading: true
          };

        return acc;
      }, {})
    );

    Promise.all(
      SECTION_DEFINITIONS.map(async (section) => {
        const loadSection = SECTION_LOADERS[section.id];

        if (!loadSection) {
          return [section.id, []];
        }

        try {
          const products = await loadSection();
          return [section.id, Array.isArray(products) ? products : []];
        } catch {
          return [section.id, []];
        }
      })
    ).then((entries) => {
      if (cancelled) {
        return;
      }

      const loadedAt = Date.now();

      setSectionStates((prev) =>
        entries.reduce((acc, [sectionId, products]) => {
          acc[sectionId] = {
            ...prev[sectionId],
            products,
            loading: false,
            loaded: true,
            loadedAt
          };

          return acc;
        }, { ...prev })
      );
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!openSectionId) {
      return;
    }

    const current = sectionStates[openSectionId];
    const isFresh = current?.loaded && Date.now() - current.loadedAt < catalogueCacheTtlMs;

    if (isFresh || current?.loading) {
      return;
    }

    const loadSection = SECTION_LOADERS[openSectionId];
    if (!loadSection) {
      return;
    }

    let cancelled = false;

    setSectionStates((prev) => ({
      ...prev,
      [openSectionId]: {
        ...prev[openSectionId],
        loading: true
      }
    }));

    loadSection()
      .then((products) => {
        if (cancelled) {
          return;
        }

        setSectionStates((prev) => ({
          ...prev,
          [openSectionId]: {
            ...prev[openSectionId],
            products: Array.isArray(products) ? products : [],
            loading: false,
            loaded: true,
            loadedAt: Date.now()
          }
        }));
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        setSectionStates((prev) => ({
          ...prev,
          [openSectionId]: {
            ...prev[openSectionId],
            loading: false,
            loaded: true,
            loadedAt: Date.now()
          }
        }));
      });

    return () => {
      cancelled = true;
    };
  }, [openSectionId, sectionStates]);

  const sections = useMemo(
    () => SECTION_DEFINITIONS.map((section) => ({
      ...section,
      subtitle: getSectionSubtitle(section.id, sectionStates[section.id]),
      products: sectionStates[section.id]?.products || [],
      loading: !!sectionStates[section.id]?.loading
    })),
    [sectionStates]
  );

  const closeNotice = () => {
    localStorage.setItem(LAUNCH_NOTICE_STORAGE_KEY, APP_VERSION);
    setShowNotice(false);
  };

  return (
    <div className="home-page">

      {showNotice && (
        <div className="launch-notice glass">
          <div className="notice-content">
            <ul>GFCC — Версия {APP_VERSION}</ul>
            <li>
              Серверы теперь находятся в России, поэтому прайс-листы в приложении работают без VPN.
            </li>
            <li>
              Добавлен прайс-лист цветочного склада Oasis Flowers как отдельный прайс-лист. Его можно выбрать в настройках прайс-листа.
            </li>
            <li>
              Оптовая цена и функция корзины доступны зарегистрированным клиентам Golden Flowers и Oasis Flowers с активной картой клиента.
            </li>
            <li>
              Исправлены ошибки. Улучшена стабильность, безопасность и оптимизирована работа приложения.
            </li>
            <button onClick={closeNotice}>Понятно</button>
          </div>
        </div>
      )}

      <ClientQR />

      {!hasClientBarcode && (
        <div className="qr-about-wrapper">
          <h2>Быстрый доступ к профилю</h2>
          <p>
            - Введите 6-значный код, полученный в офисе, и используйте штрих-код для быстрого доступа к вашему профилю во время просчёта товара.
          </p>
          <p>
            - Клиенты с активной картой получают доступ к функции корзины и оптовым ценам в прайс-листе.
          </p>
          <p>
            - Код предоставляется зарегистрированным клиентам. Для регистрации просим подойти в офис и обратиться к менеджеру.
          </p>
        </div>
      )}

      <DepartmentVideosSection />

      <section className="catalogue-wrapper">
        <div className="catalogue-heading">
          <h2>Каталог товаров</h2>
          <p>Откройте нужный раздел и просматривайте товары в удобном формате.</p>
        </div>

        <div className="catalogue-sections">
          {sections.map((section) => {
            const isOpen = openSectionId === section.id;

            return (
              <div
                key={section.id}
                className={`catalogue-section-card glass ${isOpen ? "open" : ""}`}
              >
                <button
                  type="button"
                  className="catalogue-section-toggle"
                  onClick={() =>
                    setOpenSectionId((current) =>
                      current === section.id ? "" : section.id
                    )
                  }
                >
                  <div
                    className="catalogue-section-cover"
                    style={{ backgroundImage: `url(${section.coverImage})` }}
                  />

                  <div className="catalogue-section-content">
                    <div className="catalogue-section-copy">
                      <h3>{section.title}</h3>
                      <span>{section.subtitle}</span>
                      <p>{section.description}</p>
                    </div>

                    <div className={`catalogue-section-arrow ${isOpen ? "open" : ""}`}>
                      +
                    </div>
                  </div>
                </button>

                {isOpen && (
                  <div className="catalogue-section-body">
                    <CatalogueGrid
                      products={section.products}
                      loading={section.loading}
                      title={section.title}
                      linkOnly={section.id === "cooperation"}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

    </div>
  );
}
