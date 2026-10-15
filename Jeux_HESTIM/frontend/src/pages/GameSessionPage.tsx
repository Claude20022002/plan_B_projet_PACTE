import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '../api/apiClient';
import ThemeToggle from '../components/ThemeToggle';
import LanguageToggle from '../components/LanguageToggle';
import socketService from '../api/socketService';
import { useTranslation } from 'react-i18next';
import ReactikV2Module from '../components/ReactikV2Module';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Gamepad2,
  Loader2,
  LogOut,
  Users,
} from 'lucide-react';

type Member = {
  id: number;
  nom: string;
  prenom: string;
};

type GroupInfo = {
  nom: string;
  membres: Member[];
  progression: string;
};

const GameSessionPage = () => {
  const { t } = useTranslation();
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);
  const [teamComment, setTeamComment] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);
  const [groupeId, setGroupeId] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const userString = localStorage.getItem('user');
    if (!userString) {
      navigate('/');
      return;
    }
    const userData = JSON.parse(userString);
    setUser(userData);

    fetchSessionAndGroupData(userData.id);

    socketService.connect();
    
    socketService.on('progression_updated', (data) => {
      setGroupInfo(prev => prev ? { ...prev, progression: `${data.progression}%` } : null);
    });

    socketService.on('comment_updated', (data) => {
      setTeamComment(data.commentaire);
    });

    socketService.on('session_ended', (data) => {
      if (Number(data.sessionId) === Number(sessionId)) {
        alert(t('Cette session a été clôturée.'));
        navigate('/participant');
      }
    });

    return () => {
      socketService.off('progression_updated');
      socketService.off('comment_updated');
      socketService.off('session_ended');
    };
  }, [sessionId, navigate]);

  const fetchSessionAndGroupData = async (userId: number) => {
    try {
      setLoading(true);
      const sessionRes = await apiClient.get(`/sessions/${sessionId}`);
      setSession(sessionRes.data);
      console.log('Session loaded:', sessionRes.data);

      const contextRes = await apiClient.get(`/chat/context/${userId}`);
      console.log('Context loaded:', contextRes.data);
      
      if (contextRes.data && contextRes.data.groupeId) {
        setGroupeId(contextRes.data.groupeId);
        setTeamComment(contextRes.data.commentaireAnimateur || '');
        setGroupInfo({
          nom: contextRes.data.groupe,
          progression: contextRes.data.progression,
          membres: contextRes.data.membresDuGroupe.map((name: string, index: number) => ({
            id: index,
            nom: name.split(' ')[0],
            prenom: name.split(' ')[1] || ''
          }))
        });
      } else {
        setError(t('common.error'));
      }
    } catch (err) {
      console.error('Erreur chargement session', err);
      setError(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  const handlePlayClick = () => {
    console.log('Play button clicked. isPlaying will be true. Session game:', session?.jeu);
    setIsPlaying(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-700 dark:text-slate-300">
        <div className="flex items-center gap-3 font-bold">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          {t('common.loading')}
        </div>
      </div>
    );
  }

  if (error || !groupInfo) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 max-w-md w-full text-center">
          <div className="bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 font-black text-2xl">!</div>
          <h2 className="text-xl font-black text-slate-800 dark:text-white mb-2">Attention</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6 font-medium">{error}</p>
          <button
            onClick={() => navigate('/participant')}
            className="w-full bg-blue-700 text-white py-3 rounded-xl font-bold hover:bg-red-600 transition-all shadow-lg"
          >
            {t('nav.participant')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <nav className="bg-white dark:bg-slate-900 border-b-2 border-red-600 sticky top-0 z-10 shadow-sm transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <button 
              onClick={() => isPlaying ? setIsPlaying(false) : navigate('/participant')}
              className="flex items-center gap-2 text-slate-500 hover:text-blue-700 font-bold transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>{isPlaying ? t('common.close') : t('session.leave')}</span>
            </button>
            <div className="flex items-center gap-4">
              <LanguageToggle />
              <ThemeToggle />
              <button onClick={handleLogout} className="text-slate-400 hover:text-red-600"><LogOut className="w-5 h-5" /></button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto p-4 sm:p-8 space-y-8">
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden transition-all">
          <div className="p-8 bg-blue-700 text-white flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <h1 className="text-3xl font-black">{session?.titre}</h1>
              <p className="text-blue-100 font-bold flex items-center gap-2 mt-1 uppercase tracking-wider text-xs">
                <Users className="w-4 h-4" /> {t('participant.modal.group')} : {groupInfo.nom}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] block mb-1 opacity-70">{t('session.myTeam')}</span>
              <span className="text-lg font-black">{groupInfo.membres.length} Participants</span>
            </div>
          </div>

          <div className="p-8 space-y-10">
            {isPlaying ? (
              <ReactikV2Module 
                sessionId={Number(sessionId)} 
                groupeId={groupeId || 1} 
                entrepriseNom={groupInfo?.nom || 'Votre Entreprise'} 
              />
            ) : (
              <div className="space-y-10">
                <div className="bg-red-50/50 dark:bg-red-950/20 border-2 border-red-100/50 dark:border-red-900/30 rounded-[2rem] p-10 text-center transition-colors shadow-inner">
                  <div className="bg-white dark:bg-slate-800 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-md border border-red-100 dark:border-red-900/30">
                    <Gamepad2 className="w-10 h-10 text-red-600" />
                  </div>
                  <h3 className="text-3xl font-black text-blue-900 dark:text-blue-400 tracking-tight">{session?.jeu}</h3>
                  
                  <div className="mt-8 max-w-md mx-auto bg-white dark:bg-slate-800 p-6 rounded-3xl border border-red-100 dark:border-red-900/20 shadow-sm">
                    <div className="flex justify-between text-xs font-black text-slate-500 uppercase tracking-widest mb-3 px-1">
                      <span>{t('session.progression')}</span>
                      <span className="text-red-600 dark:text-red-400 text-sm">{groupInfo.progression}</span>
                    </div>
                    <div className="w-full h-4 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden p-1">
                      <div 
                        className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out shadow-sm shadow-emerald-500/50" 
                        style={{ width: groupInfo.progression }}
                      />
                    </div>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-8 font-medium max-w-sm mx-auto leading-relaxed">
                    {t('session.ready')}
                  </p>
                </div>

                {teamComment && (
                  <div className="bg-amber-50 dark:bg-amber-950/20 border-l-4 border-amber-500 p-6 rounded-2xl transition-colors">
                    <h4 className="text-xs font-black text-amber-700 dark:text-amber-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" /> {t('session.animatorMessage')}
                    </h4>
                    <p className="text-lg text-slate-700 dark:text-slate-200 font-bold italic leading-tight">
                      "{teamComment}"
                    </p>
                  </div>
                )}

                <div className="space-y-6">
                  <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2 ml-1">
                    <Users className="w-4 h-4 text-blue-700" /> {t('session.teammates')}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {groupInfo.membres.map((membre, idx) => (
                      <div key={idx} className="bg-white dark:bg-slate-800/50 p-4 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 flex items-center gap-4 transition-all hover:shadow-md group">
                        <div className="bg-slate-50 dark:bg-slate-900 w-12 h-12 rounded-2xl flex items-center justify-center text-red-600 font-black border border-slate-100 dark:border-slate-800 group-hover:scale-110 transition-transform">
                          {membre.nom[0]}
                        </div>
                        <div>
                          <p className="font-black text-slate-800 dark:text-slate-200">{membre.nom} {membre.prenom}</p>
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">{t('session.teammate')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-10">
                  <button 
                    onClick={handlePlayClick}
                    className="w-full bg-blue-700 text-white py-5 rounded-[2rem] font-black text-xl shadow-2xl shadow-blue-200 dark:shadow-none hover:bg-red-600 active:scale-[0.98] transition-all flex items-center justify-center gap-4 group"
                  >
                    {t('session.playNow')}
                    <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default GameSessionPage;
