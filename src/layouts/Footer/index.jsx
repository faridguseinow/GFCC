import './style.scss';
import { NavLink } from 'react-router-dom';
import { useCart } from "../../context/CartContext";

export default function Footer() {
  const { activeOrder } = useCart();

  return (
    <div className="bottom-nav">
      <div className="bottom-nav-inner">

        <NavLink
          to="/"
          className={({ isActive }) =>
            `nav-button ${isActive ? "active" : ""}`
          }
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          </svg>
          <span>Главная</span>
        </NavLink>

        <NavLink
          to="/price"
          className={({ isActive }) =>
            `nav-button ${isActive ? "active" : ""}`
          }
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" />
          </svg>
          <span>Прайс</span>
        </NavLink>

        <NavLink
          to="/cart"
          className={({ isActive }) =>
            `nav-button cart-button ${isActive ? "active" : ""}`
          }
        >
          {activeOrder.length > 0 && (
            <span className="badge" />
          )}
          <span className="nav-icon cart-icon">
            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor" stroke="currentColor"><path d="M223.5-103.5Q200-127 200-160t23.5-56.5Q247-240 280-240t56.5 23.5Q360-193 360-160t-23.5 56.5Q313-80 280-80t-56.5-23.5Zm400 0Q600-127 600-160t23.5-56.5Q647-240 680-240t56.5 23.5Q760-193 760-160t-23.5 56.5Q713-80 680-80t-56.5-23.5ZM246-720l96 200h280l110-200H246Zm-38-80h590q23 0 35 20.5t1 41.5L692-482q-11 20-29.5 31T622-440H324l-44 80h480v80H280q-45 0-68-39.5t-2-78.5l54-98-144-304H40v-80h130l38 80Zm134 280h280-280Z" /></svg>
          </span>
          <span>Корзина</span>
        </NavLink>


        <NavLink
          to="/contacts"
          className={({ isActive }) =>
            `nav-button ${isActive ? "active" : ""}`
          }
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
          </svg>
          <span>Контакты</span>
        </NavLink>


        <NavLink
          to="/others"
          className={({ isActive }) =>
            `nav-button ${isActive ? "active" : ""}`
          }
        >
          <svg xmlns="http://www.w3.org/2000/svg" height="48px" viewBox="0 -960 960 960" width="48px" fill="currentColor"><path d="M232-253.08q59.92-41.3 119.23-64.03 59.31-22.74 128.77-22.74 69.46 0 129.08 22.74 59.61 22.73 119.53 64.03 43.62-50.53 64.81-106.69 21.19-56.15 21.19-120.23 0-141.54-96.53-238.08-96.54-96.53-238.08-96.53-141.54 0-238.08 96.53-96.53 96.54-96.53 238.08 0 64.08 21.5 120.23 21.5 56.16 65.11 106.69Zm157.04-241.04q-36.81-36.8-36.81-90.96 0-54.15 36.81-90.96 36.81-36.81 90.96-36.81 54.15 0 90.96 36.81 36.81 36.81 36.81 90.96 0 54.16-36.81 90.96-36.81 36.81-90.96 36.81-54.15 0-90.96-36.81ZM480-100q-78.54 0-147.69-29.77-69.16-29.77-120.96-81.58-51.81-51.8-81.58-120.96Q100-401.46 100-480q0-79.15 29.77-148t81.58-120.65q51.8-51.81 120.96-81.58Q401.46-860 480-860q79.15 0 148 29.77t120.65 81.58q51.81 51.8 81.58 120.65Q860-559.15 860-480q0 78.54-29.77 147.69-29.77 69.16-81.58 120.96-51.8 51.81-120.65 81.58Q559.15-100 480-100Zm110-63.12q54.23-17.73 102.15-57.34-47.92-35.23-101.5-54.62-53.57-19.38-110.65-19.38-57.08 0-110.85 19.19-53.77 19.19-100.92 54.81 47.54 39.61 101.77 57.34 54.23 17.73 110 17.73t110-17.73Zm-50.85-362.8q23.24-23.23 23.24-59.16 0-35.92-23.24-59.15-23.23-23.23-59.15-23.23t-59.15 23.23q-23.24 23.23-23.24 59.15 0 35.93 23.24 59.16 23.23 23.23 59.15 23.23t59.15-23.23ZM480-585.08Zm0 365.16Z" /></svg>
          <span>Профиль</span>
        </NavLink>

      </div>
    </div>

  );
}
