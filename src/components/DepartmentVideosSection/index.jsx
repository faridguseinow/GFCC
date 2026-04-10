import { useRef, useState, useEffect } from "react";
import "./style.scss";
import { departmentVideos } from "../../data/departmentVideos";

const AUTOPLAY_DELAY = 4000;

const DepartmentVideosSection = () => {
  const containerRef = useRef(null);
  const intervalRef = useRef(null);

  const [activeIndex, setActiveIndex] = useState(0);
  const [isInteracting, setIsInteracting] = useState(false);

  const scrollToIndex = (index) => {
    const container = containerRef.current;
    if (!container) return;

    const child = container.children[index];
    if (!child) return;

    const offset =
      child.offsetLeft -
      container.offsetWidth / 2 +
      child.offsetWidth / 2;

    container.scrollTo({
      left: offset,
      behavior: "smooth",
    });
  };

  const handleScroll = () => {
    const container = containerRef.current;
    if (!container) return;

    const children = Array.from(container.children);
    const center = container.scrollLeft + container.offsetWidth / 2;

    let closest = 0;
    let closestDistance = Infinity;

    children.forEach((child, index) => {
      const childCenter =
        child.offsetLeft + child.offsetWidth / 2;

      const distance = Math.abs(center - childCenter);

      if (distance < closestDistance) {
        closestDistance = distance;
        closest = index;
      }
    });

    setActiveIndex(closest);
  };

  // Автопрокрутка
  useEffect(() => {
    if (isInteracting) return;

    intervalRef.current = setInterval(() => {
      setActiveIndex((prev) => {
        const next =
          prev === departmentVideos.length - 1 ? 0 : prev + 1;
        scrollToIndex(next);
        return next;
      });
    }, AUTOPLAY_DELAY);

    return () => clearInterval(intervalRef.current);
  }, [isInteracting]);

  // Центрируем при изменении activeIndex вручную
  useEffect(() => {
    scrollToIndex(activeIndex);
  }, []);

  return (
    <section className="department-videos">
      <h2>Обзоры отделов Golden Flowers</h2>

      <div
        className="carousel"
        ref={containerRef}
        onScroll={handleScroll}
        onMouseEnter={() => setIsInteracting(true)}
        onMouseLeave={() => setIsInteracting(false)}
        onTouchStart={() => setIsInteracting(true)}
        onTouchEnd={() => setIsInteracting(false)}
      >
        {departmentVideos.map((video, index) => (
          <a
            key={video.id}
            href={video.vkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`carousel-item ${
              index === activeIndex ? "active" : ""
            }`}
          >
            <img src={video.cover} alt={video.title} />
            <span>{video.title}</span>
          </a>
        ))}
      </div>
    </section>
  );
};

export default DepartmentVideosSection;