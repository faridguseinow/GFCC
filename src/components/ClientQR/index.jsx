import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Info } from "lucide-react";
import Barcode from "react-barcode";
import { getClientsByCode } from "../../data/api";
import GoldenLogo from "../../assets/icons/logo_sm_gfcc.png";
import OasisLogo from "../../assets/icons/logo_sm_oasis.png";
import "./style.scss";

const STORAGE_KEY = "client_code";
const SELECTION_STORAGE_KEY = "client_selection_v2";

const toText = (value) => (value === null || value === undefined ? "" : String(value).trim());

const normalizeCode = (code) => toText(code).padStart(6, "0");

const normalizeWarehouseKey = (warehouse) => toText(warehouse).toLowerCase();

const clearSavedClientSelection = () => {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(SELECTION_STORAGE_KEY);
};

const readSavedClientSelection = () => {
  try {
    const raw = localStorage.getItem(SELECTION_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);

    if (!parsed?.code) {
      return null;
    }

    return {
      code: normalizeCode(parsed.code),
      name: toText(parsed.name),
      sklad: toText(parsed.sklad)
    };
  } catch {
    return null;
  }
};

const writeSavedClientSelection = (code, client) => {
  localStorage.setItem(STORAGE_KEY, normalizeCode(code));

  try {
    localStorage.setItem(
      SELECTION_STORAGE_KEY,
      JSON.stringify({
        code: normalizeCode(code),
        name: toText(client?.name),
        sklad: toText(client?.sklad)
      })
    );
  } catch {
    // ignore storage errors
  }
};

const isSameClientSelection = (client, selection) => {
  if (!selection) {
    return false;
  }

  const sameCode = !selection.code || normalizeCode(client?.code) === normalizeCode(selection.code);
  const sameName =
    !selection.name || toText(client?.name).toLowerCase() === toText(selection.name).toLowerCase();
  const sameWarehouse =
    !selection.sklad ||
    normalizeWarehouseKey(client?.sklad) === normalizeWarehouseKey(selection.sklad);

  return sameCode && sameName && sameWarehouse;
};

const getWarehouseBrand = (warehouse) => {
  const normalizedWarehouse = normalizeWarehouseKey(warehouse);

  if (normalizedWarehouse.includes("golden")) {
    return {
      className: "golden",
      title: "Golden Flowers",
      logo: GoldenLogo
    };
  }

  if (normalizedWarehouse.includes("oasis")) {
    return {
      className: "oasis",
      title: "Oasis Flowers",
      logo: OasisLogo
    };
  }

  return {
    className: "default",
    title: toText(warehouse) || "Склад",
    logo: null
  };
};

const groupClientsByWarehouse = (clients = []) => {
  const groups = new Map();

  clients.forEach((entry) => {
    const warehouse = toText(entry?.sklad) || "Без склада";
    const warehouseKey = normalizeWarehouseKey(warehouse) || "no-warehouse";
    const currentGroup = groups.get(warehouseKey);

    if (currentGroup) {
      currentGroup.clients.push(entry);
      return;
    }

    groups.set(warehouseKey, {
      warehouse,
      warehouseKey,
      clients: [entry]
    });
  });

  return Array.from(groups.values()).sort((left, right) => {
    const leftRank = left.warehouseKey.includes("golden")
      ? 0
      : left.warehouseKey.includes("oasis")
        ? 1
        : 2;
    const rightRank = right.warehouseKey.includes("golden")
      ? 0
      : right.warehouseKey.includes("oasis")
        ? 1
        : 2;

    if (leftRank !== rightRank) {
      return leftRank - rightRank;
    }

    return left.warehouse.localeCompare(right.warehouse, "ru");
  });
};

const ClientQR = () => {
  const [inputCode, setInputCode] = useState("");
  const [finalCode, setFinalCode] = useState(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [error, setError] = useState("");
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [savedCodeChecked, setSavedCodeChecked] = useState(() =>
    !localStorage.getItem(STORAGE_KEY)
  );
  const [selectionModalOpen, setSelectionModalOpen] = useState(false);
  const [activationNoticeOpen, setActivationNoticeOpen] = useState(false);
  const [cardInfoOpen, setCardInfoOpen] = useState(false);
  const [selectionClients, setSelectionClients] = useState([]);
  const [selectionCode, setSelectionCode] = useState("");
  const [activeWarehouseKey, setActiveWarehouseKey] = useState("");
  const [showActivationNoticeAfterSelection, setShowActivationNoticeAfterSelection] = useState(false);
  const wakeLockRef = useRef(null);
  const modalRoot = typeof document !== "undefined"
    ? document.getElementById("modal-root")
    : null;

  const warehouseGroups = useMemo(
    () => groupClientsByWarehouse(selectionClients),
    [selectionClients]
  );

  const activeWarehouseGroup = useMemo(() => {
    if (warehouseGroups.length === 0) {
      return null;
    }

    if (warehouseGroups.length === 1) {
      return warehouseGroups[0];
    }

    return warehouseGroups.find((group) => group.warehouseKey === activeWarehouseKey) || null;
  }, [activeWarehouseKey, warehouseGroups]);

  const modalShowsWarehouseChoices = warehouseGroups.length > 1 && !activeWarehouseGroup;
  const modalClientOptions = activeWarehouseGroup?.clients || [];

  const applyClientSelection = useCallback((code, selectedClient, availableClients, options = {}) => {
    const { showActivationNotice = false } = options;
    const normalizedCode = normalizeCode(code);

    setClient(selectedClient);
    setFinalCode(normalizedCode);
    setInputCode(normalizedCode);
    setError("");
    setSelectionCode(normalizedCode);
    setSelectionClients(availableClients);
    setSelectionModalOpen(false);
    setActiveWarehouseKey("");
    setShowActivationNoticeAfterSelection(false);
    writeSavedClientSelection(normalizedCode, selectedClient);

    if (showActivationNotice) {
      setActivationNoticeOpen(true);
    }
  }, []);

  const openSelectionModal = useCallback((
    code,
    availableClients,
    preferredWarehouse = "",
    options = {}
  ) => {
    const { showActivationNotice = false } = options;
    const normalizedCode = normalizeCode(code);
    const groups = groupClientsByWarehouse(availableClients);
    const preferredWarehouseKey = normalizeWarehouseKey(preferredWarehouse);
    const hasPreferredWarehouse = groups.some(
      (group) => group.warehouseKey === preferredWarehouseKey
    );

    setSelectionCode(normalizedCode);
    setSelectionClients(availableClients);
    setActiveWarehouseKey(groups.length === 1 || hasPreferredWarehouse ? preferredWarehouseKey : "");
    setShowActivationNoticeAfterSelection(showActivationNotice);
    setSelectionModalOpen(true);
  }, []);

  const closeSelectionModal = useCallback(() => {
    setSelectionModalOpen(false);
    setActiveWarehouseKey("");

    if (!finalCode) {
      clearSavedClientSelection();
      setSelectionClients([]);
      setSelectionCode("");
    }
  }, [finalCode]);

  useEffect(() => {
    let cancelled = false;
    const savedCode = localStorage.getItem(STORAGE_KEY);
    const savedSelection = readSavedClientSelection();

    if (!savedCode) {
      return () => {
        cancelled = true;
      };
    }

    setLoading(true);
    setError("");

    getClientsByCode(savedCode)
      .then((clients) => {
        if (cancelled) {
          return;
        }

        if (clients.length === 0) {
          clearSavedClientSelection();
          setClient(null);
          setFinalCode(null);
          setSelectionClients([]);
          setSelectionCode("");
          setSavedCodeChecked(true);
          return;
        }

        setSelectionClients(clients);
        setSelectionCode(normalizeCode(savedCode));

        const matchedClient = clients.find((entry) => isSameClientSelection(entry, savedSelection));

        if (matchedClient || clients.length === 1) {
          applyClientSelection(savedCode, matchedClient || clients[0], clients);
        } else {
          setClient(null);
          setFinalCode(null);
          setInputCode(normalizeCode(savedCode));
          openSelectionModal(savedCode, clients, savedSelection?.sklad);
        }

        setSavedCodeChecked(true);
      })
      .catch(() => {
        if (!cancelled) {
          clearSavedClientSelection();
          setClient(null);
          setFinalCode(null);
          setSelectionClients([]);
          setSelectionCode("");
          setError("Не удалось проверить сохранённый код");
          setSavedCodeChecked(true);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [applyClientSelection, openSelectionModal]);

  useEffect(() => {
    if (!savedCodeChecked) {
      return;
    }

    window.dispatchEvent(
      new CustomEvent("gfcc:client-code-ready", {
        detail: { ready: !!finalCode }
      })
    );
  }, [finalCode, savedCodeChecked]);

  useEffect(() => {
    if (!selectionModalOpen) {
      return () => {};
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        closeSelectionModal();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [selectionModalOpen, closeSelectionModal]);

  useEffect(() => {
    if (!activationNoticeOpen && !cardInfoOpen) {
      return () => {};
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setActivationNoticeOpen(false);
        setCardInfoOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [activationNoticeOpen, cardInfoOpen]);

  useEffect(() => {
    if (!fullscreen) {
      return () => {};
    }

    let released = false;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const requestWakeLock = async () => {
      try {
        if ("wakeLock" in navigator && navigator.wakeLock?.request) {
          wakeLockRef.current = await navigator.wakeLock.request("screen");
        }
      } catch {
        wakeLockRef.current = null;
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setFullscreen(false);
      }
    };

    requestWakeLock();
    window.addEventListener("keydown", handleEscape);

    return () => {
      if (released) {
        return;
      }

      released = true;
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);

      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
    };
  }, [fullscreen]);

  const clientName = client?.name ?? null;
  const clientSklad = client?.sklad ?? null;

  const generateCode = async () => {
    if (inputCode.length !== 6 || loading) {
      return;
    }

    const normalizedCode = normalizeCode(inputCode);

    setLoading(true);
    setError("");

    try {
      const foundClients = await getClientsByCode(normalizedCode);

      if (foundClients.length === 0) {
        clearSavedClientSelection();
        setClient(null);
        setFinalCode(null);
        setSelectionClients([]);
        setSelectionCode("");
        setError("Клиент не найден");
        return;
      }

      if (foundClients.length === 1) {
        applyClientSelection(normalizedCode, foundClients[0], foundClients, {
          showActivationNotice: true
        });
        return;
      }

      setClient(null);
      setFinalCode(null);
      openSelectionModal(normalizedCode, foundClients, "", {
        showActivationNotice: true
      });
    } catch {
      clearSavedClientSelection();
      setClient(null);
      setFinalCode(null);
      setSelectionClients([]);
      setSelectionCode("");
      setError("Сервер клиентов недоступен. Попробуйте позже");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <section className="client-card">
        <div className="card-inner">
          {!fullscreen && (
            <div className="card-header">
              <div className="card-title-wrap">
                <span className="card-title">
                  Карта клиента
                </span>

                <button
                  type="button"
                  className="card-info-trigger"
                  onClick={() => setCardInfoOpen(true)}
                  aria-label="Информация о карте клиента"
                >
                  <Info size={16} strokeWidth={2.2} aria-hidden="true" />
                </button>
              </div>

              {finalCode && (
                <button
                  type="button"
                  className="fullscreen-btn"
                  onClick={() => setFullscreen(true)}
                >
                  На весь экран
                </button>
              )}
            </div>
          )}

          {finalCode ? (
            <div className="barcode-block">
              {clientName && (
                <div className="client-name">
                  {clientName}
                </div>
              )}

              <div className="client-warehouse">
                Склад: {clientSklad || "-"}
              </div>

              <Barcode
                value={finalCode}
                format="CODE128"
                width={2.5}
                height={140}
                margin={16}
                displayValue={false}
                background="#FFFFFF"
                lineColor="#000000"
              />
            </div>
          ) : (
            <div className="input-block">
              <div className="input-inner">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Введите 6 цифр"
                  value={inputCode}
                  onChange={(event) =>
                    setInputCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                />

                <button
                  type="button"
                  disabled={inputCode.length !== 6 || loading}
                  onClick={generateCode}
                >
                  {loading ? "Проверка..." : "Создать"}
                </button>
              </div>

              {error && (
                <div className="error">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {selectionModalOpen && modalRoot && createPortal(
        <div
          className="client-selection-backdrop"
          onClick={closeSelectionModal}
        >
          <div
            className="client-selection-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="client-selection-header">
              <div className="client-selection-copy">
                <div className="client-selection-code">
                  Код клиента: {selectionCode}
                </div>

                <h3>
                  {modalShowsWarehouseChoices
                    ? "Выберите склад, где вы зарегистрированы"
                    : "Выберите ваш профиль"}
                </h3>

                <p>
                  {modalShowsWarehouseChoices
                    ? "Это поможет показать именно вашу клиентскую карту, если код повторяется в разных базах."
                    : "Мы нашли несколько записей. Выберите вариант, который относится к вам."}
                </p>
              </div>

              <button
                type="button"
                className="client-selection-close"
                onClick={closeSelectionModal}
                aria-label="Закрыть"
              >
                ×
              </button>
            </div>

            {activeWarehouseGroup && warehouseGroups.length > 1 && (
              <button
                type="button"
                className="client-selection-back"
                onClick={() => setActiveWarehouseKey("")}
              >
                ← Выбрать другой склад
              </button>
            )}

            <div className="client-selection-list">
              {modalShowsWarehouseChoices
                ? warehouseGroups.map((group) => {
                  const brand = getWarehouseBrand(group.warehouse);

                  return (
                    <button
                      key={group.warehouseKey}
                      type="button"
                      className={`client-selection-option warehouse-option ${brand.className}`}
                      onClick={() => {
                        if (group.clients.length === 1) {
                          applyClientSelection(selectionCode, group.clients[0], selectionClients, {
                            showActivationNotice: showActivationNoticeAfterSelection
                          });
                          return;
                        }

                        setActiveWarehouseKey(group.warehouseKey);
                      }}
                    >
                      <div className="warehouse-logo-wrap">
                        {brand.logo ? (
                          <img
                            src={brand.logo}
                            alt={brand.title}
                            className="warehouse-logo"
                          />
                        ) : (
                          <div className="warehouse-logo warehouse-logo-fallback">
                            {brand.title.slice(0, 1)}
                          </div>
                        )}
                      </div>

                      <div className="warehouse-option-copy">
                        <span className="warehouse-option-title">
                          {brand.title}
                        </span>

                        <span className="warehouse-option-subtitle">
                          {group.clients.length === 1
                            ? group.clients[0].name
                            : `Найдено профилей: ${group.clients.length}`}
                        </span>
                      </div>
                    </button>
                  );
                })
                : modalClientOptions.map((entry) => (
                  <button
                    key={`${entry.code}-${entry.sklad}-${entry.name}`}
                    type="button"
                    className="client-selection-option profile-option"
                    onClick={() => applyClientSelection(selectionCode, entry, selectionClients, {
                      showActivationNotice: showActivationNoticeAfterSelection
                    })}
                  >
                    <span className="profile-option-name">
                      {entry.name}
                    </span>

                    <span className="profile-option-meta">
                      {entry.sklad || "Склад не указан"}
                    </span>
                  </button>
                ))}
            </div>
          </div>
        </div>,
        modalRoot
      )}

      {activationNoticeOpen && modalRoot && createPortal(
        <div
          className="client-card-modal-backdrop"
          onClick={() => setActivationNoticeOpen(false)}
        >
          <div
            className="client-card-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="client-card-activation-title"
          >
            <button
              type="button"
              className="client-card-modal-close"
              onClick={() => setActivationNoticeOpen(false)}
              aria-label="Закрыть"
            >
              ×
            </button>

            <div className="client-card-modal-badge">Карта клиента активна</div>
            <h3 id="client-card-activation-title">Доступ открыт</h3>
            <p>
              Вы получили доступ к корзине и к оптовым ценам в прайс-листе.
            </p>

            <button
              type="button"
              className="client-card-modal-action"
              onClick={() => setActivationNoticeOpen(false)}
            >
              Понятно
            </button>
          </div>
        </div>,
        modalRoot
      )}

      {cardInfoOpen && modalRoot && createPortal(
        <div
          className="client-card-modal-backdrop"
          onClick={() => setCardInfoOpen(false)}
        >
          <div
            className="client-card-modal info"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="client-card-info-title"
          >
            <button
              type="button"
              className="client-card-modal-close"
              onClick={() => setCardInfoOpen(false)}
              aria-label="Закрыть"
            >
              ×
            </button>

            <div className="client-card-modal-badge">Информация</div>
            <h3 id="client-card-info-title">Как использовать карту клиента</h3>
            <p>
              Покажите штрихкод на зоне подсчёта товаров и поднесите его к сканеру.
            </p>
            <p>
              После считывания сотрудник увидит ваш клиентский доступ и сможет оформить заказ по нужным условиям.
            </p>

            <button
              type="button"
              className="client-card-modal-action"
              onClick={() => setCardInfoOpen(false)}
            >
              Закрыть
            </button>
          </div>
        </div>,
        modalRoot
      )}

      {fullscreen && finalCode && modalRoot && createPortal(
        <div className="client-card fullscreen">
          <button
            type="button"
            className="fullscreen-close"
            onClick={() => setFullscreen(false)}
          >
            Закрыть
          </button>

          <div className="card-inner">
            <div className="barcode-block">
              {clientName && (
                <div className="client-name">
                  {clientName}
                </div>
              )}

              <div className="client-warehouse">
                Склад: {clientSklad || "-"}
              </div>

              <Barcode
                value={finalCode}
                format="CODE128"
                width={3.8}
                height={220}
                margin={0}
                displayValue={false}
                background="#FFFFFF"
                lineColor="#000000"
              />
            </div>
          </div>
        </div>,
        modalRoot
      )}
    </>
  );
};

export default ClientQR;
