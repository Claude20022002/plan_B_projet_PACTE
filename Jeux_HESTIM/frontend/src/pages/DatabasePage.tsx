import { ArrowLeft, Database, ExternalLink, Info, Server } from 'lucide-react';
import { Link } from 'react-router-dom';

const PHPMYADMIN_URL = 'http://localhost/phpmyadmin';

function DatabasePage() {
  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans text-slate-900">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Link to="/admin" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800 mb-4">
              <ArrowLeft className="w-4 h-4" /> Retour au tableau de bord
            </Link>
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
              <Database className="text-blue-600 w-8 h-8" />
              Base de données
            </h1>
            <p className="text-slate-500 mt-1">Accès rapide à phpMyAdmin pour consulter les tables MySQL.</p>
          </div>

          <a
            href={PHPMYADMIN_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all"
          >
            Ouvrir phpMyAdmin <ExternalLink className="w-5 h-5" />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-blue-50 p-3 rounded-xl">
                <Server className="text-blue-600 w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">Informations de connexion</h2>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
                <span className="font-semibold text-slate-500">Serveur</span>
                <span className="font-mono text-slate-800">localhost</span>
              </div>
              <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
                <span className="font-semibold text-slate-500">Utilisateur</span>
                <span className="font-mono text-slate-800">root</span>
              </div>
              <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
                <span className="font-semibold text-slate-500">Mot de passe</span>
                <span className="font-mono text-slate-800">vide par défaut avec XAMPP</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="font-semibold text-slate-500">Base</span>
                <span className="font-mono text-slate-800">jeux_hestim</span>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 rounded-2xl border border-amber-200 p-6">
            <div className="flex items-start gap-3">
              <Info className="text-amber-600 w-6 h-6 mt-1" />
              <div>
                <h2 className="text-xl font-bold text-amber-900 mb-2">Important</h2>
                <p className="text-amber-800 text-sm leading-6">
                  phpMyAdmin affiche uniquement les bases MySQL/MariaDB. Le backend a donc été préparé pour utiliser
                  MySQL avec la base <strong>jeux_hestim</strong>. Lancez Apache et MySQL dans XAMPP, puis ouvrez phpMyAdmin.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Étapes à suivre</h2>
          <ol className="list-decimal list-inside space-y-3 text-slate-700">
            <li>Démarrez <strong>Apache</strong> et <strong>MySQL</strong> dans XAMPP ou WAMP.</li>
            <li>Ouvrez phpMyAdmin avec le bouton bleu ci-dessus.</li>
            <li>Créez une base nommée <strong>jeux_hestim</strong> si elle n’existe pas.</li>
            <li>Lancez le backend : <code className="bg-slate-100 px-2 py-1 rounded">cd backend && npm run start:dev</code>.</li>
            <li>Les tables seront créées automatiquement par TypeORM.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

export default DatabasePage;
