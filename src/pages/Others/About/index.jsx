import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./style.scss";

const APP_VERSION = "1.6.0";

export default function About() {
  const navigate = useNavigate();

  return (
    <div className="about-page">
      <main className="about-document">
        <header className="about-header">
          <button type="button" className="about-back" onClick={() => navigate(-1)} aria-label="Назад">
            <ArrowLeft size={22} />
          </button>
          <div>
            <h1>О приложении</h1>
            <p>GFCC Oasis · версия {APP_VERSION}</p>
          </div>
        </header>

        <div className="about-content">
          <p>
            GFCC Oasis — рабочее приложение для клиентов Golden Flowers и
            Oasis Flowers. Оно объединяет клиентскую карту, актуальные
            прайс-листы, каталог товаров, информацию о складах и контакты.
          </p>

          <h2>Возможности приложения</h2>
          <p>
            Зарегистрированный клиент может подключить клиентскую карту по
            шестизначному коду, использовать её штрихкод и добавлять товары в
            корзину. Пользователи без подключённой карты могут просматривать
            каталог и цены, доступные частным покупателям.
          </p>
          <p>
            Информация в приложении загружается из рабочих источников GFCC.
            Для стабильной работы часть данных и пользовательских настроек
            может сохраняться на устройстве.
          </p>

          <h2>Официальные сайты</h2>
          <p className="about-sites">
            <a href="https://www.gfcc.ru/" target="_blank" rel="noreferrer">Golden Flowers</a>
            <span>·</span>
            <a href="https://oasisflowers.ru/" target="_blank" rel="noreferrer">Oasis Flowers</a>
          </p>

          <h2>Обратная связь</h2>
          <p>
            Вопросы по работе приложения можно направить через раздел
            «Контакты» или на адрес goldenflowerscc@gmail.com.
          </p>
        </div>

        <footer className="about-footer">
          <a href="https://gfcc-oasis.ru/admin/login.php">Для администраторов GFCC</a>
        </footer>
      </main>
    </div>
  );
}
