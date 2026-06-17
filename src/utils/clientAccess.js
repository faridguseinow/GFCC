const CLIENT_CODE_KEY = "client_code";
const CLIENT_SELECTION_KEY = "client_selection_v2";

const toText = (value) => (value === null || value === undefined ? "" : String(value).trim());

const normalizeCode = (value) => toText(value).padStart(6, "0");

const readSelection = () => {
  try {
    const raw = localStorage.getItem(CLIENT_SELECTION_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    if (!parsed.code) {
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

export function getActiveClient() {
  try {
    const code = normalizeCode(localStorage.getItem(CLIENT_CODE_KEY));
    const selection = readSelection();

    if (!code || !selection?.code) {
      return null;
    }

    return {
      code,
      name: selection.name,
      sklad: selection.sklad
    };
  } catch {
    return null;
  }
}

export function hasActiveClientCard() {
  const client = getActiveClient();

  return Boolean(client?.code);
}

export function subscribeToActiveClientCardChanges(callback) {
  const sync = () => callback(getActiveClient());

  window.addEventListener("storage", sync);
  window.addEventListener("focus", sync);
  window.addEventListener("gfcc:client-code-ready", sync);

  return () => {
    window.removeEventListener("storage", sync);
    window.removeEventListener("focus", sync);
    window.removeEventListener("gfcc:client-code-ready", sync);
  };
}

