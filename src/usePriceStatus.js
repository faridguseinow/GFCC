import { useEffect, useState } from "react";

export function usePriceStatus() {
  const [isStale, setIsStale] = useState(false);

  useEffect(() => {
    async function check() {
      const response = await fetch("/api/prices");
      const fetchedAt = response.headers.get("sw-fetched-at");

      if (fetchedAt) {
        const age = Date.now() - Number(fetchedAt);
        if (age > 60 * 60 * 1000) {
          setIsStale(true);
        }
      }
    }

    check();
  }, []);

  return isStale;
}