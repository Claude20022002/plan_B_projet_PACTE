import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/apiClient';
import ThemeToggle from '../components/ThemeToggle';
import LanguageToggle from '../components/LanguageToggle';
import { useTranslation } from 'react-i18next';
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  User,
} from 'lucide-react';

type RoleUtilisateur = 'Administrateur' | 'Enseignant' | 'Participant (Apprenant)';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    password: '',
    role: 'Participant (Apprenant)' as RoleUtilisateur,
    classeId: '',
  });

  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isParticipant = formData.role === 'Participant (Apprenant)';

  useEffect(() => {
    apiClient.get('/classes')
      .then(res => setClasses(res.data))
      .catch(err => {
        console.error('Erreur chargement classes', err);
        setMessage({ type: 'error', text: 'Impossible de charger les classes. Vérifiez que le backend est lancé.' });
      });
  }, []);

  const handleRoleChange = (role: RoleUtilisateur) => {
    setFormData({
      ...formData,
      role,
      classeId: role === 'Participant (Apprenant)' ? formData.classeId : '',
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const payload: any = {
        nom: formData.nom,
        prenom: formData.prenom,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      };

      if (isParticipant) {
        payload.classeId = parseInt(formData.classeId);
      }

      await apiClient.post('/register', payload);
      setMessage({ type: 'success', text: `Inscription réussie en tant que ${formData.role} ! Votre compte est en attente de validation.` });

      if (formData.role === 'Administrateur') {
        setTimeout(() => navigate('/admin'), 1000);
      } else if (formData.role === 'Enseignant') {
        setTimeout(() => navigate('/dashboard'), 1000);
      } else if (formData.role === 'Participant (Apprenant)') {
        setTimeout(() => navigate('/participant'), 1000);
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Une erreur est survenue.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <div className="absolute top-6 right-6 flex items-center gap-3">
        <LanguageToggle />
        <ThemeToggle />
      </div>

      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-10 border border-slate-100 dark:border-slate-800 transition-colors">
        <div className="text-center mb-10">
          <div className="mx-auto mb-4 w-24 h-24 rounded-full overflow-hidden border-4 border-blue-700 shadow-lg shadow-blue-200 dark:shadow-blue-900/20">
            <img 
              src="/logo.png" 
              alt="HESTIM Logo" 
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement!.classList.add('bg-blue-700', 'flex', 'items-center', 'justify-center');
                const icon = document.createElement('div');
                icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-graduation-cap"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v5"/></svg>';
                e.currentTarget.parentElement!.appendChild(icon.firstChild!);
              }}
            />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">HESTIM</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">{t('register.title')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">{t('register.nom')}</label>
            <div className="relative">
              <User className="absolute left-3 top-3 text-slate-400 dark:text-slate-500 w-5 h-5" />
              <input
                type="text"
                placeholder="Ex: Dupont"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-700 focus:border-transparent outline-none transition-all dark:text-white dark:placeholder:text-slate-500"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">{t('register.prenom')}</label>
            <div className="relative">
              <User className="absolute left-3 top-3 text-slate-400 dark:text-slate-500 w-5 h-5" />
              <input
                type="text"
                placeholder="Ex: Jean"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-700 focus:border-transparent outline-none transition-all dark:text-white dark:placeholder:text-slate-500"
                value={formData.prenom}
                onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">{t('login.email')}</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-slate-400 dark:text-slate-500 w-5 h-5" />
              <input
                type="email"
                placeholder="jean.dupont@hestim.ma"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-700 focus:border-transparent outline-none transition-all dark:text-white dark:placeholder:text-slate-500"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">{t('login.password')}</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-slate-400 dark:text-slate-500 w-5 h-5" />
              <input
                type="password"
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-700 focus:border-transparent outline-none transition-all dark:text-white dark:placeholder:text-slate-500"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">{t('register.role')}</label>
            <div className="relative">
              <ShieldCheck className="absolute left-3 top-3 text-slate-400 dark:text-slate-500 w-5 h-5" />
              <select
                required
                value={formData.role}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-700 outline-none appearance-none transition-all text-sm dark:text-white"
                onChange={(e) => handleRoleChange(e.target.value as RoleUtilisateur)}
              >
                <option value="Administrateur">Administrateur</option>
                <option value="Enseignant">Enseignant</option>
                <option value="Participant (Apprenant)">Participant (Apprenant)</option>
              </select>
            </div>
          </div>

          {isParticipant && (
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">{t('register.classe')}</label>
              <div className="relative">
                <GraduationCap className="absolute left-3 top-3 text-slate-400 dark:text-slate-500 w-5 h-5" />
                <select
                  required={isParticipant}
                  value={formData.classeId}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-700 outline-none appearance-none transition-all text-sm dark:text-white"
                  onChange={(e) => setFormData({ ...formData, classeId: e.target.value })}
                >
                  <option value="">Choisir...</option>
                  {classes.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.nom}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {message && (
            <div className={`flex items-center gap-2 p-3 rounded-xl text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'}`}>
              {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-700 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-200 dark:shadow-none flex items-center justify-center hover:bg-red-600 active:scale-[0.98] transition-all disabled:bg-blue-300 dark:disabled:bg-blue-900/50"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin mr-2 w-5 h-5" />
                {t('common.loading')}
              </>
            ) : (
              <>
                {t('register.submit')} <ArrowRight className="ml-2 w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {t('register.hasAccount')}{' '}
            <Link to="/" className="text-red-600 dark:text-red-400 font-bold hover:underline">
              {t('register.login')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
