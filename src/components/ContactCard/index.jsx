import TGimg from '../../assets/icons/social/icons8-telegram.svg';

export default function ContactCard({ icon, title, phone, telegram }) {
  return (
    <div
      className="contact-card glass"
      onClick={() => window.location.href = `tel:${phone}`}
    >
      <div className="card-top">
        <img src={icon} alt="" />
        <span>{title}</span>
      </div>

      <div className="card-bottom">
        <span>{phone}</span>

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
    </div>
  );
}