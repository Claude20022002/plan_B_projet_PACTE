import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import ThemeToggle from '../components/ThemeToggle';
import LanguageToggle from '../components/LanguageToggle';
import socketService from '../api/socketService';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  Gamepad2,
  GraduationCap,
  LayoutDashboard,
  Loader2,
  LogOut,
  User,
  Users
} from 'lucide-react';

type Session = {
  id: number;
  titre: string;
  dateDebut: string;
  dateFin: string;
  statut: string;
  enseignant: string;
  jeu: string;
};

type ParticipantData = {
  user: {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    classe: string;
    matiere: string;
    groupe: string;
    commentaireAnimateur: string;
  };
  sessions: Session[];
};

function ParticipantHomePage() {
  const { t } = useTranslation();
  const [data, setData] = useState<ParticipantData | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const userString = localStorage.getItem('user');
    if (!userString) {
      navigate('/');
      return;
    }

    const user = JSON.parse(userString);
    fetchParticipantData(user.id);

    // Initialisation WebSocket
    socketService.connect();
    
    // Écouter les mises à jour de groupe en temps réel
    socketService.on('group_updated', (data) => {
      console.log('Mise à jour groupe reçue:', data);
      fetchParticipantData(user.id);
    });

    socketService.on('comment_updated', (data) => {
      console.log('Nouveau commentaire animateur:', data);
      fetchParticipantData(user.id);
    });

    return () => {
      socketService.off('group_updated');
      socketService.off('comment_updated');
    };
  }, [navigate]);

  const fetchParticipantData = async (userId: number) => {
    try {
      const res = await apiClient.get(`/participant/dashboard/${userId}`);
      setData(res.data);
    } catch (err) {
      console.error('Erreur chargement espace participant', err);
      setError(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  const handleJoinSession = async (session: Session) => {
    if (session.statut === 'Terminée') {
      alert("Cette session est terminée. Veuillez attendre que l'enseignant la relance pour y rejouer à nouveau.");
      return;
    }

    setJoining(true);
    try {
      const userString = localStorage.getItem('user');
      const user = JSON.parse(userString!);
      
      const res = await apiClient.get(`/chat/context/${user.id}`);
      
      if (res.data && res.data.groupe !== 'Aucun') {
        navigate(`/session/${session.id}`);
      } else {
        alert(t('common.error'));
      }
    } catch (err) {
      console.error('Erreur lors de la tentative de rejoindre la session', err);
      alert(t('common.error'));
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-700 dark:text-slate-300 transition-colors duration-300">
        <div className="flex items-center gap-3 font-bold">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          {t('common.loading')}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors duration-300">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 max-w-md w-full text-center transition-colors">
          <div className="bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <LayoutDashboard className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{t('common.error')}</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">{error || 'Session expirée'}</p>
          <button
            onClick={handleLogout}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 dark:shadow-none"
          >
            {t('login.submit')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* Top Navigation */}
      <nav className="bg-white dark:bg-slate-900 border-b-2 border-red-600 sticky top-0 z-10 shadow-sm transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-blue-700">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
              </div>
              <span className="text-xl font-bold text-slate-800 dark:text-white">HESTIM Jeux</span>
            </div>
            <div className="flex items-center gap-4">
              <LanguageToggle />
              <ThemeToggle />
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 font-semibold transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden sm:inline">{t('nav.logout')}</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Profile Header */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 sm:p-8 relative overflow-hidden transition-colors">
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-50 dark:bg-red-950/10 rounded-full -mr-32 -mt-32 opacity-30 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-50 dark:bg-blue-950/10 rounded-full -ml-24 -mb-24 opacity-30 pointer-events-none" />
          
          <div className="relative flex flex-col md:flex-row items-center gap-6">
            <div className="bg-blue-700 text-white w-24 h-24 rounded-2xl flex items-center justify-center shrink-0 border-4 border-white dark:border-slate-800 shadow-md transition-colors">
              <User className="w-12 h-12" />
            </div>
            <div className="text-center md:text-left space-y-1">
              <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white">
                {t('participant.welcome')}, {data.user.prenom} {data.user.nom} !
              </h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium flex items-center justify-center md:justify-start gap-2">
                <GraduationCap className="w-4 h-4 text-red-600" />
                {t('participant.role')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 pt-8 border-t border-slate-50 dark:border-slate-800">
            <InfoBox icon={<LayoutDashboard className="w-5 h-5" />} label={t('register.classe')} value={data.user.classe} />
            <InfoBox icon={<Users className="w-5 h-5" />} label={t('participant.modal.group')} value={data.user.groupe} />
          </div>

          {data.user.commentaireAnimateur && (
            <div className="mt-6 bg-amber-50 dark:bg-amber-950/20 border-l-4 border-amber-500 p-5 rounded-r-2xl transition-all animate-in slide-in-from-left duration-500">
              <h4 className="text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                <AlertTriangle className="w-3 h-3" /> {t('session.animatorMessage')}
              </h4>
              <p className="text-sm text-slate-700 dark:text-slate-200 font-bold italic leading-tight">
                "{data.user.commentaireAnimateur}"
              </p>
            </div>
          )}
        </div>

        {/* Sessions Section */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3 px-2">
            <CalendarDays className="w-7 h-7 text-red-600" />
            {t('participant.mySessions')}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.sessions.length > 0 ? (
              data.sessions.map((session) => (
                <div
                  key={session.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 hover:border-red-200 dark:hover:border-red-900/50 hover:shadow-md transition-all group overflow-hidden"
                >
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start transition-colors">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">{t('participant.period')}</span>
                      <span className="text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 px-2 py-0.5 rounded border border-red-100 dark:border-red-900/30">
                        {session.dateDebut} au {session.dateFin}
                      </span>
                    </div>
                    <Gamepad2 className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-blue-700 transition-colors" />
                  </div>
                  <div className="p-5 space-y-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 group-hover:text-red-600 transition-colors">
                        {session.titre}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {session.jeu}
                      </p>
                    </div>
                    
                    <div className="pt-4 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between transition-colors">
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-tight">{t('participant.animator')}</span>
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{session.enseignant}</span>
                      </div>
                      <button 
                        onClick={() => handleJoinSession(session)}
                        disabled={joining}
                        className="bg-blue-700 text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-red-600 transition-all shadow-sm flex items-center gap-2"
                      >
                        {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        {t('participant.rejoin')}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full bg-white dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-12 text-center space-y-3 transition-colors">
                <CalendarDays className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">{t('participant.noSessions')}</h3>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="max-w-7xl mx-auto p-8 text-center text-slate-400 dark:text-slate-600 text-sm font-medium transition-colors">
        &copy; {new Date().getFullYear()} HESTIM - Plateforme de Jeux Pédagogiques
      </footer>
    </div>
  );
}

function InfoBox({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-slate-50/50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center gap-4 transition-colors">
      <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg shadow-sm text-blue-600 dark:text-blue-400 transition-colors">
        {icon}
      </div>
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-base font-bold text-slate-700 dark:text-slate-300">{value}</p>
      </div>
    </div>
  );
}

export default ParticipantHomePage;
