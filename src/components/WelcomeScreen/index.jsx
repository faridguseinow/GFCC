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
    title: "Golden Oasis Flowers",
    text: "Это веб-приложение для клиентов Golden Oasis Flowers."
  },
  {
    title: "Свежий прайс",
    text: "Смотрите актуальный прайс и скачивайте его в компьютерной версии."
  },
  {
    title: "Всегда на связи",
    text: "Контакты, соцсети и всё необходимое собрано в одном месте."
  }
];

export default function WelcomeScreen({ onFinish }) {
  const [visible, setVisible] = useState(true);
  const [closing, setClosing] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [step, setStep] = useState(0);
  const touchStartX = useRef(null);

  const message =
    messages[Math.floor(Math.random() * messages.length)];

  useEffect(() => {
    const seen = localStorage.getItem("onboardingSeen");

    if (!seen) {
      setShowOnboarding(true);
    } else {
      // только приветственный splash
      const timer = setTimeout(() => {
        handleClose();
      }, 2700);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      setVisible(false);
      onFinish?.();   // сообщаем App что splash завершён
    }, 500);
  };

  const finishOnboarding = () => {
    localStorage.setItem("onboardingSeen", "true");
    setShowOnboarding(false);

    // после онбординга показать короткий splash
    setTimeout(() => {
      handleClose();
    }, 1200);
  };

  const next = () => {
    if (step < slides.length - 1) {
      setStep(prev => prev + 1);
    } else {
      finishOnboarding();
    }
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
      <div className="welcome-content">
        <img src={Logo} alt="Logo" />

        {showOnboarding ? (
          <>
            <h1>{slides[step].title}</h1>
            <p className="slide-text">{slides[step].text}</p>

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
          </>
        ) : (
          <>
            <h1>Добро пожаловать</h1>
            <p className="random-msg">{message}</p>
          </>
        )}
      </div>
    </div>
  );
}