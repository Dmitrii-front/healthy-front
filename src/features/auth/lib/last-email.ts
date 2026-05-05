const LAST_EMAIL_KEY = "healthy.lastSignInEmail";

export const getLastSignInEmail = (): string => {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(LAST_EMAIL_KEY) ?? "";
};

export const rememberSignInEmail = (email: string): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem(LAST_EMAIL_KEY, email);
};

export const hasPriorSignIn = (): boolean => getLastSignInEmail().length > 0;
