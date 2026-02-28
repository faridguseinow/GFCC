import { useEffect, useState, useRef } from "react";
import Logo from "/icons/icon-512x512.png";
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
    text: "Это веб-приложение для клиентов Golden Flowers и Oasis Flowers."
  },
  {
    title: "Свежий прайс лист",
    text: "Смотрите актуальный прайс и скачивайте его в компьютерной версии."
  },
  {
    title: "Всегда на связи",
    text: "Контакты и соцсети собраны в одном месте."
  }
];

export default function WelcomeScreen({ onFinish }) {
  const [visible, setVisible] = useState(true);
  const [closing, setClosing] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [step, setStep] = useState(0);
  const touchStartX = useRef(null);

  const userName = localStorage.getItem("userName");
  const avatar = localStorage.getItem("userAvatar");
  const randomMessage =
    messages[Math.floor(Math.random() * messages.length)];

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
    if (step < slides.length - 1) setStep(prev => prev + 1);
    else finishOnboarding();
  };

  const prev = () => {
    if (step > 0) setStep(prev => prev - 1);
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (delta > 60) prev();
    if (delta < -60) next();
  };

  if (!visible) return null;

  return (
    <div
      className={`welcome-overlay ${closing ? "fade-out" : ""}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="gradient-bg" />

      <div className="welcome-container">

        {/* Центр фиксирован */}
        <div className="center-block">
          <div className="avatar-wrapper">
            {avatar ? (
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

            <button onClick={next}>
              {step === slides.length - 1 ? "Понятно" : "Далее"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}