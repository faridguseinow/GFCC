import { useState, useEffect } from "react";
import { useTheme } from "/src/useTheme";
import NavListItem from "../../components/NavListItem";
import "./style.scss";

const APP_VERSION = "1.0.0";

export default function Others() {
  const { theme, setTheme } = useTheme();

  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState(null);

  useEffect(() => {
    const savedName = localStorage.getItem("userName");
    const savedAvatar = localStorage.getItem("userAvatar");

    if (savedName) setName(savedName);
    if (savedAvatar) setAvatar(savedAvatar);
  }, []);

  const handleNameChange = (e) => {
    setName(e.target.value);
    localStorage.setItem("userName", e.target.value);
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      localStorage.setItem("userAvatar", reader.result);
      setAvatar(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const toggleTheme = () => {
    setTheme(theme === "light-theme" ? "dark-theme" : "light-theme");
  };

  const clearCache = () => {
    if (window.confirm("Очистить кэш приложения?")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const resetProfile = () => {
    if (window.confirm("Сбросить имя и аватар?")) {
      localStorage.removeItem("userName");
      localStorage.removeItem("userAvatar");
      setName("");
      setAvatar(null);
    }
  };

  const initials =
    name && name.length > 0
      ? name
        .split(" ")
        .map(n => n[0])
        .join("")
        .toUpperCase()
      : "Фото";

  return (
    <div className="others-page">

      {/* PROFILE */}
      <div className="profile-section glass">

        <div className="avatar-wrapper">
          <label>
            {avatar ? (
              <img src={avatar} alt="avatar" />
            ) : (
              <div className="avatar-fallback">
                {initials}
              </div>
            )}
            <input type="file" hidden onChange={handleAvatarUpload} />
          </label>

        </div>

        <div className="profile-fields">
          <input
            type="text"
            placeholder="Как вас называть?"
            value={name}
            onChange={handleNameChange}
          />
        </div>

      </div>

      {/* SETTINGS */}
      <div className="section">
        <div className="section-title">Настройки</div>

        <div className="settings-item glass">
          <span>Темная тема</span>

          <div
            className={`ios-switch ${theme === "dark-theme" ? "active" : ""}`}
            onClick={toggleTheme}
          >
            <div className="switch-circle" />
          </div>
        </div>

        <div className="settings-item glass" onClick={clearCache}>
          <span>Очистить кэш</span>
        </div>

        <div className="settings-item glass" onClick={resetProfile}>
          <span>Сбросить профиль</span>
        </div>

      </div>

      {/* TOOLS */}
      <div className="section">
        <div className="section-title">Инструменты</div>

        <NavListItem title="Конвертер валют" to="/others/converter" />
      </div>

      {/* DEVELOPER */}
      <div className="section">
        <div className="section-title">Поддержка</div>
        <NavListItem title="Частые вопросы" to="/others/faq" />

        <a
          href="https://t.me/YOUR_TELEGRAM_USERNAME"
          target="_blank"
          className="developer-link glass"
        >
          Связь с разработчиком
        </a>
      </div>

      {/* VERSION */}
      <div className="app-version">
        Версия приложения {APP_VERSION}
      </div>

    </div>
  );
}