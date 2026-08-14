/* eslint-disable react/prop-types, react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  getActiveClient,
  subscribeToActiveClientCardChanges
} from "../utils/clientAccess";
import {
  getPriceBaseOptions,
  normalizePriceBase,
  PRICE_BASES,
  resolvePriceBaseByClient
} from "../utils/priceBase";

const PRICE_BASE_STORAGE_KEY = "gfcc_price_base";
const USER_SELECTED_STORAGE_KEY = "gfcc_price_base_user_selected";

const PriceSourceContext = createContext(null);

const toText = (value) => (value === null || value === undefined ? "" : String(value).trim());

const readStoredBase = () => {
  try {
    return normalizePriceBase(localStorage.getItem(PRICE_BASE_STORAGE_KEY));
  } catch {
    return PRICE_BASES.GOLD;
  }
};

const readStoredUserSelected = () => {
  try {
    return localStorage.getItem(USER_SELECTED_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
};

const writeStoredBaseState = (base, userSelected) => {
  try {
    localStorage.setItem(PRICE_BASE_STORAGE_KEY, normalizePriceBase(base));
    localStorage.setItem(USER_SELECTED_STORAGE_KEY, userSelected ? "1" : "0");
  } catch {
    // ignore storage errors
  }
};

const getClientSignature = (client) =>
  [
    toText(client?.code),
    toText(client?.sklad),
    toText(client?.name)
  ].join("|").toLowerCase();

const resolveInitialBase = () => {
  const savedBase = readStoredBase();

  if (readStoredUserSelected()) {
    return savedBase;
  }

  const clientBase = resolvePriceBaseByClient(getActiveClient());

  return clientBase || savedBase;
};

export function PriceSourceProvider({ children }) {
  const [priceBase, setPriceBaseState] = useState(resolveInitialBase);
  const [userSelected, setUserSelected] = useState(readStoredUserSelected);
  const userSelectedRef = useRef(userSelected);
  const clientSignatureRef = useRef(getClientSignature(getActiveClient()));

  useEffect(() => {
    userSelectedRef.current = userSelected;
  }, [userSelected]);

  useEffect(() => {
    const syncState = () => {
      const activeClient = getActiveClient();
      const nextClientSignature = getClientSignature(activeClient);
      const clientChanged = nextClientSignature !== clientSignatureRef.current;
      const clientBase = resolvePriceBaseByClient(activeClient);
      const savedBase = readStoredBase();
      const savedUserSelected = readStoredUserSelected();

      clientSignatureRef.current = nextClientSignature;

      if (savedUserSelected) {
        setPriceBaseState(savedBase);
        setUserSelected(true);
        return;
      }

      if (clientChanged && clientBase) {
        setPriceBaseState(clientBase);
        setUserSelected(false);
        writeStoredBaseState(clientBase, false);
        return;
      }

      if (userSelectedRef.current) {
        return;
      }

      const nextBase = clientBase || savedBase;
      setPriceBaseState(nextBase);
      writeStoredBaseState(nextBase, false);
    };

    syncState();

    const unsubscribeClient = subscribeToActiveClientCardChanges(() => {
      syncState();
    });

    const handleStorage = (event) => {
      if (
        event.key === null ||
        event.key === PRICE_BASE_STORAGE_KEY ||
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

  const setPriceBase = useCallback((base) => {
    const normalizedBase = normalizePriceBase(base);

    setPriceBaseState(normalizedBase);
    setUserSelected(true);
    writeStoredBaseState(normalizedBase, true);
  }, []);

  const availablePriceBases = useMemo(() => getPriceBaseOptions(), []);

  const value = useMemo(
    () => ({
      priceBase,
      setPriceBase,
      availablePriceBases
    }),
    [availablePriceBases, priceBase, setPriceBase]
  );

  return (
    <PriceSourceContext.Provider value={value}>
      {children}
    </PriceSourceContext.Provider>
  );
}

export function usePriceSource() {
  return useContext(PriceSourceContext);
}
