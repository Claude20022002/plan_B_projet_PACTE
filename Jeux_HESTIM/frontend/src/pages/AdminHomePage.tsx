import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import ThemeToggle from '../components/ThemeToggle';
import LanguageToggle from '../components/LanguageToggle';
import socketService from '../api/socketService';
import { useTranslation } from 'react-i18next';
import {
  CalendarDays,
  Database,
  Edit,
  GraduationCap,
  Loader2,
  Mail,
  Plus,
  Save,
  Search,
  ShieldCheck,
  Trash2,
  UserCheck,
  Users,
  LogOut,
  X,
} from 'lucide-react';

type Participant = {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  statut: string;
  matiere: string;
  groupe: string;
  role: string;
};

type Enseignant = {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  statut: string;
  classeId: number;
  classe: string;
  matiere: string;
  role: string;
};

type ClasseAvecParticipants = {
  id: number;
  nom: string;
  nombreParticipants: number;
  participants: Participant[];
};

type SessionPedagogique = {
  id: number;
  titre: string;
  dateDebut: string;
  dateFin: string;
  jeu: string;
  classeId: number;
  classe: string;
  enseignantId: number;
  enseignant: string;
  participantIds: number[];
  nombreParticipants: number;
};

type AdminDashboardData = {
  totalParticipants: number;
  totalEnseignants: number;
  totalAdministrateurs: number;
  totalSessions: number;
  classes: ClasseAvecParticipants[];
  enseignants: Enseignant[];
  sessions: SessionPedagogique[];
  administrateurs: any[];
};

type SessionForm = {
  titre: string;
  dateDebut: string;
  dateFin: string;
  jeu: string;
  classeId: string;
  enseignantId: string;
  participantIds: number[];
};

const emptySessionForm: SessionForm = {
  titre: '',
  dateDebut: '',
  dateFin: '',
  jeu: '',
  classeId: '',
  enseignantId: '',
  participantIds: [],
};

const LISTE_JEUX = [
  "Reactik V2",
  "Jeu de la Chaine Logistique",
  "Gestion de Production",
  "Optimisation des Stocks",
  "Simulation d'Entreprise",
  "Management de Projet",
];

function AdminHomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingSession, setSavingSession] = useState(false);
  const [deletingSessionId, setDeletingSessionId] = useState<number | null>(null);
  const [editingSessionId, setEditingSessionId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [sessionForm, setSessionForm] = useState<SessionForm>(emptySessionForm);
  const [globalSearch, setGlobalSearch] = useState('');
  const [filterClasse, setFilterClasse] = useState('');
  const [participantSearch, setParticipantSearch] = useState('');
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [userForm, setUserForm] = useState({ nom: '', prenom: '', email: '', password: '', classeId: '' });

  useEffect(() => {
    const userString = localStorage.getItem('user');
    if (!userString) {
      navigate('/');
      return;
    }
    const user = JSON.parse(userString);
    if (user.role !== 'Administrateur') {
      navigate('/');
      return;
    }
    fetchAdminData();
  }, [navigate]);

  const selectedClasse = useMemo(() => {
    if (!data || !sessionForm.classeId) return null;
    return data.classes.find((classe) => classe.id === Number(sessionForm.classeId)) || null;
  }, [data, sessionForm.classeId]);

  const filteredEnseignants = useMemo(() => {
    if (!data) return [];
    if (!sessionForm.classeId) return data.enseignants;
    return data.enseignants.filter((ens) => !ens.classeId || ens.classeId === Number(sessionForm.classeId));
  }, [data, sessionForm.classeId]);

  const filteredAdministrateurs = useMemo(() => {
    if (!data) return [];
    return data.administrateurs.filter(admin => 
      admin.nom.toLowerCase().includes(globalSearch.toLowerCase()) ||
      admin.prenom.toLowerCase().includes(globalSearch.toLowerCase()) ||
      admin.email.toLowerCase().includes(globalSearch.toLowerCase())
    );
  }, [data, globalSearch]);

  const filteredSessionsList = useMemo(() => {
    if (!data) return [];
    return data.sessions.filter(s => {
      const matchSearch = s.titre.toLowerCase().includes(globalSearch.toLowerCase()) ||
                         s.enseignant.toLowerCase().includes(globalSearch.toLowerCase()) ||
                         s.classe.toLowerCase().includes(globalSearch.toLowerCase());
      const matchClasse = !filterClasse || s.classe === filterClasse;
      return matchSearch && matchClasse;
    });
  }, [data, globalSearch, filterClasse]);

  const filteredClassesList = useMemo(() => {
    if (!data) return [];
    return data.classes
      .filter(c => !filterClasse || c.nom === filterClasse)
      .map(c => ({
        ...c,
        participants: c.participants.filter(p => 
          p.nom.toLowerCase().includes(globalSearch.toLowerCase()) ||
          p.prenom.toLowerCase().includes(globalSearch.toLowerCase()) ||
          p.email.toLowerCase().includes(globalSearch.toLowerCase())
        )
      }))
      .filter(c => c.participants.length > 0 || (!globalSearch && (!filterClasse || c.nom === filterClasse)));
  }, [data, globalSearch, filterClasse]);

  const filteredEnseignantsList = useMemo(() => {
    if (!data) return [];
    return data.enseignants.filter(ens => {
      const matchSearch = ens.nom.toLowerCase().includes(globalSearch.toLowerCase()) ||
                         ens.prenom.toLowerCase().includes(globalSearch.toLowerCase()) ||
                         ens.email.toLowerCase().includes(globalSearch.toLowerCase());
      const matchClasse = !filterClasse || ens.classe === filterClasse;
      return matchSearch && matchClasse;
    });
  }, [data, globalSearch, filterClasse]);

  const fetchAdminData = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await apiClient.get('/admin/dashboard');
      setData(res.data);
    } catch (err) {
      console.error('Erreur chargement espace administrateur', err);
      setError('Impossible de charger les donnees administrateur. Verifiez que le backend est lance.');
    } finally {
      setLoading(false);
    }
  };

  const resetSessionForm = () => {
    setSessionForm(emptySessionForm);
    setEditingSessionId(null);
    setShowSessionForm(false);
  };

  const handleClasseSessionChange = (classeId: string) => {
    const classe = data?.classes.find((item) => item.id === Number(classeId));

    setSessionForm({
      ...sessionForm,
      classeId,
      participantIds: classe ? classe.participants.map((participant) => participant.id) : [],
    });
  };

  const toggleParticipant = (participantId: number) => {
    setSessionForm((current) => ({
      ...current,
      participantIds: current.participantIds.includes(participantId)
        ? current.participantIds.filter((id) => id !== participantId)
        : [...current.participantIds, participantId],
    }));
  };

  const startEditSession = (session: SessionPedagogique) => {
    setEditingSessionId(session.id);
    setSessionForm({
      titre: session.titre,
      dateDebut: session.dateDebut,
      dateFin: session.dateFin,
      jeu: session.jeu || '',
      classeId: String(session.classeId || ''),
      enseignantId: String(session.enseignantId || ''),
      participantIds: session.participantIds || [],
    });
    setShowSessionForm(true);
    setSuccess('');
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveSession = async (event: FormEvent) => {
    event.preventDefault();
    setSavingSession(true);
    setError('');
    setSuccess('');

    const payload = {
      titre: sessionForm.titre,
      dateDebut: sessionForm.dateDebut,
      dateFin: sessionForm.dateFin,
      jeu: sessionForm.jeu,
      classeId: Number(sessionForm.classeId),
      enseignantId: Number(sessionForm.enseignantId),
      participantIds: sessionForm.participantIds,
    };

    try {
      if (editingSessionId) {
        await apiClient.put(`/admin/sessions/${editingSessionId}`, payload);
        setSuccess('Session modifiee avec succes.');
      } else {
        await apiClient.post('/admin/sessions', payload);
        setSuccess('Session creee avec succes.');
      }

      resetSessionForm();
      await fetchAdminData();
    } catch (err: any) {
      console.error('Erreur enregistrement session', err);
      setError(err.response?.data?.message || 'Impossible d’enregistrer la session. Verifiez les champs.');
    } finally {
      setSavingSession(false);
    }
  };

  const handleDeleteSession = async (session: SessionPedagogique) => {
    const confirmed = window.confirm(`Voulez-vous vraiment supprimer la session "${session.titre}" ?`);
    if (!confirmed) return;

    setDeletingSessionId(session.id);
    setError('');
    setSuccess('');

    try {
      await apiClient.delete(`/admin/sessions/${session.id}`);
      setSuccess('Session supprimee avec succes.');
      if (editingSessionId === session.id) resetSessionForm();
      await fetchAdminData();
    } catch (err: any) {
      console.error('Erreur suppression session', err);
      setError(err.response?.data?.message || 'Impossible de supprimer la session.');
    } finally {
      setDeletingSessionId(null);
    }
  };

  const handleDeleteUser = async (user: { id: number, nom: string, prenom: string }) => {
    const confirmed = window.confirm(`Voulez-vous vraiment supprimer le compte de ${user.prenom} ${user.nom} ?`);
    if (!confirmed) return;

    try {
      await apiClient.delete(`/admin/users/${user.id}`);
      setSuccess('Utilisateur supprime avec succes.');
      await fetchAdminData();
    } catch (err: any) {
      console.error('Erreur suppression utilisateur', err);
      setError(err.response?.data?.message || 'Impossible de supprimer l’utilisateur.');
    }
  };

  const startEditUser = (user: any) => {
    setEditingUser(user);
    setUserForm({
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      password: '',
      classeId: String(user.classeId || ''),
    });
  };

  const handleSaveUser = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.put(`/admin/users/${editingUser.id}`, userForm);
      setSuccess('Utilisateur mis à jour avec succès.');
      setEditingUser(null);
      await fetchAdminData();
    } catch (err: any) {
      console.error('Erreur mise à jour utilisateur', err);
      setError(err.response?.data?.message || 'Impossible de mettre à jour l’utilisateur.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    if (socketService.socket) {
      socketService.disconnect();
    }
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-700 dark:text-slate-300 transition-colors duration-300">
        <div className="flex items-center gap-3 font-bold">
          <Loader2 className="w-6 h-6 animate-spin text-blue-700" />
          Chargement de l’espace administrateur...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-blue-700 shadow-md">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight flex items-center gap-3 transition-colors">
                {t('admin.welcome')}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                {t('admin.subtitle')}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <LanguageToggle />
            <ThemeToggle />
            <button
              type="button"
              onClick={() => {
                if (showSessionForm && !editingSessionId) {
                  setShowSessionForm(false);
                } else {
                  setEditingSessionId(null);
                  setSessionForm(emptySessionForm);
                  setShowSessionForm(true);
                }
              }}
              className="inline-flex items-center justify-center gap-2 bg-blue-700 text-white px-5 py-3 rounded-xl font-bold shadow-lg shadow-blue-200 dark:shadow-none hover:bg-red-600 transition-all w-full sm:w-auto"
            >
              <Plus className="w-5 h-5" />
              {t('admin.createSession')}
            </button>
            <Link to="/database" className="inline-flex items-center justify-center gap-2 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 px-5 py-3 rounded-xl font-bold border border-slate-200 dark:border-slate-800 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all w-full sm:w-auto">
              <Database className="w-5 h-5 text-blue-700" />
              {t('admin.database')}
            </Link>
            <button
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-2 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border-2 border-red-100 dark:border-red-900/30 px-5 py-3 rounded-xl font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition-all w-full sm:w-auto"
            >
              <LogOut className="w-5 h-5" />
              {t('nav.logout')}
            </button>
          </div>
        </div>

        {error && <div className="bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800 rounded-xl p-4 text-sm font-medium">{error}</div>}
        {success && <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 text-sm font-medium">{success}</div>}

        {data && (
          <>
            {showSessionForm && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-6">
                <div className="flex items-center justify-between gap-4 mb-5">
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <CalendarDays className="w-6 h-6 text-blue-700" />
                    {editingSessionId ? t('common.edit') : t('admin.createSession')}
                  </h2>
                  <button type="button" onClick={resetSessionForm} className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white font-semibold">
                    <X className="w-5 h-5" /> {t('common.close')}
                  </button>
                </div>

                <form onSubmit={handleSaveSession} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Titre de la session</label>
                      <input required value={sessionForm.titre} onChange={(e) => setSessionForm({ ...sessionForm, titre: e.target.value })} placeholder="Ex: Session Algorithmique" className="mt-1 w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none dark:text-white" />
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Date de début</label>
                      <input required type="date" value={sessionForm.dateDebut} onChange={(e) => setSessionForm({ ...sessionForm, dateDebut: e.target.value })} className="mt-1 w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none dark:text-white" />
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Date de fin</label>
                      <input required type="date" value={sessionForm.dateFin} onChange={(e) => setSessionForm({ ...sessionForm, dateFin: e.target.value })} className="mt-1 w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none dark:text-white" />
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('admin.sessions.table.class')}</label>
                      <select required value={sessionForm.classeId} onChange={(e) => handleClasseSessionChange(e.target.value)} className="mt-1 w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none dark:text-white">
                        <option value="">{t('common.loading')}</option>
                        {data.classes.map((classe) => <option key={classe.id} value={classe.id}>{classe.nom}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('admin.sessions.table.teacher')}</label>
                      <select required value={sessionForm.enseignantId} onChange={(e) => setSessionForm({ ...sessionForm, enseignantId: e.target.value })} className="mt-1 w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none dark:text-white">
                        <option value="">{t('common.loading')}</option>
                        {filteredEnseignants.map((enseignant) => (
                          <option key={enseignant.id} value={enseignant.id}>{enseignant.nom} {enseignant.prenom} - {enseignant.email}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('admin.sessions.table.title')}</label>
                      <select required value={sessionForm.jeu} onChange={(e) => setSessionForm({ ...sessionForm, jeu: e.target.value })} className="mt-1 w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none dark:text-white">
                        <option value="">{t('common.loading')}</option>
                        {LISTE_JEUX.map((jeu) => (
                          <option key={jeu} value={jeu}>{jeu}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                      <div>
                        <h3 className="font-bold text-slate-800 dark:text-white">{t('admin.users.participants')}</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{t('admin.sessions.table.class')}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          type="button"
                          onClick={() => setSessionForm({...sessionForm, participantIds: selectedClasse?.participants.map(p => p.id) || []})}
                          className="text-[10px] font-black uppercase tracking-tighter px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-100 transition-colors"
                        >
                          {t('common.selectAll')}
                        </button>
                        <button 
                          type="button"
                          onClick={() => setSessionForm({...sessionForm, participantIds: []})}
                          className="text-[10px] font-black uppercase tracking-tighter px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-100 transition-colors"
                        >
                          {t('common.deselectAll')}
                        </button>
                        <span className="text-xs font-black text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded-full border border-red-100 dark:border-red-900/30">
                          {sessionForm.participantIds.length} {t('admin.sessions.table.participants')}
                        </span>
                      </div>
                    </div>

                    {selectedClasse && selectedClasse.participants.length > 0 && (
                      <div className="mb-4">
                        <div className="relative">
                          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Rechercher un participant par nom ou email..."
                            value={participantSearch}
                            onChange={(e) => setParticipantSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none text-sm dark:text-white transition-all"
                          />
                        </div>
                      </div>
                    )}

                    {!selectedClasse ? (
                      <p className="text-sm text-slate-500 dark:text-slate-400 italic">Choisissez une classe pour afficher ses participants.</p>
                    ) : selectedClasse.participants.length === 0 ? (
                      <p className="text-sm text-slate-500 dark:text-slate-400 italic">Aucun participant dans cette classe.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                        {selectedClasse.participants
                          .filter(p => 
                            `${p.nom} ${p.prenom}`.toLowerCase().includes(participantSearch.toLowerCase()) || 
                            p.email.toLowerCase().includes(participantSearch.toLowerCase())
                          )
                          .map((participant) => (
                            <label key={participant.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer group ${
                              sessionForm.participantIds.includes(participant.id)
                                ? 'bg-blue-50/50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                                : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-200'
                            }`}>
                            <div className="relative flex items-center">
                              <input 
                                type="checkbox" 
                                checked={sessionForm.participantIds.includes(participant.id)} 
                                onChange={() => toggleParticipant(participant.id)} 
                                className="w-5 h-5 rounded-md border-2 border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-600 transition-all cursor-pointer" 
                              />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-blue-700 transition-colors">
                                {participant.nom} {participant.prenom}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium">
                                {participant.email}
                              </span>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button type="submit" disabled={savingSession} className="inline-flex items-center justify-center gap-2 bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-200 dark:shadow-none hover:bg-red-600 disabled:opacity-60 transition-all">
                      {savingSession ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                      {editingSessionId ? 'Enregistrer les modifications' : 'Enregistrer la session'}
                    </button>
                    {editingSessionId && (
                      <button type="button" onClick={resetSessionForm} className="inline-flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-6 py-3 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
                        Annuler la modification
                      </button>
                    )}
                  </div>
                </form>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <StatCard icon={<Users className="text-blue-700 w-8 h-8" />} title="Participants" value={data.totalParticipants} color="bg-blue-50 dark:bg-blue-900/20" />
              <StatCard icon={<UserCheck className="text-emerald-600 w-8 h-8" />} title="Enseignants" value={data.totalEnseignants} color="bg-emerald-50 dark:bg-emerald-900/20" />
              <StatCard icon={<ShieldCheck className="text-purple-600 w-8 h-8" />} title="Administrateurs" value={data.totalAdministrateurs} color="bg-purple-50 dark:bg-purple-900/20" />
              <StatCard icon={<CalendarDays className="text-amber-600 w-8 h-8" />} title="Sessions" value={data.totalSessions} color="bg-amber-50 dark:bg-amber-900/20" />
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-3 w-full md:w-1/2">
                  <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Rechercher une session, un utilisateur..."
                      value={globalSearch}
                      onChange={(e) => setGlobalSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none dark:text-white transition-all"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <select
                    value={filterClasse}
                    onChange={(e) => setFilterClasse(e.target.value)}
                    className="w-full md:w-48 px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none dark:text-white transition-all text-sm font-semibold"
                  >
                    <option value="">Toutes les classes</option>
                    {data.classes.map((c) => (
                      <option key={c.id} value={c.nom}>{c.nom}</option>
                    ))}
                  </select>
                  {(globalSearch || filterClasse) && (
                    <button
                      onClick={() => { setGlobalSearch(''); setFilterClasse(''); }}
                      className="text-sm font-bold text-red-600 hover:text-red-700 whitespace-nowrap"
                    >
                      Effacer les filtres
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-6 h-6 text-purple-600" />
                  {t('admin.users.admins')}
                </h2>
                <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold">Max: 5</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase text-xs tracking-wider">
                    <tr><th className="px-6 py-4">Nom complet</th><th className="px-6 py-4">Email</th><th className="px-6 py-4">Statut</th><th className="px-6 py-4 text-right">Actions</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredAdministrateurs.map((admin) => (
                      <tr key={admin.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200">{admin.nom} {admin.prenom} {admin.id === 1 && <span className="ml-2 text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded uppercase">Principal</span>}</td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{admin.email}</td>
                        <td className="px-6 py-4"><span className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-full text-xs font-bold">{admin.statut}</span></td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => startEditUser(admin)} className="text-amber-600 hover:text-amber-700 p-2 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-all" title="Modifier cet administrateur">
                              <Edit className="w-5 h-5" />
                            </button>
                            {admin.id !== 1 && (
                              <button onClick={() => handleDeleteUser(admin)} className="text-rose-600 hover:text-rose-700 p-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all" title="Supprimer cet administrateur">
                                <Trash2 className="w-5 h-5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2"><CalendarDays className="w-6 h-6 text-amber-600" />Sessions creees</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">L’administrateur peut consulter, modifier ou supprimer les sessions.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase text-xs tracking-wider">
                    <tr><th className="px-6 py-4">Titre</th><th className="px-6 py-4">Début</th><th className="px-6 py-4">Fin</th><th className="px-6 py-4">Classe</th><th className="px-6 py-4">Enseignant</th><th className="px-6 py-4">Participants</th><th className="px-6 py-4 text-right">Actions</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredSessionsList.length > 0 ? filteredSessionsList.map((session) => (
                      <tr key={session.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200">{session.titre}</td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">{session.dateDebut}</td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">{session.dateFin}</td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{session.classe}</td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{session.enseignant}</td>
                        <td className="px-6 py-4"><span className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-3 py-1 rounded-full text-xs font-bold">{session.nombreParticipants}</span></td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button type="button" onClick={() => startEditSession(session)} className="inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 px-3 py-2 rounded-lg font-bold hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-all">
                              <Edit className="w-4 h-4" /> Modifier
                            </button>
                            <button type="button" disabled={deletingSessionId === session.id} onClick={() => handleDeleteSession(session)} className="inline-flex items-center gap-1 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 px-3 py-2 rounded-lg font-bold hover:bg-rose-100 dark:hover:bg-rose-900/40 disabled:opacity-60 transition-all">
                              {deletingSessionId === session.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Supprimer
                            </button>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan={7} className="px-6 py-10 text-center text-slate-400 italic">Aucune session creee pour le moment.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden transition-colors">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800"><h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2"><GraduationCap className="w-6 h-6 text-blue-700" />{t('admin.users.participants')}</h2></div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredClassesList.map((classe) => (
                  <div key={classe.id} className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4"><h3 className="text-lg font-extrabold text-slate-800 dark:text-white">{classe.nom}</h3><span className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-4 py-2 rounded-full text-sm font-bold w-fit">{classe.nombreParticipants} participant(s)</span></div>
                    <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
                      <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300"><thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase text-xs tracking-wider"><tr><th className="px-4 py-3">Nom complet</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Groupe</th><th className="px-4 py-3">Statut</th><th className="px-4 py-3 text-right">Actions</th></tr></thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {classe.participants.length > 0 ? classe.participants.map((participant) => (
                            <tr key={participant.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                              <td className="px-4 py-3 font-bold text-slate-700 dark:text-slate-200">{participant.nom} {participant.prenom}</td>
                              <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{participant.email}</td>
                              <td className="px-4 py-3">
                                {participant.groupe === 'Aucun groupe' ? (
                                  <span className="bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700">Libre</span>
                                ) : (
                                  <span className="text-blue-700 dark:text-blue-400 font-bold">{participant.groupe}</span>
                                )}
                              </td>
                              <td className="px-4 py-3"><span className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-full text-xs font-bold">{participant.statut}</span></td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex justify-end gap-2">
                                  <button onClick={() => startEditUser(participant)} className="text-amber-600 hover:text-amber-700 p-2 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-all" title="Modifier cet apprenant"><Edit className="w-5 h-5" /></button>
                                  <button onClick={() => handleDeleteUser(participant)} className="text-rose-600 hover:text-rose-700 p-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all"><Trash2 className="w-5 h-5" /></button>
                                </div>
                              </td>
                            </tr>
                          )) : (<tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400 italic">Aucun participant dans cette classe.</td></tr>)}
                        </tbody></table>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden transition-colors">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800"><h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-3"><UserCheck className="w-6 h-6 text-emerald-600" />{t('admin.users.teachers')}</h2></div>
              <div className="overflow-x-auto"><table className="w-full text-left text-sm text-slate-700 dark:text-slate-300"><thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase text-xs tracking-wider"><tr><th className="px-6 py-4">Nom complet</th><th className="px-6 py-4">Email</th><th className="px-6 py-4">Classe</th><th className="px-6 py-4">Statut</th><th className="px-6 py-4 text-right">Actions</th></tr></thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">{filteredEnseignantsList.length > 0 ? filteredEnseignantsList.map((enseignant) => (<tr key={enseignant.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"><td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2"><UserCheck className="w-4 h-4 text-emerald-600" />{enseignant.nom} {enseignant.prenom}</td><td className="px-6 py-4 text-slate-600 dark:text-slate-400"><span className="inline-flex items-center gap-2"><Mail className="w-4 h-4 text-slate-400" /> {enseignant.email}</span></td><td className="px-6 py-4 text-slate-600 dark:text-slate-400">{enseignant.classe}</td><td className="px-6 py-4"><span className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-full text-xs font-bold">{enseignant.statut}</span></td><td className="px-6 py-4 text-right"><div className="flex justify-end gap-2"><button onClick={() => startEditUser(enseignant)} className="text-amber-600 hover:text-amber-700 p-2 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-all" title="Modifier cet enseignant"><Edit className="w-5 h-5" /></button><button onClick={() => handleDeleteUser(enseignant)} className="text-rose-600 hover:text-rose-700 p-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all"><Trash2 className="w-5 h-5" /></button></div></td></tr>)) : (<tr><td colSpan={5} className="px-6 py-10 text-center text-slate-400 italic">Aucun enseignant ne correspond à votre recherche.</td></tr>)}</tbody>
              </table></div>
            </div>

            {/* Modal de modification utilisateur */}
            {editingUser && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-8 border border-slate-100 dark:border-slate-800 transition-all">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                      <Edit className="w-5 h-5 text-amber-600" />
                      Modifier le compte
                    </h2>
                    <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-600"><X /></button>
                  </div>
                  
                  <form onSubmit={handleSaveUser} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Prénom</label>
                        <input required value={userForm.prenom} onChange={(e) => setUserForm({...userForm, prenom: e.target.value})} className="mt-1 w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none dark:text-white" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Nom</label>
                        <input required value={userForm.nom} onChange={(e) => setUserForm({...userForm, nom: e.target.value})} className="mt-1 w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none dark:text-white" />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Email</label>
                      <input required type="email" value={userForm.email} onChange={(e) => setUserForm({...userForm, email: e.target.value})} className="mt-1 w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none dark:text-white" />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Nouveau mot de passe (laisser vide si inchangé)</label>
                      <input type="password" value={userForm.password} onChange={(e) => setUserForm({...userForm, password: e.target.value})} placeholder="••••••••" className="mt-1 w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none dark:text-white" />
                    </div>

                    {editingUser.role !== 'Administrateur' && (
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Classe</label>
                        <select value={userForm.classeId} onChange={(e) => setUserForm({...userForm, classeId: e.target.value})} className="mt-1 w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none dark:text-white">
                          <option value="">Choisir une classe...</option>
                          {data.classes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
                        </select>
                      </div>
                    )}

                    <div className="pt-4 flex flex-col gap-2">
                      <button type="submit" className="w-full bg-blue-700 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-emerald-600 transition-all">Enregistrer les modifications</button>
                      <button type="button" onClick={() => setEditingUser(null)} className="w-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 py-3 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">Annuler</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, title, value, color }: { icon: React.ReactNode; title: string; value: number; color: string }) {
  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-5 transition-colors">
      <div className={`${color} p-4 rounded-xl transition-colors`}>{icon}</div>
      <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider transition-colors">{title}</p>
        <p className="text-2xl font-bold text-slate-800 dark:text-white transition-colors">{value}</p>
      </div>
    </div>
  );
}

export default AdminHomePage;
