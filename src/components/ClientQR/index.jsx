import { useState, useEffect } from "react";
import Barcode from "react-barcode";
import { getClientByCode } from "../../data/api";
import "./style.scss";

const STORAGE_KEY = "client_code";

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

  useEffect(() => {
    let cancelled = false;
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return () => {
        cancelled = true;
      };
    }

    setLoading(true);
    getClientByCode(saved)
      .then((data) => {
        if (cancelled) {
          return;
        }

        if (!data) {
          localStorage.removeItem(STORAGE_KEY);
          setSavedCodeChecked(true);
          return;
        }

        setClient(data);
        setFinalCode(saved);
        setSavedCodeChecked(true);
      })
      .catch(() => {
        if (!cancelled) {
          setError("Не удалось проверить сохраненный код");
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
  }, []);

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

  const clientName = client?.name ?? null;
  const clientSklad = client?.sklad ?? null;

  const generateCode = async () => {
    if (inputCode.length !== 6 || loading) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const foundClient = await getClientByCode(inputCode);

      if (!foundClient) {
        setError("Клиент не найден");
        return;
      }

      setClient(foundClient);
      localStorage.setItem(STORAGE_KEY, inputCode);
      setFinalCode(inputCode);
    } catch {
      setError("Сервер клиентов недоступен. Попробуйте позже");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={`client-card ${fullscreen ? "fullscreen" : ""}`}>
      {fullscreen && (
        <button
          className="fullscreen-close"
          onClick={() => setFullscreen(false)}
        >
          Закрыть
        </button>
      )}

      <div className="card-inner">

        {!fullscreen && (
          <div className="card-header">
            <span className="card-title">
              Карта клиента
            </span>

            {finalCode && (
              <button
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
                onChange={(e) =>
                  setInputCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
              />

              <button
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
  );
};

export default ClientQR;
