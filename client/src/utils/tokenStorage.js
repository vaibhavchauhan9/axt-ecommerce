// Centralizes where the access token is stored so "Remember Me" actually
// does something: checked -> localStorage (survives closing the browser
// entirely), unchecked -> sessionStorage (cleared once that tab/browser
// session ends).
const KEY = 'axt_token';

export const getToken = () => {
  return localStorage.getItem(KEY) || sessionStorage.getItem(KEY);
};

export const setToken = (token, remember = true) => {
  if (remember) {
    localStorage.setItem(KEY, token);
    sessionStorage.removeItem(KEY);
  } else {
    sessionStorage.setItem(KEY, token);
    localStorage.removeItem(KEY);
  }
};

export const clearToken = () => {
  localStorage.removeItem(KEY);
  sessionStorage.removeItem(KEY);
};

// Whichever storage currently holds the token is the one that should be
// updated silently when the access token is rotated (refresh, password change).
export const updateTokenInPlace = (token) => {
  if (localStorage.getItem(KEY)) {
    localStorage.setItem(KEY, token);
  } else {
    sessionStorage.setItem(KEY, token);
  }
};

