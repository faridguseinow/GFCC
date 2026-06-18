import { useState, useEffect } from "react";
import {
  ArrowLeftRight,
  CircleHelp,
  Code2,
  FileText,
  LifeBuoy,
  ShieldCheck,
  Warehouse
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import NavListItem from "../../components/NavListItem";
import "./style.scss";

const APP_VERSION = "1.5.0";
const SUPPORT_TELEGRAM_URL = "https://t.me/+79663028881";

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

  const openSupport = () => {
    window.open(SUPPORT_TELEGRAM_URL, "_blank", "noopener,noreferrer");
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
      <div className="section-title">Приветствие</div>
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
            placeholder="Как вас зовут?"
            value={name}
            onChange={handleNameChange}
          />
        </div>

      </div>

      {/* SETTINGS */}
      <div className="section">
        <div className="section-title">Настройки</div>

        <div className="settings-theme">
          <span className="nav-title">Темная тема</span>

          <div
            className={`ios-switch ${theme === "dark-theme" ? "active" : ""}`}
            onClick={toggleTheme}
          >
            <div className="switch-circle" />
          </div>
        </div>

        <div className="cache-remove">
          <div className="settings-cache glass" onClick={clearCache}>
            <span>Очистить кэш</span>
          </div>

          <div className="settings-cache glass" onClick={resetProfile}>
            <span>Сбросить профиль</span>
          </div>
        </div>



      </div>

      {/* TOOLS */}
      <div className="section">
        <div className="section-title">Инструменты</div>

        <NavListItem
          icon={<ArrowLeftRight size={20} strokeWidth={2.1} />}
          title="Конвертер валют"
          to="/others/converter"
        />
        <NavListItem
          icon={<Warehouse size={20} strokeWidth={2.1} />}
          title="Схема склада"
          subtitle="Этажи Golden Flowers"
          to="/others/warehouse"
        />
      </div>

      {/* DEVELOPER */}
      <div className="section">
        <div className="section-title">Поддержка</div>
        <NavListItem
          icon={<LifeBuoy size={20} strokeWidth={2.1} />}
          title="Обратиться в поддержку"
          subtitle="Жалобы, вопросы и помощь"
          onClick={openSupport}
        />
        <NavListItem
          icon={<CircleHelp size={20} strokeWidth={2.1} />}
          title="Частые вопросы"
          to="/others/faq"
        />
        <NavListItem
          icon={<ShieldCheck size={20} strokeWidth={2.1} />}
          title="Политика конфиденциальности"
          to="/others/privacy"
        />
        <NavListItem
          icon={<FileText size={20} strokeWidth={2.1} />}
          title="Пользовательское соглашение"
          to="/others/terms"
        />
        <NavListItem
          icon={<Code2 size={20} strokeWidth={2.1} />}
          title="Связь с разработчиком"
          onClick={() => window.open("https://t.me/faridguseinow", "_blank", "noopener,noreferrer")}
        />
      </div>

      {/* VERSION */}
      <div className="app-version">
        ООО &quot;Голд Флаурс&quot; - GFCC - Все права защищены. <br />
        Версия приложения {APP_VERSION}
      </div>

    </div>
  );
}
