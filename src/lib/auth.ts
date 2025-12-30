const TOKEN_KEY = "aqua_token";
const EMAIL_KEY = "aqua_email";

export function saveAuth(token: string, email: string) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(EMAIL_KEY, email);
}

export function loadAuth(): { token: string | null; email: string | null } {
  return {
    token: localStorage.getItem(TOKEN_KEY),
    email: localStorage.getItem(EMAIL_KEY),
  };
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EMAIL_KEY);
}
