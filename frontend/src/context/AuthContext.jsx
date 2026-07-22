import { useState, useEffect, createContext, useContext } from "react";
import axios from "axios";
import { API } from "@/config";

const AuthContext = createContext(null);

export function useAuth() { return useContext(AuthContext); }

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [serverWaking, setServerWaking] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("qso_token");
    if (localStorage.getItem("qso_logged_out") === "true") {
      setUser(false);
      setChecking(false);
      return;
    }
    if (!token) {
      setUser(false);
      setChecking(false);
      return;
    }

    let retryCount = 0;
    const maxRetries = 20;

    const tryAuth = () => {
      const delay = retryCount < 2 ? 3000 : retryCount < 5 ? 5000 : 7000;
      axios.get(`${API}/auth/me`)
        .then(res => {
          setUser(res.data);
          setServerWaking(false);
          setChecking(false);
        })
        .catch(err => {
          const status = err.response?.status;
          if (status === 401 || status === 403) {
            localStorage.removeItem("qso_token");
            setUser(false);
            setServerWaking(false);
            setChecking(false);
          } else if (retryCount < maxRetries) {
            retryCount++;
            setServerWaking(true);
            setTimeout(tryAuth, delay);
          } else {
            try {
              const payload = JSON.parse(atob(token.split(".")[1]));
              setUser({ id: payload.sub, email: payload.email || "", callsign: "...", role: "user" });
            } catch {
              setUser(false);
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
    setUser(data);
  };
  const register = async (email, password, callsign) => {
    const { data } = await axios.post(`${API}/auth/register`, { email, password, callsign });
    if (data.access_token) localStorage.setItem("qso_token", data.access_token);
    localStorage.removeItem("qso_logged_out");
    setUser(data);
  };
  const logout = async () => {
    try { await axios.post(`${API}/auth/logout`); } catch {}
    localStorage.removeItem("qso_token");
    localStorage.setItem("qso_logged_out", "true");
    sessionStorage.clear();
    delete axios.defaults.headers.common["Authorization"];
    setUser(false);
  };

  return <AuthContext.Provider value={{ user, checking, serverWaking, login, register, logout }}>{children}</AuthContext.Provider>;
}
