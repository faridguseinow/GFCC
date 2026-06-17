/* eslint-disable react/prop-types, react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  getActiveClient,
  hasActiveClientCard,
  subscribeToActiveClientCardChanges
} from "../utils/clientAccess";
import {
  getDefaultPriceTier,
  getPriceTierOptions,
  isPriceTierAllowed,
  normalizePriceTier
} from "../utils/priceTier";

const PRICE_TIER_STORAGE_KEY = "gfcc_price_tier";
const USER_SELECTED_STORAGE_KEY = "gfcc_price_tier_user_selected";

const PriceTierContext = createContext(null);

const readStoredTier = () => {
  try {
    return normalizePriceTier(localStorage.getItem(PRICE_TIER_STORAGE_KEY));
  } catch {
    return null;
  }
};

const readStoredUserSelected = () => {
  try {
    return localStorage.getItem(USER_SELECTED_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
};

const writeStoredTierState = (tier, userSelected) => {
  try {
    localStorage.setItem(PRICE_TIER_STORAGE_KEY, tier);
    localStorage.setItem(USER_SELECTED_STORAGE_KEY, userSelected ? "1" : "0");
  } catch {
    // ignore storage errors
  }
};

const resolveTierState = (hasClientCard, savedTier, userSelected) => {
  const normalizedSavedTier = normalizePriceTier(savedTier);
  const defaultTier = getDefaultPriceTier(hasClientCard);

  if (!hasClientCard) {
    if (normalizedSavedTier === "retail" || normalizedSavedTier === "extra") {
      return {
        tier: normalizedSavedTier,
        userSelected
      };
    }

    return {
      tier: defaultTier,
      userSelected: false
    };
  }

  if (userSelected && isPriceTierAllowed(normalizedSavedTier, true)) {
    return {
      tier: normalizedSavedTier,
      userSelected: true
    };
  }

  if (normalizedSavedTier === "wholesale") {
    return {
      tier: normalizedSavedTier,
      userSelected: false
    };
  }

  return {
    tier: defaultTier,
    userSelected: false
  };
};

export function PriceTierProvider({ children }) {
  const [hasClientCard, setHasClientCard] = useState(() => hasActiveClientCard());
  const [priceTier, setPriceTierState] = useState(() =>
    resolveTierState(hasActiveClientCard(), readStoredTier(), readStoredUserSelected()).tier
  );
  const [userSelected, setUserSelected] = useState(() =>
    resolveTierState(hasActiveClientCard(), readStoredTier(), readStoredUserSelected()).userSelected
  );
  const userSelectedRef = useRef(userSelected);

  useEffect(() => {
    userSelectedRef.current = userSelected;
  }, [userSelected]);

  useEffect(() => {
    const syncState = () => {
      const nextHasClientCard = Boolean(getActiveClient()?.code);
      const savedTier = readStoredTier();
      const savedUserSelected = readStoredUserSelected();
      const resolved = resolveTierState(nextHasClientCard, savedTier, savedUserSelected);

      setHasClientCard(nextHasClientCard);
      setPriceTierState(resolved.tier);
      setUserSelected(resolved.userSelected);
      writeStoredTierState(resolved.tier, resolved.userSelected);
    };

    syncState();

    const unsubscribeClient = subscribeToActiveClientCardChanges(() => {
      syncState();
    });

    const handleStorage = (event) => {
      if (
        event.key === null ||
        event.key === PRICE_TIER_STORAGE_KEY ||
        event.key === USER_SELECTED_STORAGE_KEY ||
        event.key === "client_code" ||
        event.key === "client_selection_v2"
      ) {
        syncState();
      }
    };

    window.addEventListener("storage", handleStorage);

    return () => {
      unsubscribeClient();
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const setPriceTier = useCallback((tier) => {
    const normalizedTier = normalizePriceTier(tier);

    if (!isPriceTierAllowed(normalizedTier, hasClientCard)) {
      const fallbackTier = getDefaultPriceTier(hasClientCard);
      setPriceTierState(fallbackTier);
      setUserSelected(false);
      writeStoredTierState(fallbackTier, false);
      return;
    }

    setPriceTierState(normalizedTier);
    setUserSelected(true);
    writeStoredTierState(normalizedTier, true);
  }, [hasClientCard]);

  const availablePriceTiers = useMemo(
    () => getPriceTierOptions(hasClientCard),
    [hasClientCard]
  );

  const value = useMemo(
    () => ({
      priceTier,
      setPriceTier,
      availablePriceTiers,
      hasClientCard
    }),
    [availablePriceTiers, hasClientCard, priceTier, setPriceTier]
  );

  return (
    <PriceTierContext.Provider value={value}>
      {children}
    </PriceTierContext.Provider>
  );
}

export function usePriceTier() {
  return useContext(PriceTierContext);
}
