import { useState, useEffect } from 'react'
import './style.scss'

import { contactsData } from '../../data/contactsData'

import LogoSM from '../../assets/icons/logo_sm_gfcc.png'
import OasisLogo from '../../assets/icons/logo_sm_oasis.png'

import TGimg from '/src/assets/icons/social/icons8-telegram.svg'
import VKimg from '/src/assets/icons/social/icons8-vk.svg'
import Insimg from '/src/assets/icons/social/icons8-instagram.svg'
import YTimg from '/src/assets/icons/social/icons8-youtube.svg'

export default function ContactsPage() {

  /* ================= BRAND STATE ================= */

  const [brand, setBrand] = useState('golden')

  useEffect(() => {
    const saved = localStorage.getItem('brand')
    if (saved) setBrand(saved)
  }, [])

const switchBrand = (value) => {
  if (value === brand) return

  setBrand(value)
  localStorage.setItem('brand', value)

  if (navigator.vibrate) {
    navigator.vibrate(10)
  }
}
  const data = contactsData[brand]

  /* ================= CALL LOGIC ================= */

  const handleCall = (phones) => {
    if (!phones || phones.length === 0) return

    if (navigator.vibrate) {
      navigator.vibrate(15)
    }

    if (phones.length === 1) {
      window.location.href = `tel:${phones[0].number}`
    } else {
      const list = phones
        .map((p, i) => `${i + 1}. ${p.label}`)
        .join('\n')

      const choice = window.prompt(
        `Выберите номер:\n\n${list}`
      )

      const selected = phones[parseInt(choice) - 1]
      if (selected) {
        window.location.href = `tel:${selected.number}`
      }
    }
  }

  /* ================= RENDER ================= */

  return (
    <div className="contacts-page">

      {/* ===== Fixed Switcher ===== */}
      <div className="brand-switcher">
        <div className={`switch-thumb ${brand}`} />

        <button
          className={brand === 'golden' ? 'active' : ''}
          onClick={() => switchBrand('golden')}
        >
          <img src={LogoSM} alt="Golden" />
        </button>

        <button
          className={brand === 'oasis' ? 'active' : ''}
          onClick={() => switchBrand('oasis')}
        >
          <img src={OasisLogo} alt="Oasis" />
        </button>
      </div>
      {/* ===== Content ===== */}
      <div key={brand} className="contacts-content fade">

        <h2>Номера отделов</h2>

        <div className="contacts-grid">
          {data.departments.map((dep, i) => (
            <div
              key={i}
              className="contact-card glass"
              onClick={() => handleCall(dep.phones)}
            >
              <h4>{dep.name}</h4>

              {dep.phones.map((phone, index) => (
                <div key={index} className="phone-row">
                  <span>{phone.label}</span>

                  {phone.telegram && (
                    <a
                      href={phone.telegram}
                      target="_blank"
                      onClick={(e) => e.stopPropagation()}
                      className="tg-btn"
                    >
                      <img src={TGimg} alt="telegram" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* ===== Social Block ===== */}

        <div className="social-block glass">
          <h3>Социальные сети</h3>

          <div className="social-icons">
            <a href={data.social.instagram} target="_blank">
              <img src={Insimg} alt="instagram" />
            </a>
            <a href={data.social.telegram} target="_blank">
              <img src={TGimg} alt="telegram" />
            </a>
            <a href={data.social.vk} target="_blank">
              <img src={VKimg} alt="vk" />
            </a>
            <a href={data.social.youtube} target="_blank">
              <img src={YTimg} alt="youtube" />
            </a>
          </div>

          <div className="address">
            {data.social.address}
          </div>

          <div className="links">
            <a href={data.social.site} target="_blank">
              {data.social.siteLabel}
            </a>

            <a href={`mailto:${data.social.email}`}>
              {data.social.email}
            </a>
          </div>
        </div>

      </div>
    </div>
  )
}