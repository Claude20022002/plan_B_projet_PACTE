import { type FormEvent, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/apiClient';
import ThemeToggle from '../components/ThemeToggle';
import LanguageToggle from '../components/LanguageToggle';
import { useTranslation } from 'react-i18next';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  GraduationCap,
  Loader2,
  Lock,
  Mail,
} from 'lucide-react';

const LoginPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await apiClient.post('/login', formData);
      const { role } = res.data;

      // Stocker l'utilisateur pour les autres pages
      localStorage.setItem('user', JSON.stringify(res.data));

      setMessage({ type: 'success', text: 'Connexion réussie !' });

      // Redirection selon le rôle
      setTimeout(() => {
        if (role === 'Administrateur') {
          navigate('/admin');
        } else if (role === 'Enseignant') {
          navigate('/dashboard');
        } else if (role === 'Participant') {
          navigate('/participant');
        } else {
          navigate('/'); 
        }
      }, 1000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Identifiants invalides.' });
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
                // Fallback to icon if image fails to load
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement!.classList.add('bg-blue-700', 'flex', 'items-center', 'justify-center');
                const icon = document.createElement('div');
                icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-graduation-cap"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v5"/></svg>';
                e.currentTarget.parentElement!.appendChild(icon.firstChild!);
              }}
            />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">HESTIM</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">{t('login.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">{t('login.email')}</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-slate-400 dark:text-slate-500 w-5 h-5" />
              <input
                type="email"
                placeholder="jean.dupont@hestim.ma"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all dark:text-white dark:placeholder:text-slate-500"
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
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all dark:text-white dark:placeholder:text-slate-500"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>

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
                {t('login.loading')}
              </>
            ) : (
              <>
                {t('login.submit')} <ArrowRight className="ml-2 w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {t('login.noAccount')}{' '}
            <Link to="/register" className="text-red-600 dark:text-red-400 font-bold hover:underline">
              {t('login.register')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;