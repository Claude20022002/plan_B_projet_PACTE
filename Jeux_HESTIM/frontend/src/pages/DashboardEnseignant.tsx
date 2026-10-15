import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import {
  AlertCircle,
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Gamepad2,
  LayoutDashboard,
  Loader2,
  LogOut,
  RefreshCw,
  Save,
  Shuffle,
  TrendingUp,
  Users,
  Users2,
  Trash2,
} from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import LanguageToggle from '../components/LanguageToggle';
import socketService from '../api/socketService';
import { useTranslation } from 'react-i18next';

const DashboardEnseignant = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<any[]>([]);
  const [groupComments, setGroupComments] = useState<{ [key: number]: string }>({});
  const [sessions, setSessions] = useState<any[]>([]);
  const [teacherInfo, setTeacherInfo] = useState<any | null>(null);
  const [selectedSession, setSelectedSession] = useState<any | null>(null);
  const [availableGroups, setAvailableGroups] = useState<any[]>([]);
  const [groupAssignments, setGroupAssignments] = useState<{ [key: number]: number }>({});
  const [alerts, setAlerts] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const userString = localStorage.getItem('user');
    if (!userString) {
      navigate('/');
      return;
    }
    const user = JSON.parse(userString);
    fetchDashboardData(user.id);

    socketService.connect();
    
    socketService.on('session_created', (data) => {
      console.log('Nouvelle session assignée:', data);
      fetchDashboardData(user.id);
    });

    return () => {
      socketService.off('session_created');
    };
  }, [navigate]);

  const fetchDashboardData = async (userId: number) => {
    setLoading(true);
    try {
      const teacherRes = await apiClient.get(`/enseignant/dashboard/${userId}`);
      const user = teacherRes.data.user;
      setTeacherInfo(user);
      setSessions(teacherRes.data.sessions);

      const [summaryRes, alertsRes] = await Promise.all([
        apiClient.get('/chat/animateur-summary', { params: { classeId: user.classeId } }),
        apiClient.get('/chat/animateur-alertes'),
      ]);
      setSummary(summaryRes.data);
      const comments: { [key: number]: string } = {};
      summaryRes.data.forEach((g: any) => {
        comments[g.id] = g.commentaire || '';
      });
      setGroupComments(comments);
      setAlerts(alertsRes.data);
    } catch (err) {
      console.error('Erreur chargement dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveComment = async (groupId: number) => {
    try {
      await apiClient.post(`/groupes/${groupId}/commentaire`, { commentaire: groupComments[groupId] });
      setMessage({ type: 'success', text: 'Commentaire enregistré avec succès !' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error('Erreur enregistrement commentaire', err);
      setMessage({ type: 'error', text: 'Erreur lors de l’enregistrement du commentaire.' });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  const handleLaunchSession = async (sessionId: number) => {
    setActionLoading(true);
    try {
      const [sessionRes, groupsRes] = await Promise.all([
        apiClient.get(`/sessions/${sessionId}`),
        apiClient.get('/groupes'),
      ]);
      
      const sessionData = sessionRes.data;
      setSelectedSession(sessionData);
      setAvailableGroups(groupsRes.data);
      
      const initialAssignments: { [key: number]: number } = {};
      if (sessionData.participants) {
        sessionData.participants.forEach((p: any) => {
          if (p.groupeId) initialAssignments[p.id] = p.groupeId;
        });
      }
      setGroupAssignments(initialAssignments);
    } catch (err) {
      console.error('Erreur lancement session', err);
      setMessage({ type: 'error', text: 'Impossible de charger les détails de la session.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveFromGroup = async (userId: number) => {
    if (!window.confirm("Voulez-vous vraiment retirer ce participant de son groupe ?")) return;
    
    setActionLoading(true);
    try {
      await apiClient.post(`/users/${userId}/remove-from-group`);
      
      setGroupAssignments(prev => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });

      if (selectedSession) {
        setSelectedSession({
          ...selectedSession,
          participants: selectedSession.participants.map((p: any) => 
            p.id === userId ? { ...p, groupeId: null, groupeNom: 'Aucun' } : p
          )
        });
      }

      setMessage({ type: 'success', text: 'Participant retiré du groupe avec succès !' });
    } catch (err) {
      console.error('Erreur retrait groupe', err);
      setMessage({ type: 'error', text: 'Erreur lors du retrait du groupe.' });
    } finally {
      setActionLoading(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleAssignGroup = (userId: number, groupeId: number) => {
    setGroupAssignments(prev => ({ ...prev, [userId]: groupeId }));
  };

  const handleSaveAssignments = async () => {
    if (!selectedSession) return;
    setActionLoading(true);
    try {
      const assignments = Object.entries(groupAssignments).map(([userId, groupeId]) => ({
        userId: Number(userId),
        groupeId: Number(groupeId),
      }));
      await apiClient.post(`/sessions/${selectedSession.id}/assign-groups`, { assignments });
      setMessage({ type: 'success', text: 'Groupes enregistrés avec succès !' });
      setSelectedSession(null);
      
      const user = JSON.parse(localStorage.getItem('user')!);
      fetchDashboardData(user.id);
    } catch (err) {
      console.error('Erreur enregistrement groupes', err);
      setMessage({ type: 'error', text: 'Erreur lors de l’enregistrement des groupes.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAutoAssign = async () => {
    if (!teacherInfo?.classeId) {
      setMessage({ type: 'error', text: "Impossible de déterminer votre classe pour la répartition." });
      return;
    }
    
    if (!window.confirm(`Voulez-vous répartir automatiquement tous les étudiants de la classe "${teacherInfo.classeNom}" dans les groupes d'entreprises ?`)) return;

    setActionLoading(true);
    try {
      await apiClient.post(`/auto-assign/${teacherInfo.classeId}`);
      setMessage({ type: 'success', text: 'Répartition automatique réussie !' });
      const userString = localStorage.getItem('user');
      if (userString) {
        const user = JSON.parse(userString);
        fetchDashboardData(user.id);
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Erreur lors de la répartition.' });
    } finally {
      setActionLoading(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-700 dark:text-slate-300 transition-colors duration-300">
        <div className="flex items-center gap-3 font-bold">
          <Loader2 className="w-6 h-6 animate-spin text-blue-700" />
          Chargement du tableau de bord...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-blue-700 shadow-md transition-colors">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight flex items-center gap-3 transition-colors">
              Tableau de Bord Enseignant
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium transition-colors">Suivi de la session pédagogique en temps réel</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <LanguageToggle />
          <ThemeToggle />
          <button
            onClick={handleAutoAssign}
            disabled={actionLoading}
            className="flex items-center justify-center gap-2 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-2 border-slate-200 dark:border-slate-800 px-6 py-3 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-50 w-full sm:w-auto"
          >
            {actionLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <Shuffle className="w-5 h-5 text-blue-700" />}
            Répartir Groupes
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border-2 border-red-100 dark:border-red-900/30 px-6 py-3 rounded-xl font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition-all shadow-sm shadow-red-50 dark:shadow-none w-full sm:w-auto"
          >
            <LogOut className="w-5 h-5" />
            Déconnexion
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-8">
        {message && (
          <div className={`flex items-center gap-2 p-4 rounded-xl text-sm font-medium border transition-colors ${message.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900' : 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900'}`}>
            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-5 transition-colors">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl transition-colors">
              <Users className="text-blue-700 w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider transition-colors">Total Étudiants</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-white transition-colors">{summary.reduce((acc, curr) => acc + curr.effectif, 0)}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-5 transition-colors">
            <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-xl transition-colors">
              <Users2 className="text-red-600 w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider transition-colors">Groupes Actifs</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-white transition-colors">4</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-5 transition-colors">
            <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl transition-colors">
              <TrendingUp className="text-orange-600 w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider transition-colors">Progression Moyenne</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-white transition-colors">
                {summary.length > 0 ? Math.round(summary.reduce((acc, curr) => acc + curr.scoreMoyen, 0) / summary.length) : 0}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 rounded-2xl p-4 flex items-center gap-3 shadow-sm shadow-orange-50 dark:shadow-none transition-colors duration-300">
          <AlertTriangle className="text-orange-600 w-5 h-5" />
          <p className="text-orange-800 dark:text-orange-400 text-sm font-medium transition-colors">{alerts}</p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3 transition-colors">
            <CalendarDays className="w-7 h-7 text-red-600" />
            Mes Sessions Assignées
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.length > 0 ? (
              sessions.map((session) => (
                <div key={session.id} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border-2 border-slate-50 dark:border-slate-800 hover:border-blue-700/30 dark:hover:border-blue-700/50 hover:shadow-md transition-all group overflow-hidden">
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start transition-colors">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Période</span>
                      <span className="text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 px-2 py-0.5 rounded border border-red-100 dark:border-red-900/30 transition-colors">
                        {session.dateDebut} au {session.dateFin}
                      </span>
                    </div>
                    <Gamepad2 className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-blue-700 transition-colors" />
                  </div>
                  <div className="p-5 space-y-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 dark:text-white group-hover:text-blue-700 transition-colors">{session.titre}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5 transition-colors">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-700" />
                        Classe : {session.classe}
                      </p>
                    </div>
                    <div className="pt-4 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between transition-colors">
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-tight transition-colors">Participants</span>
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 transition-colors">{session.nombreParticipants} inscrits</span>
                      </div>
                      <button 
                        onClick={() => handleLaunchSession(session.id)}
                        className="bg-blue-700 text-white text-sm font-bold px-6 py-2.5 rounded-xl hover:bg-red-600 transition-all shadow-lg shadow-blue-100 dark:shadow-none"
                      >
                        Lancer
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full bg-white dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-8 text-center text-slate-500 dark:text-slate-400 transition-colors">
                Aucune session ne vous a été assignée par l'administrateur.
              </div>
            )}
          </div>
        </div>

        {selectedSession && (
          <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-red-50 dark:border-slate-800 transition-colors">
              <div className="p-6 border-b-4 border-red-600 flex items-center justify-between bg-blue-700 text-white transition-colors">
                <div>
                  <h2 className="text-2xl font-bold">Lancement : {selectedSession.titre}</h2>
                  <p className="text-blue-50 font-medium">Affectation des participants aux groupes (Entreprises)</p>
                </div>
                <button 
                  onClick={() => setSelectedSession(null)}
                  className="p-2 hover:bg-blue-800 rounded-full transition-colors"
                >
                  <RefreshCw className="w-6 h-6 rotate-45" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-950/20 transition-colors">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedSession.participants && selectedSession.participants.length > 0 ? (
                    selectedSession.participants.map((p: any) => (
                      <div key={p.id} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-sm transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-50 dark:bg-blue-900/30 p-2 rounded-lg shadow-sm text-blue-700 dark:text-blue-400 font-bold border border-blue-100 dark:border-blue-900/50 transition-colors">
                            {p.prenom[0]}{p.nom[0]}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 dark:text-slate-100 transition-colors">{p.prenom} {p.nom}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-tight transition-colors">
                              Groupe actuel : <span className={p.groupeNom !== 'Aucun' ? 'text-red-600 dark:text-red-400' : 'text-slate-400 dark:text-slate-500 transition-colors'}>{p.groupeNom}</span>
                              {p.score !== undefined && <span className="ml-3 text-blue-600">| Score : {p.score}%</span>}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <select 
                            value={groupAssignments[p.id] || ""} 
                            onChange={(e) => handleAssignGroup(p.id, Number(e.target.value))}
                            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-700 outline-none transition-colors"
                          >
                            <option value="">Affecter à...</option>
                            {availableGroups.map((g: any) => (
                              <option key={g.id} value={g.id}>{g.nom}</option>
                            ))}
                          </select>
                          
                          {(groupAssignments[p.id] || p.groupeId) && (
                            <button 
                              onClick={() => handleRemoveFromGroup(p.id)}
                              className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all"
                              title="Retirer du groupe"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full py-12 text-center text-slate-500 dark:text-slate-400 italic">
                      Aucun participant inscrit dans cette session.
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-end gap-3 transition-colors">
                <button 
                  onClick={() => setSelectedSession(null)}
                  className="px-6 py-3 rounded-xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-slate-200 dark:border-slate-700"
                >
                  Annuler
                </button>
                <button 
                  onClick={handleSaveAssignments}
                  disabled={actionLoading}
                  className="bg-blue-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-blue-200 dark:shadow-none hover:bg-red-600 transition-all flex items-center gap-2"
                >
                  {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                  Valider et Commencer
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden transition-colors">
          <div className="p-6 border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 transition-colors flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white transition-colors">État des Groupes (Entreprises)</h3>
            <button 
              onClick={() => {
                const userString = localStorage.getItem('user');
                if (userString) {
                  const user = JSON.parse(userString);
                  fetchDashboardData(user.id);
                }
              }}
              disabled={loading}
              className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-all text-blue-700 dark:text-blue-400"
              title="Rafraîchir les scores"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider transition-colors">
                <tr>
                  <th className="px-6 py-4 font-semibold">Nom de l'Entreprise</th>
                  <th className="px-6 py-4 font-semibold text-center">Effectif</th>
                  <th className="px-6 py-4 font-semibold">Score Moyen</th>
                  <th className="px-6 py-4 font-semibold">Commentaire (Privé au groupe)</th>
                  <th className="px-6 py-4 font-semibold">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 transition-colors">
                {summary.length > 0 ? summary.map((g: any) => (
                  <tr key={g.nom} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200 transition-colors">{g.nom}</td>
                    <td className="px-6 py-4 text-center transition-colors">
                      <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-3 py-1 rounded-full text-xs font-bold border border-blue-100 dark:border-blue-900/50 transition-colors">
                        {g.effectif} étudiants
                      </span>
                    </td>
                    <td className="px-6 py-4 transition-colors">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden transition-colors">
                          <div className="h-full bg-blue-700 transition-all" style={{ width: `${g.scoreMoyen}%` }}></div>
                        </div>
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 transition-colors">{Math.round(g.scoreMoyen)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 transition-colors">
                      <div className="flex items-center gap-2 min-w-[200px]">
                        <input
                          type="text"
                          value={groupComments[g.id] || ''}
                          onChange={(e) => setGroupComments({ ...groupComments, [g.id]: e.target.value })}
                          placeholder="Note pour ce groupe..."
                          className="flex-1 text-xs px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-blue-600 outline-none dark:text-white"
                        />
                        <button
                          onClick={() => handleSaveComment(g.id)}
                          className="p-2 bg-blue-700 text-white rounded-lg hover:bg-red-600 transition-colors"
                          title="Enregistrer le commentaire"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 transition-colors">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                        g.effectif > 0 
                          ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50' 
                          : 'bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-slate-800'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${g.effectif > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                        {g.effectif > 0 ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-slate-400 dark:text-slate-500 italic transition-colors">
                      Aucun groupe n'est actuellement actif.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardEnseignant;