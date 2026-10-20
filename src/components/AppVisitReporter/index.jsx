import { useEffect } from "react";
import { usePriceTier } from "../../context/PriceTierContext";
import { registerAppVisit } from "../../services/visitAnalytics";

export default function AppVisitReporter() {
  const { hasClientCard } = usePriceTier();

  useEffect(() => {
    registerAppVisit(hasClientCard).catch(() => {
      // Analytics must never block the application.
    });
  }, [hasClientCard]);

  return null;
}
