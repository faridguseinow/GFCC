import { useState, useEffect, useMemo } from "react";
import Barcode from "react-barcode";
import clients from "../../data/clients.json";
import "./style.scss";

const STORAGE_KEY = "client_code";

const ClientQR = () => {
  const [inputCode, setInputCode] = useState("");
  const [finalCode, setFinalCode] = useState(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [error, setError] = useState("");

  const clientsMap = useMemo(() => {
    return Object.fromEntries(
      clients.map((c) => [c.code, c.name])
    );
  }, []);

  const clientName = finalCode ? clientsMap[finalCode] : null;

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && clientsMap[saved]) {
      setFinalCode(saved);
    }
  }, [clientsMap]);

  const generateCode = () => {
    if (inputCode.length !== 6) return;

    if (!clientsMap[inputCode]) {
      setError("Клиент не найден");
      return;
    }

    setError("");
    localStorage.setItem(STORAGE_KEY, inputCode);
    setFinalCode(inputCode);
  };

  const resetCode = () => {
    localStorage.removeItem(STORAGE_KEY);
    setFinalCode(null);
    setInputCode("");
    setError("");
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

            {!fullscreen && (
              <button
                className="secondary-btn"
                onClick={resetCode}
              >
                Изменить код
              </button>
            )}

          </div>
        ) : (
          <div className="input-block">

            <div className="input-inner">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="Введите 6 цифр"
                value={inputCode}
                onChange={(e) =>
                  setInputCode(e.target.value.replace(/\D/g, ""))
                }
              />

              <button
                disabled={inputCode.length !== 6}
                onClick={generateCode}
              >
                Создать
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