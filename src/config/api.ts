function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    if ((window as any).__API_URL__) {
      return (window as any).__API_URL__;
    }
    const host = window.location.hostname;
    const protocol = window.location.protocol;
    const envUrl = import.meta.env["VITE_API_URL"];
    if (envUrl && !envUrl.includes("localhost") && !envUrl.includes("127.0.0.1")) {
      return envUrl;
    }
    return `${protocol}//${host}:8001`;
  }
  return import.meta.env["VITE_API_URL"] || "http://127.0.0.1:8001";
}

export const API_BASE_URL = getApiBaseUrl();
