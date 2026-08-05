import { useState, useEffect, createContext, useContext } from "react";
import axios from "axios";
import { API } from "@/config";

const AuthContext = createContext(null);

export function useAuth() { return useContext(AuthContext); }

const USER_CACHE_KEY = "qso_user_cache";

function getCachedUser() {
  try {
    const cached = localStorage.getItem(USER_CACHE_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch { return null; }
}

function cacheUser(user) {
  if (user && user.id) {
    localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
  }
}

function clearCachedUser() {
  localStorage.removeItem(USER_CACHE_KEY);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [serverWaking, setServerWaking] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("qso_token");
    if (localStorage.getItem("qso_logged_out") === "true") {
      setUser(false); setChecking(false); return;
    }
    if (!token) {
      setUser(false); setChecking(false); return;
    }

    // If we have cached user data AND we're offline, use cache immediately
    const cached = getCachedUser();
    const isOnline = navigator.onLine;

    if (!isOnline && cached) {
      setUser(cached);
      setChecking(false);
      return;
    }

    // If we have cached data, show it immediately while verifying with server
    if (cached) {
      setUser(cached);
      setChecking(false);
    }

    // Try to verify with server (non-blocking if we have cache)
    let retryCount = 0;
    const maxRetries = cached ? 3 : 15; // Fewer retries if we already have cache
    const tryAuth = () => {
      const delay = retryCount < 2 ? 3000 : 5000;
      axios.get(`${API}/auth/me`)
        .then(res => {
          cacheUser(res.data);
          setUser(res.data);
          setServerWaking(false);
          setChecking(false);
        })
        .catch(err => {
          const status = err.response?.status;
          if (status === 401 || status === 403) {
            // Token is truly invalid — logout
            localStorage.removeItem("qso_token");
            clearCachedUser();
            setUser(false);
            setServerWaking(false);
            setChecking(false);
          } else if (retryCount < maxRetries) {
            retryCount++;
            if (!cached) setServerWaking(true);
            setTimeout(tryAuth, delay);
          } else {
            // All retries exhausted — use cache or token payload
            if (!cached) {
              try {
                const payload = JSON.parse(atob(token.split(".")[1]));
                const fallbackUser = {
                  id: payload.sub,
                  email: payload.email || "",
                  callsign: payload.callsign || "...",
                  role: "user",
                  user_type: "radioamateur",
                  callsigns: { radioamateur: "", cb: "", swl: "" }
                };
                setUser(fallbackUser);
              } catch { setUser(false); }
            }
            setServerWaking(false);
            setChecking(false);
          }
        });
    };
    tryAuth();
  }, []);

  const login = async (email, password) => {
    const { data } = await axios.post(`${API}/auth/login`, { email, password });
    if (data.access_token) localStorage.setItem("qso_token", data.access_token);
    localStorage.removeItem("qso_logged_out");
    cacheUser(data);
    setUser(data);
  };

  const register = async (email, password, callsign, userType, noCallsign) => {
    const payload = { email, password, user_type: userType || "radioamateur" };
    if (noCallsign) { payload.no_callsign = true; } else { payload.callsign = callsign; }
    const { data } = await axios.post(`${API}/auth/register`, payload);
    if (data.access_token) localStorage.setItem("qso_token", data.access_token);
    localStorage.removeItem("qso_logged_out");
    cacheUser(data);
    setUser(data);
  };

  const logout = async () => {
    try { await axios.post(`${API}/auth/logout`); } catch {}
    localStorage.removeItem("qso_token");
    localStorage.setItem("qso_logged_out", "true");
    clearCachedUser();
    sessionStorage.clear();
    delete axios.defaults.headers.common["Authorization"];
    setUser(false);
  };

  return <AuthContext.Provider value={{ user, checking, serverWaking, login, register, logout }}>{children}</AuthContext.Provider>;
}
