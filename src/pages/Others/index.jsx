import { useNavigate } from "react-router-dom";
import { useTheme } from "/src/useTheme";
import NavListItem from "../../components/NavListItem";
import "./style.scss";

export default function Others() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(
      theme === "light-theme"
        ? "dark-theme"
        : "light-theme"
    );
  };

  return (
    <div className="profile-page">

      {/* 🔷 PROFILE CARD */}
      <div className="profile-card glass">
        <div className="profile-avatar">
          <img src="/default-avatar.png" alt="avatar" />
        </div>

        <div className="profile-info">
          <h3>Имя Фамилия</h3>
          <p>ID клиента</p>
        </div>
      </div>


      {/* 🔷 ИНСТРУМЕНТЫ */}
      <div className="section-title">Инструменты</div>

      <NavListItem
        title="Конвертер валют"
        to="/others/converter"
      />

      <NavListItem
        title="Частые вопросы"
        to="/others/faq"
      />

      {/* 🔷 НАСТРОЙКИ */}
      <div className="section-title">Настройки</div>

      <div className="settings-item glass">
        <span>Темная тема</span>

        <div
          className={`ios-switch ${
            theme === "dark-theme" ? "active" : ""
          }`}
          onClick={toggleTheme}
        >
          <div className="switch-circle"></div>
        </div>
      </div>

    </div>
  );
}