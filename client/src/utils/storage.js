const STORAGE_KEY = "srgs_auth";

export const getStoredAuth = () => {
  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);
    return rawValue ? JSON.parse(rawValue) : { token: "", user: null };
  } catch {
    return { token: "", user: null };
  }
};

export const setStoredAuth = ({ token, user }) => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user }));
};

export const clearStoredAuth = () => {
  window.localStorage.removeItem(STORAGE_KEY);
};

export const getStoredToken = () => getStoredAuth().token;
