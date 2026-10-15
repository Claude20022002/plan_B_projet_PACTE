import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import apiClient from '../api/apiClient';
import socketService from '../api/socketService';
import { useNavigate } from 'react-router-dom';
import {
  Factory,
  ArrowRight,
  TrendingDown,
  Globe2,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  ArrowDownWideArrow,
  PackageSearch,
  Zap
} from 'lucide-react';

interface ReactikV2ModuleProps {
  sessionId: number;
  groupeId: number;
  entrepriseNom: string;
}

const ReactikV2Module: React.FC<ReactikV2ModuleProps> = ({ sessionId, groupeId, entrepriseNom }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const PHASES = [
    { id: 0, label: "Introduction" },
    { id: 1, label: "L'Usine" },
    { id: 2, label: "Tracé des Flux" },
    { id: 3, label: "Performances" },
    { id: 4, label: "Anti-Flux" },
    { id: 5, label: "Gentil-Flux" },
    { id: 6, label: "Conquête du Monde" },
    { id: 7, label: "Bilan Final" }
  ];

  const SERVICES = [
    "Marketing", "Études", "Industrialisation", "Achats", 
    "Fournisseurs", "Débit", "Traitement", "Découpe", 
    "Vernis", "Assemblage", "Contrôle", "Expédition"
  ];

  const [selectedFlow, setSelectedFlow] = useState<string[]>([]);

  useEffect(() => {
    fetchGameState();
    socketService.on('reactik_state_updated', (newState) => {
      if (newState.groupe.id === groupeId) setGameState(newState);
    });
    return () => { socketService.off('reactik_state_updated'); };
  }, [sessionId, groupeId]);

  const fetchGameState = async () => {
    try {
      const res = await apiClient.get(`/reactik/state/${sessionId}/${groupeId}`);
      setGameState(res.data);
    } catch (err) {
      console.error('Error fetching Reactik state', err);
    } finally {
      setLoading(false);
    }
  };

  const nextPhase = async (customData?: any) => {
    try {
      const nextId = gameState.phase + 1;
      const res = await apiClient.post(`/reactik/update/${sessionId}/${groupeId}`, {
        phase: nextId,
        data: customData
      });
      setGameState(res.data);
    } catch (err) {
      console.error('Error updating phase', err);
    }
  };

  if (loading || !gameState) return <div className="flex justify-center p-12"><Zap className="animate-pulse text-blue-600" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Stepper */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-x-auto no-scrollbar">
        {PHASES.map((p, idx) => (
          <React.Fragment key={p.id}>
            <div className={`flex flex-col items-center gap-1 px-4 min-w-fit transition-all ${gameState.phase >= p.id ? 'opacity-100' : 'opacity-30'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${gameState.phase === p.id ? 'bg-blue-700 text-white ring-4 ring-blue-100 dark:ring-blue-900/30' : gameState.phase > p.id ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                {gameState.phase > p.id ? <CheckCircle2 className="w-4 h-4" /> : p.id + 1}
              </div>
              <span className="text-[9px] font-bold uppercase tracking-tighter whitespace-nowrap">{p.label}</span>
            </div>
            {idx < PHASES.length - 1 && <ChevronRight className="w-4 h-4 text-slate-200 shrink-0" />}
          </React.Fragment>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-xl min-h-[400px] flex flex-col transition-all">
        
        {/* Phase 0: Introduction */}
        {gameState.phase === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
            <div className="bg-blue-50 dark:bg-blue-950/30 p-6 rounded-[2rem]">
              <Factory className="w-16 h-16 text-blue-700" />
            </div>
            <h2 className="text-3xl font-black text-slate-800 dark:text-white">Bienvenue chez {entrepriseNom} !</h2>
            <p className="max-w-xl text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              Votre équipe prend les commandes d'une usine de fabrication de valises. 
              Votre mission : transformer une organisation chaotique en une "Lean Factory" performante.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-2xl mt-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Délai Actuel</p>
                <p className="text-lg font-black text-red-600">{gameState.delais} Jours</p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Stock</p>
                <p className="text-lg font-black text-red-600">{gameState.stocks} u.</p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Marché</p>
                <p className="text-lg font-black text-blue-700">{gameState.partsDeMarche}%</p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Statut</p>
                <p className="text-lg font-black text-emerald-500">Prêt</p>
              </div>
            </div>
            <button onClick={() => nextPhase()} className="mt-8 bg-blue-700 text-white px-10 py-4 rounded-2xl font-black text-lg shadow-xl shadow-blue-200 dark:shadow-none hover:bg-red-600 transition-all flex items-center gap-3 group">
              Commencer la Simulation <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
            </button>
          </div>
        )}

        {/* Phase 1: Comprendre l'usine */}
        {gameState.phase === 1 && (
          <div className="space-y-8 animate-in slide-in-from-right duration-500">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                  <PackageSearch className="w-8 h-8 text-red-600" /> Phase 1 : Plan de l'Usine
                </h2>
                <p className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wider mt-1">Identifiez les services de votre entreprise</p>
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/30 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[2rem] p-8 text-center">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {SERVICES.map(service => (
                  <div key={service} className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 font-black text-blue-900 dark:text-blue-400 hover:scale-105 transition-transform cursor-pointer text-sm">
                    {service}
                  </div>
                ))}
              </div>
              <p className="mt-8 text-slate-400 font-medium italic">Analysez la structure de votre usine de valises...</p>
            </div>
            <div className="flex justify-end pt-4">
              <button onClick={() => nextPhase()} className="bg-blue-700 text-white px-8 py-3 rounded-xl font-black shadow-lg hover:bg-red-600 transition-all flex items-center gap-2 group">
                Passer au Tracé des Flux <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        )}

        {/* Phase 2: Tracé des Flux */}
        {gameState.phase === 2 && (
          <div className="space-y-8 animate-in slide-in-from-right duration-500">
            <div>
              <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                <TrendingDown className="w-8 h-8 text-blue-700" /> Phase 2 : Tracé des Flux
              </h2>
              <p className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wider mt-1">Reconstituez l'ordre logique de production</p>
            </div>

            <div className="flex flex-wrap gap-2 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-2xl border border-blue-100 dark:border-blue-900/30">
              {selectedFlow.length === 0 ? (
                <p className="text-sm text-blue-600 dark:text-blue-400 font-bold italic p-2">Cliquez sur les services ci-dessous dans l'ordre du flux...</p>
              ) : (
                selectedFlow.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2 rounded-xl border border-blue-200 dark:border-blue-700 shadow-sm animate-in zoom-in duration-300">
                    <span className="text-blue-700 dark:text-blue-400 font-black text-xs">#{i+1}</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">{s}</span>
                    <button onClick={() => setSelectedFlow(selectedFlow.filter((_, idx) => idx !== i))} className="text-slate-300 hover:text-red-500 ml-1">×</button>
                  </div>
                ))
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {SERVICES.filter(s => !selectedFlow.includes(s)).map(service => (
                <button 
                  key={service} 
                  onClick={() => setSelectedFlow([...selectedFlow, service])}
                  className="p-4 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl font-bold text-slate-600 dark:text-slate-400 hover:border-blue-600 hover:text-blue-700 transition-all text-sm"
                >
                  {service}
                </button>
              ))}
            </div>

            <div className="flex justify-between items-center pt-6 border-t border-slate-100 dark:border-slate-800">
              <button onClick={() => setSelectedFlow([])} className="text-slate-400 hover:text-red-600 font-bold text-xs uppercase tracking-widest">Réinitialiser</button>
              <button 
                onClick={() => nextPhase({ fluxData: selectedFlow })}
                disabled={selectedFlow.length < 5}
                className="bg-blue-700 text-white px-10 py-4 rounded-2xl font-black shadow-xl shadow-blue-200 dark:shadow-none hover:bg-emerald-600 disabled:opacity-50 transition-all flex items-center gap-2"
              >
                Valider le Flux <CheckCircle2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Phase 3: Calcul des Performances */}
        {gameState.phase === 3 && (
          <div className="space-y-10 animate-in slide-in-from-right duration-500 flex-1 flex flex-col">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-black text-slate-800 dark:text-white">Analyse des Performances</h2>
              <p className="text-slate-500 font-medium">Voici l'état actuel de votre chaîne de valeur après analyse des flux.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto w-full">
              <div className="bg-rose-50 dark:bg-rose-950/20 p-8 rounded-[2.5rem] border-2 border-rose-100 dark:border-rose-900/30 text-center space-y-4">
                <div className="bg-white dark:bg-slate-800 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-sm text-rose-600">
                  <TrendingDown className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase text-rose-400 tracking-widest">Délais de Livraison</p>
                  <p className="text-5xl font-black text-rose-600 tracking-tighter mt-1">{gameState.delais} Jours</p>
                </div>
                <p className="text-[10px] font-bold text-rose-400 bg-rose-100/50 dark:bg-rose-900/40 py-1 px-3 rounded-full inline-block uppercase">Performance Critique</p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/20 p-8 rounded-[2.5rem] border-2 border-blue-100 dark:border-blue-900/30 text-center space-y-4">
                <div className="bg-white dark:bg-slate-800 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-sm text-blue-600">
                  <PackageSearch className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase text-blue-400 tracking-widest">Niveau des Stocks</p>
                  <p className="text-5xl font-black text-blue-700 tracking-tighter mt-1">{gameState.stocks} u.</p>
                </div>
                <p className="text-[10px] font-bold text-blue-400 bg-blue-100/50 dark:bg-blue-900/40 py-1 px-3 rounded-full inline-block uppercase">Coûts de possession élevés</p>
              </div>
            </div>

            <div className="mt-auto pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-col items-center gap-4">
              <p className="text-slate-400 font-bold text-xs uppercase tracking-widest italic">Action requise : Identifiez les points de blocage (Anti-Flux)</p>
              <button onClick={() => nextPhase()} className="bg-slate-900 text-white px-12 py-4 rounded-2xl font-black text-lg shadow-xl hover:bg-red-600 transition-all flex items-center gap-3">
                Traquer les Anti-Flux <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Phase 4: Identification des Anti-Flux */}
        {gameState.phase === 4 && (
          <div className="space-y-8 animate-in slide-in-from-right duration-500">
            <div>
              <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                <AlertCircle className="w-8 h-8 text-orange-500" /> Phase 4 : Traque des Anti-Flux
              </h2>
              <p className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wider mt-1">Identifiez le problème majeur de votre chaîne</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {[
                { id: 'F1', text: "Le fournisseur livre les matières premières une seule fois par semaine.", icon: "🚛" },
                { id: 'F2', text: "L'atelier d'assemblage attend toujours les pièces de la découpe.", icon: "⏳" },
                { id: 'F3', text: "Le service marketing change les prévisions tous les deux jours.", icon: "📊" },
                { id: 'F4', text: "Le stock de produits finis s'accumule en attendant le contrôle qualité.", icon: "📦" }
              ].map(problem => (
                <button 
                  key={problem.id}
                  onClick={() => nextPhase({ selectedAntiFlux: problem.id })}
                  className="p-6 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-3xl text-left hover:border-orange-500 hover:bg-orange-50/30 transition-all group flex items-center gap-6"
                >
                  <span className="text-4xl grayscale group-hover:grayscale-0 transition-all">{problem.icon}</span>
                  <p className="font-bold text-slate-700 dark:text-slate-200 group-hover:text-orange-600">{problem.text}</p>
                  <ChevronRight className="ml-auto w-6 h-6 text-slate-200 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Phase 5: Choix des Gentils-Flux */}
        {gameState.phase === 5 && (
          <div className="space-y-8 animate-in slide-in-from-right duration-500">
            <div>
              <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" /> Phase 5 : Solution Gentil-Flux
              </h2>
              <p className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wider mt-1">Appliquez une amélioration pour optimiser vos indicateurs</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { id: 'S1', title: "Flux Tiré", desc: "Produire uniquement ce que le client a commandé.", impact: "-5j de délais, -200u de stocks", delais: 10, stocks: 300 },
                { id: 'S2', title: "Juste à Temps", desc: "Livraisons quotidiennes du fournisseur selon les besoins.", impact: "-3j de délais, -300u de stocks", delais: 12, stocks: 200 },
                { id: 'S3', title: "Polyvalence", desc: "Former les ouvriers pour s'entraider entre les postes.", impact: "-6j de délais, -50u de stocks", delais: 9, stocks: 450 },
                { id: 'S4', title: "Auto-Contrôle", desc: "Vérifier la qualité à chaque étape plutôt qu'à la fin.", impact: "-4j de délais, -100u de stocks", delais: 11, stocks: 400 }
              ].map(solution => (
                <button 
                  key={solution.id}
                  onClick={() => nextPhase({ delais: solution.delais, stocks: solution.stocks })}
                  className="p-8 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[2.5rem] text-left hover:border-emerald-500 hover:bg-emerald-50/30 transition-all group space-y-3"
                >
                  <h3 className="text-xl font-black text-slate-800 dark:text-white group-hover:text-emerald-600">{solution.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-snug">{solution.desc}</p>
                  <div className="pt-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-100/50 dark:bg-emerald-900/30 px-3 py-1 rounded-full">{solution.impact}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Phase 6: Conquête du Monde */}
        {gameState.phase === 6 && (
          <div className="space-y-8 animate-in slide-in-from-right duration-500">
            <div>
              <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                <Globe2 className="w-8 h-8 text-blue-700" /> Phase 6 : Conquête du Monde
              </h2>
              <p className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wider mt-1">Vos indicateurs ouvrent les portes des marchés internationaux</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { id: 'MAROC', name: "Maroc", flag: "🇲🇦", target: 6, type: "Standard", gain: 15 },
                { id: 'ALLEMAGNE', name: "Allemagne", flag: "🇩🇪", target: 6, type: "Luxe", gain: 20 },
                { id: 'JAPON', name: "Japon", flag: "🇯🇵", target: 28, type: "Développement", gain: 25 }
              ].map(country => {
                const paysConquis = JSON.parse(gameState.paysConquis || '[]');
                const isAlreadyConquered = paysConquis.includes(country.id);
                const canConquer = gameState.delais <= country.target;
                
                return (
                  <div key={country.id} className={`bg-white dark:bg-slate-900 border-2 rounded-[2rem] p-6 flex flex-col gap-5 transition-all ${
                    isAlreadyConquered ? 'border-emerald-500 bg-emerald-50/20 shadow-emerald-100' : 
                    canConquer ? 'border-blue-600 shadow-blue-100' : 'border-slate-100 dark:border-slate-800 opacity-60'
                  }`}>
                    <div className="flex justify-between items-center">
                      <span className="text-3xl">{country.flag}</span>
                      {isAlreadyConquered ? (
                        <span className="bg-emerald-500 text-white p-1 rounded-full"><CheckCircle2 className="w-4 h-4" /></span>
                      ) : canConquer ? (
                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Prêt</span>
                      ) : (
                        <span className="bg-slate-100 text-slate-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Bloqué</span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">{country.name}</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Exigence : {country.type}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-black">
                        <span className="text-slate-400 uppercase">Délai Requis</span>
                        <span className={gameState.delais <= country.target ? 'text-emerald-500' : 'text-rose-600'}>≤ {country.target}j</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-black">
                        <span className="text-slate-400 uppercase">Gain Marché</span>
                        <span className="text-blue-700">+{country.gain}%</span>
                      </div>
                    </div>
                    {isAlreadyConquered ? (
                      <div className="w-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 py-3 rounded-xl font-black text-xs text-center uppercase">Marché Conquis</div>
                    ) : (
                      <button 
                        disabled={!canConquer}
                        onClick={() => {
                          const newPays = [...paysConquis, country.id];
                          const newPM = gameState.partsDeMarche + country.gain;
                          nextPhase({ paysConquis: newPays, partsDeMarche: newPM });
                        }}
                        className={`w-full py-3 rounded-xl font-black text-xs uppercase transition-all ${
                          canConquer ? 'bg-blue-700 text-white hover:bg-red-600 shadow-lg shadow-blue-200' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        Tenter la conquête
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-center pt-8 border-t border-slate-100 dark:border-slate-800">
              <button 
                onClick={() => nextPhase()}
                className="bg-slate-900 text-white px-12 py-4 rounded-2xl font-black text-lg shadow-2xl hover:bg-blue-700 transition-all"
              >
                Clôturer la Partie <ArrowRight className="w-5 h-5 ml-2 inline" />
              </button>
            </div>
          </div>
        )}

        {/* Phase 7: Bilan Final */}
        {gameState.phase === 7 && (
          <div className="space-y-10 animate-in zoom-in duration-700 flex-1 flex flex-col items-center justify-center text-center">
            <div className="bg-emerald-50 dark:bg-emerald-950/30 p-8 rounded-full border-4 border-emerald-100 animate-bounce">
              <CheckCircle2 className="w-16 h-16 text-emerald-500" />
            </div>
            
            <div className="space-y-3">
              <h2 className="text-5xl font-black text-slate-800 dark:text-white tracking-tighter uppercase">Simulation Terminée !</h2>
              <p className="text-slate-500 font-bold text-lg">Voici les performances finales de {entrepriseNom}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-4xl pt-4">
              <div className="p-8 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-2">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Score Final</span>
                <p className="text-5xl font-black text-blue-700 tracking-tighter">{(gameState.partsDeMarche * 100).toLocaleString()}</p>
              </div>
              <div className="p-8 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-2">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Délai Final</span>
                <p className="text-5xl font-black text-emerald-500 tracking-tighter">{gameState.delais}j</p>
              </div>
              <div className="p-8 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-2">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Parts de Marché</span>
                <p className="text-5xl font-black text-red-600 tracking-tighter">{gameState.partsDeMarche}%</p>
              </div>
            </div>

            <div className="pt-10 flex flex-col items-center gap-6">
              <div className="flex items-center gap-3">
                {JSON.parse(gameState.paysConquis || '[]').map((id: string) => (
                  <div key={id} className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl shadow-md flex items-center justify-center text-2xl border border-slate-100 dark:border-slate-800">
                    {id === 'MAROC' ? '🇲🇦' : id === 'ALLEMAGNE' ? '🇩🇪' : '🇯🇵'}
                  </div>
                ))}
              </div>
              <p className="text-slate-400 font-medium italic">Consultez les résultats globaux avec votre enseignant.</p>
              
              <button 
                onClick={async () => {
                  try {
                    await apiClient.post(`/sessions/${sessionId}/end`);
                    navigate('/participant');
                  } catch (err) {
                    console.error("Erreur lors de la fin de session", err);
                    navigate('/participant');
                  }
                }}
                className="mt-6 bg-red-600 text-white px-10 py-4 rounded-2xl font-black text-lg shadow-xl shadow-red-200 dark:shadow-none hover:bg-slate-900 transition-all flex items-center gap-3 group"
              >
                FIN DE LA PARTIE
                <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReactikV2Module;
