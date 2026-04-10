import { useState, memo } from "react";
import "./style.scss";

import Floor1 from "/src/assets/media/floors/floor1.svg";
import Floor2 from "/src/assets/media/floors/floor2.svg";
import Floor3 from "/src/assets/media/floors/floor3.svg";

const floors = {
  1: Floor1,
  2: Floor2,
  3: Floor3
};

function FloorScheme() {
  const [activeFloor, setActiveFloor] = useState(1);

  return (
    <div className="floor-section">

      <h2 className="floor-title">
        Схема этажей склада <br />Golden Flowers
      </h2>

      <div className="floor-buttons">
        {[1,2,3].map((floor) => (
          <button
            key={floor}
            className={`floor-btn ${activeFloor === floor ? "active" : ""}`}
            onClick={() => setActiveFloor(floor)}
          >
            {floor}
          </button>
        ))}
      </div>

      <div className="floor-image-wrapper">
        <img
          src={floors[activeFloor]}
          alt={`Этаж ${activeFloor}`}
          loading="lazy"
        />
      </div>

    </div>
  );
}

export default memo(FloorScheme);