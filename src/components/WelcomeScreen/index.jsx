import { useEffect, useState, useRef } from "react";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import LocalFloristRoundedIcon from "@mui/icons-material/LocalFloristRounded";
import QrCodeScannerRoundedIcon from "@mui/icons-material/QrCodeScannerRounded";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import SupportAgentRoundedIcon from "@mui/icons-material/SupportAgentRounded";
import Logo from "../../assets/icons/logo.svg";
import GfccLogo from "../../assets/icons/logo_sm_gfcc.png";
import OasisLogo from "../../assets/icons/logo_sm_oasis.png";
import "./style.scss";

const messages = [
  "Успешных закупок!",
  "Пусть продажи растут!",
  "Хорошего дня!",
  "Удачных сделок!",
  "Пусть сегодня будет прибыль!"
];

const slides = [
  {
    title: "Golden & Oasis Flowers",
    text: "Это приложение для клиентов оптовых цветочных баз Golden Flowers и Oasis Flowers.",
    icon: BadgeRoundedIcon,
    visual: "companies"
  },
  {
    title: "Свежий прайс лист",
    text: "Просматривайте актуальные позиции и цены. Быстро находите нужные товары.",
    icon: Inventory2RoundedIcon,
    visual: "price"
  },
  {
    title: "Карта клиента",
    text: "Для зарегистрированных клиентов: на зоне подсчета товаров поднесите штрихкод к сканеру, и вас быстро найдут в базе Golden Flowers и Oasis Flowers.",
    icon: QrCodeScannerRoundedIcon,
    visual: "client"
  },
  {
    title: "Всегда на связи",
    text: "Информация о наших базах, контакты, соцсети и другая информация о Golden Flowers и Oasis Flowers собраны в одном месте.",
    icon: SupportAgentRoundedIcon,
    visual: "bases"
  }
];

export default function WelcomeScreen({ onFinish, onReady }) {
  const [visible, setVisible] = useState(true);
  const [closing, setClosing] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [step, setStep] = useState(0);
  const [slideDirection, setSlideDirection] = useState("next");
  const touchStartX = useRef(null);

  const userName = localStorage.getItem("userName");
  const avatar = localStorage.getItem("userAvatar");
  const randomMessage =
    messages[Math.floor(Math.random() * messages.length)];

  useEffect(() => {
    onReady?.();
  }, []);

  useEffect(() => {
    const seen = localStorage.getItem("onboardingSeen");
    if (!seen) setShowOnboarding(true);
    else setTimeout(() => handleClose(), 2500);
  }, []);

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      setVisible(false);
      onFinish?.();
    }, 800);
  };

  const finishOnboarding = () => {
    localStorage.setItem("onboardingSeen", "true");
    setShowOnboarding(false);
    setTimeout(() => handleClose(), 2500);
  };

  const next = () => {
    setSlideDirection("next");
    if (step < slides.length - 1) setStep(prev => prev + 1);
    else finishOnboarding();
  };

  const prev = () => {
    if (step > 0) {
      setSlideDirection("prev");
      setStep(prev => prev - 1);
    }
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (delta > 60) prev();
    if (delta < -60) next();
    touchStartX.current = null;
  };

  if (!visible) return null;

  const ActiveIcon = slides[step].icon;

  return (
    <div
      className={`welcome-overlay ${closing ? "fade-out" : ""}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="gradient-bg" />

      <div className="welcome-container">
        {showOnboarding && (
          <button className="skip-button" onClick={finishOnboarding}>
            Пропустить
          </button>
        )}

        {/* Центр фиксирован */}
        <div className="center-block">
          <div
            key={step}
            className={`slide-stage ${showOnboarding ? "is-onboarding" : ""} ${slideDirection}`}
          >
            <div className={`avatar-wrapper ${showOnboarding ? "onboarding-visual" : ""}`}>
              {showOnboarding ? (
                <div className={`slide-visual ${slides[step].visual}`}>
                  <span className="visual-icon">
                    <ActiveIcon fontSize="inherit" />
                  </span>

                  {slides[step].visual === "companies" && (
                    <div className="company-logos">
                      <div className="company-logo-card">
                        <img src={GfccLogo} alt="Golden Flowers" />
                      </div>
                      <span className="logo-divider">+</span>
                      <div className="company-logo-card oasis">
                        <img src={OasisLogo} alt="Oasis Flowers" />
                      </div>
                    </div>
                  )}

                  {slides[step].visual === "price" && (
                    <div className="svg-illustration price-illustration">
                      <div className="florist-mark">
                        <LocalFloristRoundedIcon fontSize="inherit" />
                      </div>
                      <div className="price-document">
                        <span>Прайс</span>
                        <strong>₽</strong>
                        <i />
                        <i />
                        <i />
                      </div>
                      <Inventory2RoundedIcon className="large-svg" />
                    </div>
                  )}

                  {slides[step].visual === "client" && (
                    <div className="scanner-card">
                      <div className="scanner-head">
                        <span />
                        <span />
                      </div>
                      <div className="barcode-card" aria-hidden="true">
                        <i />
                        <i />
                        <i />
                        <i />
                        <i />
                        <i />
                        <i />
                        <i />
                      </div>
                      <div className="scan-line" />
                    </div>
                  )}

                  {slides[step].visual === "bases" && (
                    <div className="svg-illustration bases-illustration">
                      <div className="base-card main">
                        <StorefrontRoundedIcon fontSize="inherit" />
                        <span>Golden</span>
                      </div>
                      <div className="base-card second">
                        <LocalFloristRoundedIcon fontSize="inherit" />
                        <span>Oasis</span>
                      </div>
                      <div className="support-bubble">
                        <SupportAgentRoundedIcon fontSize="inherit" />
                      </div>
                    </div>
                  )}
                </div>
              ) : avatar ? (
                <img src={avatar} alt="avatar" className="avatar-img" />
              ) : (
                <img src={Logo} alt="logo" className="logo-img" />
              )}
            </div>

            <div className="text-block">
              {showOnboarding ? (
                <>
                  <h1>{slides[step].title}</h1>
                  <p>{slides[step].text}</p>
                </>
              ) : (
                <>
                  <h1>
                    {userName
                      ? `Добро пожаловать, ${userName}`
                      : "Добро пожаловать"}
                  </h1>
                  <p className="wish">{randomMessage}</p>
                </>
              )}
            </div>
          </div>
        </div>

        {showOnboarding && (
          <div className="bottom-fixed">
            <div className="progress-dots">
              {slides.map((_, index) => (
                <span
                  key={index}
                  className={index === step ? "active" : ""}
                />
              ))}
            </div>

            <div className={`nav-buttons ${step === 0 ? "first-step" : ""}`}>
              {step > 0 && (
                <button className="back-button" onClick={prev}>
                  <ArrowBackRoundedIcon fontSize="small" />
                  <span>Назад</span>
                </button>
              )}

              <button className="next-button" onClick={next}>
                <span>{step === slides.length - 1 ? "Понятно" : "Далее"}</span>
                <ArrowForwardRoundedIcon fontSize="small" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
