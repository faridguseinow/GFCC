import TGimg from '../../assets/icons/social/icons8-telegram.svg';
import './style.scss';

export default function ContactCard({
  title,
  phones = [],
  telegram,
  mapLink
}) {

  const handleCall = (phone) => {
    window.location.href = `tel:${phone.replace(/\s/g, '')}`;
  };

  return (
    <div className="contact-card">

      <div className="contact-card-header">
        {title}
      </div>

      <div className="contact-card-body">

        {phones.map((phone, index) => (
          <div key={index} className="phone-row">

            <span
              className="phone-number"
              onClick={() => handleCall(phone)}
            >
              {phone}
            </span>

            {telegram && (
              <a
                href={telegram}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="tg-btn"
              >
                <img src={TGimg} alt="telegram" />
              </a>
            )}

          </div>
        ))}

        {/* 🔹 Кнопка карты */}
        {mapLink && (
          <a
            href={mapLink}
            target="_blank"
            rel="noopener noreferrer"
            className="map-link"
            onClick={(e) => e.stopPropagation()}
          >
            Открыть на карте
          </a>
        )}

      </div>

    </div>
  );
}