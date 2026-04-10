import './style.scss';
import Logo from '../../assets/icons/icon-152x152.png';
import { usePWAInstall } from '../../usePWAInstall';

export default function PWAInstallBanner() {
  const { showBanner, closeBanner } = usePWAInstall();

  if (!showBanner) return null;

  return (
    <div className="pwa-overlay">
      <div className="pwa-card glass">

        <img src={Logo} className="pwa-logo" />

        <h2>Добавьте GFCC на экран «Домой»</h2>

        <ol>
          <li>1. Нажмите кнопку в браузере «Поделиться»</li>
          <li>2. Выберите « + Добавить на  экран Домой»</li>
          <li>3. Теперь приложение всегда будет под рукой</li>
        </ol>

        <button onClick={closeBanner}>
          Понятно
        </button>

      </div>
    </div>
  );
}