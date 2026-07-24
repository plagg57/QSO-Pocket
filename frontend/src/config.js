import axios from "axios";
import i18nInstance from "@/i18n";

export const LOGO_URL = "https://customer-assets.emergentagent.com/job_radio-memory/artifacts/gnvrdwzf_1000015588.png";

export const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const MODES = ["FM", "SSB", "CW", "FT8", "FT4", "DMR", "C4FM", "D-STAR", "USB", "LSB", "AM", "RTTY", "PSK31", "SSTV"];
export const BANDS = ["2m", "70cm", "11m", "10m", "20m", "40m", "80m", "15m", "6m", "160m", "30m", "17m", "12m", "4m", "60m", "23cm", "33cm", "1.25m", "13cm"];

// Axios setup
axios.defaults.withCredentials = true;
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("qso_token");
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function formatApiError(detail) {
  if (detail == null) return i18nInstance.t("common.error");
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((e) => e?.msg || JSON.stringify(e)).filter(Boolean).join(" ");
  return String(detail);
}
