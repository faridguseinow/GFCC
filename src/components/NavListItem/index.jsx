import { useNavigate } from "react-router-dom";
import "./style.scss";

export default function NavListItem({
  icon,
  title,
  subtitle,
  to,
  onClick
}) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
      return;
    }

    if (to) {
      navigate(to);
    }
  };

  return (
    <div
      className="nav-list-item"
      onClick={handleClick}
      role="button"
    >
      <div className="nav-left">
        {icon && (
          <div className="nav-icon">
            {icon}
          </div>
        )}

        <div className="nav-text">
          <span className="nav-title">{title}</span>
          {subtitle && (
            <span className="nav-subtitle">{subtitle}</span>
          )}
        </div>
      </div>

      <div className="nav-arrow">›</div>
    </div>
  );
}