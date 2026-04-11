import { useState, useEffect, useCallback } from "react";
import "@/App.css";
import axios from "axios";
import { Toaster, toast } from "sonner";
import { 
  Broadcast, 
  CalendarBlank, 
  User, 
  IdentificationCard,
  MagnifyingGlass,
  Pencil,
  Trash,
  Plus,
  X,
  Check
} from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function App() {
  const [qsos, setQsos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({ total: 0 });
  const [editingId, setEditingId] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    callsign: "",
    date: new Date().toISOString().split('T')[0],
    frequency: "",
    name: ""
  });

  const [editFormData, setEditFormData] = useState({
    callsign: "",
    date: "",
    frequency: "",
    name: ""
  });

  const fetchQsos = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      
      const response = await axios.get(`${API}/qso?${params.toString()}`);
      setQsos(response.data);
    } catch (error) {
      console.error("Error fetching QSOs:", error);
      toast.error("Erreur lors du chargement des QSOs");
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/qso/stats/total`);
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  useEffect(() => {
    fetchQsos();
    fetchStats();
  }, [fetchQsos]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.callsign || !formData.date || !formData.frequency || !formData.name) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    try {
      await axios.post(`${API}/qso`, {
        ...formData,
        callsign: formData.callsign.toUpperCase(),
        frequency: parseFloat(formData.frequency)
      });
      
      toast.success("QSO ajouté avec succès");
      setFormData({
        callsign: "",
        date: new Date().toISOString().split('T')[0],
        frequency: "",
        name: ""
      });
      fetchQsos();
      fetchStats();
    } catch (error) {
      console.error("Error creating QSO:", error);
      toast.error("Erreur lors de l'ajout du QSO");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer ce QSO ?")) return;
    
    try {
      await axios.delete(`${API}/qso/${id}`);
      toast.success("QSO supprimé");
      fetchQsos();
      fetchStats();
    } catch (error) {
      console.error("Error deleting QSO:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const startEdit = (qso) => {
    setEditingId(qso.id);
    setEditFormData({
      callsign: qso.callsign,
      date: qso.date,
      frequency: qso.frequency.toString(),
      name: qso.name
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditFormData({ callsign: "", date: "", frequency: "", name: "" });
  };

  const saveEdit = async (id) => {
    try {
      await axios.put(`${API}/qso/${id}`, {
        ...editFormData,
        callsign: editFormData.callsign.toUpperCase(),
        frequency: parseFloat(editFormData.frequency)
      });
      toast.success("QSO modifié");
      setEditingId(null);
      fetchQsos();
    } catch (error) {
      console.error("Error updating QSO:", error);
      toast.error("Erreur lors de la modification");
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-[#09090b] relative">
      {/* Background texture */}
      <div className="radio-bg"></div>
      
      <Toaster 
        position="top-right" 
        theme="dark"
        toastOptions={{
          style: {
            background: '#121212',
            border: '1px solid #27272a',
            color: '#FAFAFA'
          }
        }}
      />
      
      <div className="relative z-10 max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8">
        {/* Header */}
        <header className="flex justify-between items-center border-b border-zinc-800 pb-4 mb-6" data-testid="app-header">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse"></div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight uppercase text-zinc-100">
              QSO LOG
            </h1>
          </div>
          <div className="text-xs text-zinc-500 font-mono uppercase tracking-widest">
            Carnet de Trafic
          </div>
        </header>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Content - QSO List */}
          <main className="col-span-12 lg:col-span-8 flex flex-col gap-6">
            {/* Search Bar */}
            <div className="relative">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
              <Input
                data-testid="qso-search-input"
                type="text"
                placeholder="Rechercher par indicatif ou nom..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 bg-[#09090b] border-zinc-700 focus:border-amber-500 text-zinc-100 rounded-none font-mono text-sm h-12"
              />
            </div>

            {/* QSO Table */}
            <div className="bg-[#121212] border border-zinc-800/80 overflow-hidden">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="inline-block w-4 h-6 bg-amber-500 animate-pulse"></div>
                  <p className="mt-4 text-zinc-500 font-mono text-sm">Chargement...</p>
                </div>
              ) : qsos.length === 0 ? (
                <div className="p-12 text-center" data-testid="qso-empty-state">
                  <img 
                    src="https://static.prod-images.emergentagent.com/jobs/500d8642-2d5d-4297-bd34-3b17f0d02b71/images/0269ce3934d36a628e9a11a54b81dcc1d41264abf64f169ad8fe18dfcd38aa1b.png"
                    alt="Radio"
                    className="w-24 h-24 mx-auto opacity-30 mb-4"
                  />
                  <p className="text-zinc-500 font-mono text-sm">Aucun QSO enregistré</p>
                  <p className="text-zinc-600 font-mono text-xs mt-1">Ajoutez votre premier contact</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="qso-table w-full">
                    <thead>
                      <tr>
                        <th>Indicatif</th>
                        <th>Date</th>
                        <th className="text-right">Fréquence</th>
                        <th>Nom</th>
                        <th className="w-24">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {qsos.map((qso) => (
                        <tr key={qso.id} data-testid="qso-table-row">
                          {editingId === qso.id ? (
                            <>
                              <td>
                                <Input
                                  value={editFormData.callsign}
                                  onChange={(e) => setEditFormData({...editFormData, callsign: e.target.value.toUpperCase()})}
                                  className="bg-[#09090b] border-zinc-700 text-zinc-100 rounded-none font-mono text-sm h-8 w-28"
                                />
                              </td>
                              <td>
                                <Input
                                  type="date"
                                  value={editFormData.date}
                                  onChange={(e) => setEditFormData({...editFormData, date: e.target.value})}
                                  className="bg-[#09090b] border-zinc-700 text-zinc-100 rounded-none font-mono text-sm h-8 w-32"
                                />
                              </td>
                              <td className="text-right">
                                <Input
                                  type="number"
                                  step="0.001"
                                  value={editFormData.frequency}
                                  onChange={(e) => setEditFormData({...editFormData, frequency: e.target.value})}
                                  className="bg-[#09090b] border-zinc-700 text-zinc-100 rounded-none font-mono text-sm h-8 w-24 text-right"
                                />
                              </td>
                              <td>
                                <Input
                                  value={editFormData.name}
                                  onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                                  className="bg-[#09090b] border-zinc-700 text-zinc-100 rounded-none font-mono text-sm h-8 w-28"
                                />
                              </td>
                              <td>
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => saveEdit(qso.id)}
                                    className="p-1.5 text-green-500 hover:text-green-400 transition-colors"
                                    data-testid="qso-save-edit-btn"
                                  >
                                    <Check size={16} />
                                  </button>
                                  <button
                                    onClick={cancelEdit}
                                    className="p-1.5 text-zinc-500 hover:text-zinc-300 transition-colors"
                                    data-testid="qso-cancel-edit-btn"
                                  >
                                    <X size={16} />
                                  </button>
                                </div>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="font-bold text-amber-500">{qso.callsign}</td>
                              <td className="text-zinc-400">{formatDate(qso.date)}</td>
                              <td className="text-right text-zinc-200 tabular-nums">{qso.frequency.toFixed(3)} MHz</td>
                              <td className="text-zinc-300">{qso.name}</td>
                              <td>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => startEdit(qso)}
                                    className="p-1.5 text-zinc-500 hover:text-amber-500 transition-colors"
                                    data-testid="qso-edit-btn"
                                  >
                                    <Pencil size={16} />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(qso.id)}
                                    className="p-1.5 text-zinc-500 hover:text-red-500 transition-colors"
                                    data-testid="qso-delete-btn"
                                  >
                                    <Trash size={16} />
                                  </button>
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </main>

          {/* Sidebar - Form & Stats */}
          <aside className="col-span-12 lg:col-span-4 flex flex-col gap-6">
            {/* Stats Widget */}
            <div className="bg-[#121212] border border-zinc-800/80 p-6" data-testid="qso-total-stats">
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 mb-2">
                Total QSOs
              </div>
              <div className="text-5xl font-bold tracking-tighter text-amber-500 amber-glow font-mono">
                {stats.total}
              </div>
            </div>

            {/* Add QSO Form */}
            <div className="bg-[#121212] border border-zinc-800/80 p-6" data-testid="qso-add-form">
              <h2 className="font-display text-xl font-semibold tracking-tight uppercase text-zinc-100 mb-6 flex items-center gap-2">
                <Plus size={20} className="text-amber-500" />
                Nouveau QSO
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
                    <IdentificationCard size={14} />
                    Indicatif
                  </Label>
                  <Input
                    data-testid="qso-callsign-input"
                    type="text"
                    value={formData.callsign}
                    onChange={(e) => setFormData({...formData, callsign: e.target.value.toUpperCase()})}
                    placeholder="F4ABC"
                    className="bg-[#09090b] border-zinc-700 focus:border-amber-500 text-zinc-100 rounded-none font-mono text-sm uppercase"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
                    <CalendarBlank size={14} />
                    Date
                  </Label>
                  <Input
                    data-testid="qso-date-input"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="bg-[#09090b] border-zinc-700 focus:border-amber-500 text-zinc-100 rounded-none font-mono text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
                    <Broadcast size={14} />
                    Fréquence (MHz)
                  </Label>
                  <Input
                    data-testid="qso-freq-input"
                    type="number"
                    step="0.001"
                    value={formData.frequency}
                    onChange={(e) => setFormData({...formData, frequency: e.target.value})}
                    placeholder="145.500"
                    className="bg-[#09090b] border-zinc-700 focus:border-amber-500 text-zinc-100 rounded-none font-mono text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
                    <User size={14} />
                    Nom
                  </Label>
                  <Input
                    data-testid="qso-name-input"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Jean"
                    className="bg-[#09090b] border-zinc-700 focus:border-amber-500 text-zinc-100 rounded-none font-mono text-sm"
                  />
                </div>

                <Button
                  data-testid="qso-submit-button"
                  type="submit"
                  className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold uppercase tracking-wider rounded-none transition-all duration-200 shadow-[0_0_15px_rgba(245,158,11,0.15)] hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] h-12"
                >
                  Enregistrer QSO
                </Button>
              </form>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default App;
