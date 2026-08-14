import { useEffect, useState } from "react";
import { usePriceSource } from "./context/PriceSourceContext";
import { PRICE_BASES, PRICES_STATUS_API_URL } from "./utils/priceBase";

const formatUpdatedAt = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Moscow"
  }).format(date);
};

export function usePriceStatus() {
  const { priceBase } = usePriceSource();
  const [updatedAtText, setUpdatedAtText] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function check() {
      try {
        setUpdatedAtText("");

        const response = await fetch(PRICES_STATUS_API_URL, {
          signal: controller.signal
        });

        if (!response.ok) {
          return;
        }

        const status = await response.json();
        const baseStatus = priceBase === PRICE_BASES.OASIS
          ? status?.oasis
          : status?.gold;

        setUpdatedAtText(formatUpdatedAt(baseStatus?.updatedAt));
      } catch (error) {
        if (error?.name !== "AbortError") {
          setUpdatedAtText("");
        }
      }
    }

    check();

    return () => {
      controller.abort();
    };
  }, [priceBase]);

  return updatedAtText;
}
