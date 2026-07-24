import { useState, useEffect } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { API, formatApiError } from "@/config";

export default function WavelogSection() {
  const { t } = useTranslation();
  const [config, setConfig] = useState({ wavelog_url: "", wavelog_api_key: "", wavelog_station_id: "1", wavelog_auto_sync: false });
  const [configured, setConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [syncResult, setSyncResult] = useState(null);
  const [logs, setLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  useEffect(() => {
    axios.get(`${API}/wavelog/config`).then(res => {
      setConfig(res.data);
      setConfigured(res.data.configured);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/wavelog/config`, config);
      toast.success(t("wavelog.saved"));
      setConfigured(true);
    } catch (err) { toast.error(formatApiError(err.response?.data?.detail)); }
    finally { setSaving(false); }
  };

  const handleTest = async () => {
    setTesting(true); setTestResult(null);
    try {
      const { data } = await axios.post(`${API}/wavelog/test`);
      setTestResult(data);
      if (data.success) toast.success(t("wavelog.test_success"));
      else toast.error(data.message);
    } catch (err) { setTestResult({ success: false, message: formatApiError(err.response?.data?.detail) }); }
    finally { setTesting(false); }
  };

  const handleSync = async () => {
    setSyncing(true); setSyncResult(null);
    try {
      const { data } = await axios.post(`${API}/wavelog/sync`);
      setSyncResult(data);
      if (data.synced > 0) toast.success(`${data.synced} ${t("wavelog.synced")}`);
      else toast.info(data.message);
    } catch (err) { toast.error(formatApiError(err.response?.data?.detail)); }
    finally { setSyncing(false); }
  };

  const fetchLogs = async () => {
    try {
      const { data } = await axios.get(`${API}/wavelog/log`);
      setLogs(data);
      setShowLogs(true);
    } catch { toast.error(t("common.error")); }
  };

  const handleImport = async () => {
    setImporting(true); setImportResult(null);
    try {
      const { data } = await axios.post(`${API}/wavelog/import`);
      setImportResult(data);
      if (data.imported > 0) toast.success(`${data.imported} ${t("wavelog.imported")}`);
      else toast.info(data.message);
    } catch (err) { toast.error(formatApiError(err.response?.data?.detail)); }
    finally { setImporting(false); }
  };

  if (loading) return null;

  return (
    <div className="bg-[#121212] border border-zinc-800/80 p-5 mt-4" data-testid="wavelog-section">
      <h3 className="font-display text-sm font-semibold tracking-tight uppercase text-zinc-400 mb-4">{t("wavelog.title")}</h3>
      <p className="text-xs text-zinc-500 font-mono mb-4">{t("wavelog.description")}</p>

      <div className="space-y-3">
        <div>
          <label className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-500 font-mono block mb-1">{t("wavelog.url")}</label>
          <Input data-testid="wavelog-url-input" value={config.wavelog_url} onChange={(e) => setConfig({...config, wavelog_url: e.target.value})}
            placeholder="https://log.example.com" className="bg-[#09090b] border-zinc-700 text-zinc-100 rounded-none font-mono text-sm" />
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-500 font-mono block mb-1">{t("wavelog.api_key")}</label>
          <Input data-testid="wavelog-api-key-input" type="password" value={config.wavelog_api_key} onChange={(e) => setConfig({...config, wavelog_api_key: e.target.value})}
            placeholder={t("wavelog.api_key")} className="bg-[#09090b] border-zinc-700 text-zinc-100 rounded-none font-mono text-sm" />
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-500 font-mono block mb-1">{t("wavelog.station_id")}</label>
          <Input data-testid="wavelog-station-input" value={config.wavelog_station_id} onChange={(e) => setConfig({...config, wavelog_station_id: e.target.value})}
            placeholder="1" className="bg-[#09090b] border-zinc-700 text-zinc-100 rounded-none font-mono text-sm" />
        </div>
        <div className="flex items-center gap-3 py-2">
          <button onClick={() => setConfig({...config, wavelog_auto_sync: !config.wavelog_auto_sync})} data-testid="wavelog-auto-sync-toggle"
            className={`w-10 h-5 rounded-full transition-colors duration-200 relative ${config.wavelog_auto_sync ? "bg-amber-500" : "bg-zinc-700"}`}>
            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${config.wavelog_auto_sync ? "translate-x-5" : "translate-x-0.5"}`}></div>
          </button>
          <span className="text-xs text-zinc-400 font-mono">{t("wavelog.auto_sync")}</span>
        </div>

        <Button onClick={handleSave} disabled={saving} data-testid="wavelog-save-btn"
          className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold uppercase tracking-wider rounded-none h-10 text-xs">
          {saving ? "..." : t("wavelog.save")}
        </Button>

        {configured && (
          <div className="grid grid-cols-3 gap-2 pt-2">
            <button onClick={handleTest} disabled={testing} data-testid="wavelog-test-btn"
              className="flex items-center justify-center gap-1 px-3 py-2 text-xs font-mono uppercase tracking-wider text-zinc-300 border border-zinc-700 hover:border-amber-500/50 transition-all">
              {testing ? "..." : t("wavelog.test")}
            </button>
            <button onClick={handleSync} disabled={syncing} data-testid="wavelog-sync-btn"
              className="flex items-center justify-center gap-1 px-3 py-2 text-xs font-mono uppercase tracking-wider text-amber-500 border border-amber-500/30 hover:bg-amber-500/10 transition-all">
              {syncing ? t("wavelog.syncing") : t("wavelog.sync")}
            </button>
            <button onClick={handleImport} disabled={importing} data-testid="wavelog-import-btn"
              className="flex items-center justify-center gap-1 px-3 py-2 text-xs font-mono uppercase tracking-wider text-green-400 border border-green-500/30 hover:bg-green-500/10 transition-all">
              {importing ? t("wavelog.importing") : t("wavelog.import")}
            </button>
          </div>
        )}

        {testResult && (
          <div className={`text-xs font-mono p-3 border ${testResult.success ? "border-green-500/30 text-green-400 bg-green-500/5" : "border-red-500/30 text-red-400 bg-red-500/5"}`} data-testid="wavelog-test-result">
            {testResult.message}
          </div>
        )}

        {syncResult && (
          <div className="text-xs font-mono p-3 border border-amber-500/30 text-amber-400 bg-amber-500/5" data-testid="wavelog-sync-result">
            {syncResult.message}
          </div>
        )}

        {importResult && (
          <div className="text-xs font-mono p-3 border border-green-500/30 text-green-400 bg-green-500/5" data-testid="wavelog-import-result">
            {importResult.message}
          </div>
        )}

        {configured && (
          <button onClick={fetchLogs} className="w-full text-xs text-zinc-500 hover:text-amber-500 font-mono transition-colors py-1" data-testid="wavelog-show-log-btn">
            {showLogs ? t("wavelog.hide_log") : t("wavelog.show_log")}
          </button>
        )}

        {showLogs && (
          <div className="bg-[#09090b] border border-zinc-800 max-h-60 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="p-3 text-xs text-zinc-500 font-mono text-center">{t("wavelog.no_log")}</div>
            ) : (
              <div className="divide-y divide-zinc-800/50">
                {logs.map((log, i) => (
                  <div key={i} className="px-3 py-2 text-[11px] font-mono flex items-center gap-2">
                    <span className={log.status === "success" ? "text-green-500" : "text-red-500"}>
                      {log.status === "success" ? "OK" : "ERR"}
                    </span>
                    <span className="text-amber-500">{log.callsign}</span>
                    <span className="text-zinc-500 flex-1 truncate">{log.message}</span>
                    <span className="text-zinc-600 shrink-0">{new Date(log.timestamp).toLocaleString(undefined, {day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"})}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

