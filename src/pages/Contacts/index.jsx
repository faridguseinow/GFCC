import { useNavigate } from 'react-router-dom';
import { useTheme } from '/src/useTheme.js';
import './style.scss';

import Oasis from '../../assets/icons/oasis_logo.svg'

import LogoSM from '/src/assets/icons/logo_sm.svg';
import LogoTB from '/src/assets/icons/logo_text_black.svg';
import LogoTW from '/src/assets/icons/logo_text.svg';

import TGimg from '/src/assets/icons/social/icons8-telegram.svg';
import VKimg from '/src/assets/icons/social/icons8-vk.svg';
import Insimg from '/src/assets/icons/social/icons8-instagram.svg';
import YTimg from '/src/assets/icons/social/icons8-youtube.svg';

export default function ContactsPage() {
  const navigate = useNavigate();

  const { theme, toggleTheme } = useTheme();
  const logoText = theme === 'dark-theme' ? LogoTW : LogoTB;

  return (
    <div className="contacts-menu">

      {/* Golden */}
      <div
        className="menu-card glass"
        onClick={() => navigate('/contacts/golden')}
      >
        <div className="gfcc-logo">
          <img src={LogoSM} width={45} alt="" />
          <img src={logoText} width={140} alt="" />
        </div>

        <p>Отделы и телефоны</p>
      </div>

      {/* Oasis */}
      <div
        className="menu-card glass"
        onClick={() => navigate('/contacts/oasis')}
      >
        <img src={Oasis} width={140} alt="" />
        <p>Отделы и телефоны</p>
      </div>

      {/* Соцсети Golden */}
      <div className="menu-card glass social-card">
        <h3>Golden Flowers</h3>

        <div className="social-icons">
          <a href="https://www.instagram.com/gfccru" target="_blank">
            <img src={Insimg} alt="instagram" />
          </a>
          <a href="https://t.me/GoldenFlowersOpt" target="_blank">
            <img src={TGimg} alt="telegram" />
          </a>
          <a href="https://vk.com/gfccru" target="_blank">
            <img src={VKimg} alt="vk" />
          </a>
          <a href="https://www.youtube.com/@gfccru" target="_blank">
            <img src={YTimg} alt="youtube" />
          </a>
        </div>

        <div className="links">
          <a href="https://www.gfcc.ru" target="_blank">
            www.gfcc.ru
          </a>
          <a href="mailto:info@gfcc.ru">
            info@gfcc.ru
          </a>
        </div>
      </div>

      {/* Соцсети Oasis */}
      <div className="menu-card glass social-card">
        <h3>Oasis</h3>

        <div className="social-icons">
          <a href="https://www.instagram.com/oasis_flowers" target="_blank">
            <img src={Insimg} alt="instagram" />
          </a>
          <a href="https://t.me/OasisFlowersOpt" target="_blank">
            <img src={TGimg} alt="telegram" />
          </a>
          <a href="https://vk.com/oasisflowersopt" target="_blank">
            <img src={VKimg} alt="vk" />
          </a>
          <a href="https://www.youtube.com/@oasisflowers4744" target="_blank">
            <img src={YTimg} alt="youtube" />
          </a>
        </div>

        <div className="links">
          <a href="https://www.oasisflowers.ru" target="_blank">
            www.oasisflowers.ru
          </a>
          <a href="mailto:oasis@gfcc.ru">
            oasis@gfcc.ru
          </a>
        </div>
      </div>

    </div>
  );
}