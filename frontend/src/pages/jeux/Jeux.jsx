import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Link,
  MenuItem,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import PageHeader from '../../design-system/components/PageHeader';
import CatalogueJeux from '../../components/jeux/CatalogueJeux';
import JeuxDesModules from '../../components/jeux/JeuxDesModules';
import { HistoriqueEnseignant, HistoriqueEtudiant } from '../../components/jeux/Historiques';
import SceneJoueur, { Personnage } from '../../components/jeux/SceneJoueur';
import ResultatsQuiz from '../../components/jeux/ResultatsQuiz';
import ZoneQuizEtDevoirs from '../../components/jeux/ZoneQuizEtDevoirs';
import PanneauQuizDirect from '../../components/quiz/PanneauQuizDirect';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { jeuxAPI, quizAPI } from '../../services/api';
import { libelle } from '../../../../shared/jeux/catalogue.js';
import { CONTEXTE_DEVOIRS, DEVOIRS_ACTIFS } from '../../../../shared/fonctions.js';

const RAFRAICHISSEMENT_QUIZ_MS = 20000;
const urlSure = (url) => typeof url === 'string' && /^https?:\/\//.test(url);

/**
 * Espace Jeux : les quiz en direct de la séance (ClassQuiz), les jeux proposés dans mes modules
 * et tous les jeux de la plateforme avec ma progression. L'enseignant y propose un jeu dans
 * ses modules et suit la progression de ses étudiants.
 */
export default function Jeux() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const enseignant = user?.role === 'enseignant';

  const [accueil, setAccueil] = useState(null);
  const [erreur, setErreur] = useState(false);
  const [quiz, setQuiz] = useState({ config: null, parties: [] });
  const [suivi, setSuivi] = useState(null); // { module, etudiants } | { chargement: true }
  const [proposition, setProposition] = useState(null); // { module, jeu, but, notion } : fenêtre « proposer »
  const [historique, setHistorique] = useState([]);
  const [historiqueProf, setHistoriqueProf] = useState(null); // enseignant : quiz, devoirs, défis
  const [resultats, setResultats] = useState(null); // id de la partie affichée

  const charger = useCallback(() => {
    jeuxAPI.getAccueil()
      .then((a) => {
        setAccueil(a);
        setErreur(false);
      })
      .catch(() => setErreur(true));
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  useEffect(() => {
    if (!enseignant) return undefined;
    let actif = true;
    // Devoirs masqués (lot D-1) : ceux déjà donnés ne remontent plus dans l'historique
    jeuxAPI.getHistorique()
      .then((r) => actif && setHistoriqueProf((r?.data ?? []).filter((e) => DEVOIRS_ACTIFS || e.type !== 'devoir')))
      .catch(() => actif && setHistoriqueProf([]));
    return () => {
      actif = false;
    };
  }, [enseignant]);

  // Quiz en direct : configuration une fois, parties en cours toutes les 20 s
  useEffect(() => {
    let actif = true;
    quizAPI.getConfig().then((config) => actif && setQuiz((q) => ({ ...q, config }))).catch(() => {});
    quizAPI.getHistorique().then((r) => actif && setHistorique(r?.data ?? [])).catch(() => {});
    const lireParties = () =>
      quizAPI
        .getPartiesEnCours()
        .then((r) => actif && setQuiz((q) => ({ ...q, parties: (r?.data ?? []).filter((p) => urlSure(p.url)) })))
        .catch(() => {});
    lireParties();
    const id = setInterval(lireParties, RAFRAICHISSEMENT_QUIZ_MS);
    return () => {
      actif = false;
      clearInterval(id);
    };
  }, []);

  const jouer = (jeu) => navigate(`/jeux/${jeu}`);

  const choisirAvatar = async (avatar) => {
    const avant = accueil?.profil;
    setAccueil((a) => ({ ...a, profil: { avatar } }));
    try {
      await jeuxAPI.choisirAvatar(avatar);
    } catch (e) {
      setAccueil((a) => ({ ...a, profil: avant }));
      toast.error(e?.message || t('jeux.erreurAction'));
    }
  };

  const basculer = async (module, jeu) => {
    if (!module.jeux.includes(jeu.code)) {
      // Proposer : l'enseignant choisit d'abord le but et, s'il le souhaite, la notion
      setProposition({ module, jeu, but: 'entrainer', notion: '' });
      return;
    }
    try {
      await jeuxAPI.retirer(jeu.code, module.id_cours);
      toast.success(t('jeux.modules.retire', { module: module.nom }));
      charger();
    } catch (e) {
      toast.error(e?.message || t('jeux.erreurAction'));
    }
  };

  const enregistrerProposition = async () => {
    const { module, jeu, but, notion } = proposition;
    const nouveau = !module.jeux.includes(jeu.code);
    try {
      await jeuxAPI.proposer(jeu.code, module.id_cours, { but, notion: notion.trim() });
      toast.success(nouveau ? t('jeux.modules.propose', { module: module.nom }) : t('jeux.modules.modifie'));
      setProposition(null);
      charger();
    } catch (e) {
      toast.error(e?.message || t('jeux.erreurAction'));
    }
  };

  const ouvrirSuivi = async (module, code) => {
    setSuivi({ chargement: true, module });
    try {
      setSuivi(await jeuxAPI.getSuivi(code, module.id_cours));
    } catch (e) {
      setSuivi(null);
      toast.error(e?.message || t('jeux.erreurAction'));
    }
  };

  const titreJeu = (code) => libelle(accueil?.jeux.find((j) => j.code === code)?.titre, i18n.language) || code;
  const modules = accueil?.modules ?? [];

  return (
    <DashboardLayout>
      <PageHeader title={t('jeux.titre')} subtitle={t(enseignant ? 'jeux.sousTitreEnseignant' : 'jeux.sousTitre', { context: CONTEXTE_DEVOIRS })} />

      {erreur && (
        <Alert severity="warning" sx={{ mb: 2 }} action={<Button onClick={charger}>{t('common.retry')}</Button>}>
          {t('jeux.erreur')}
        </Alert>
      )}

      <Box sx={{ display: 'grid', gap: 2.5 }}>
        {/* ── Le joueur dans sa scène (personnage et décor repris de CatéGO) : les étudiants
            seulement, un enseignant ne joue pas ── */}
        {accueil && !enseignant && <SceneJoueur user={user} profil={accueil.profil} jeux={accueil.jeux} onChoisir={choisirAvatar} />}

        {/* ── Quiz en direct : parties en cours, lancement dans Planner (CQ-3) ── */}
        <PanneauQuizDirect enseignant={enseignant} role={user?.role} config={quiz.config} parties={quiz.parties} />

        {/* ── Mes quiz (créer, relire) : la zone quiz de l'enseignant, en haut (R-6) ── */}
        {accueil && <ZoneQuizEtDevoirs enseignant={enseignant} />}

        {/* ── Étudiant : quiz terminés (résultats, défi par équipes, nuages de mots) ── */}
        {!enseignant && historique.length > 0 && <HistoriqueEtudiant historique={historique} onVoir={setResultats} />}

        {/* ── Jeux de mes modules ── */}
        {(enseignant || modules.length > 0) && (
          <JeuxDesModules
            enseignant={enseignant}
            jeux={accueil?.jeux}
            modules={modules}
            chargement={!accueil}
            titreJeu={titreJeu}
            onJouer={jouer}
            onSuivi={ouvrirSuivi}
            onModifier={(module, jeu, detail) => setProposition({ module, jeu, but: detail?.but ?? 'entrainer', notion: detail?.notion ?? '' })}
            onBasculer={basculer}
          />
        )}

        {/* ── Tous les jeux ── */}
        <CatalogueJeux jeux={accueil?.jeux} chargement={!accueil && !erreur} onJouer={jouer} />

        {/* ── Enseignant : petit historique (quiz terminés, devoirs, défis réussis dans ses modules) ── */}
        {enseignant && <HistoriqueEnseignant historique={historiqueProf} onVoir={setResultats} />}
      </Box>

      <ResultatsQuiz idPartie={resultats} onClose={() => setResultats(null)} />

      {/* Proposer un jeu dans un module : but et notion visée */}
      <Dialog open={Boolean(proposition)} onClose={() => setProposition(null)} fullWidth maxWidth="xs">
        <DialogTitle>{proposition ? t('jeux.modules.proposerTitre', { jeu: libelle(proposition.jeu.titre, i18n.language), module: proposition.module.nom }) : ''}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gap: 2, pt: 1 }}>
            <TextField select label={t('jeux.modules.but')} value={proposition?.but ?? 'entrainer'} onChange={(e) => setProposition((p) => ({ ...p, but: e.target.value }))}>
              <MenuItem value="verifier">{t('jeux.buts.verifier')}</MenuItem>
              <MenuItem value="entrainer">{t('jeux.buts.entrainer')}</MenuItem>
            </TextField>
            <TextField label={t('jeux.modules.notion')} value={proposition?.notion ?? ''} onChange={(e) => setProposition((p) => ({ ...p, notion: e.target.value }))} inputProps={{ maxLength: 120 }} helperText={t('jeux.modules.notionAide')} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProposition(null)}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={enregistrerProposition}>
            {proposition && !proposition.module.jeux.includes(proposition.jeu.code) ? t('jeux.modules.proposer') : t('jeux.modules.modifier')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(suivi)} onClose={() => setSuivi(null)} fullWidth maxWidth="sm">
        <DialogTitle>{t('jeux.modules.suiviTitre', { module: suivi?.module ? `${suivi.module.code} · ${suivi.module.nom}` : '' })}</DialogTitle>
        <DialogContent dividers>
          {suivi?.chargement && <Skeleton variant="rectangular" height={120} />}
          {suivi?.etudiants && suivi.etudiants.length === 0 && <Typography color="text.secondary">{t('jeux.modules.aucunEtudiant')}</Typography>}
          {suivi?.etudiants?.length > 0 && (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{t('jeux.modules.etudiant')}</TableCell>
                  <TableCell align="right">{t('jeux.modules.defis')}</TableCell>
                  <TableCell align="right">{t('jeux.modules.points')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {suivi.etudiants.map((e) => (
                  <TableRow key={e.id_user}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Personnage avatar={e.avatar} idUser={e.id_user} taille={32} />
                        {e.prenom} {e.nom}
                      </Box>
                    </TableCell>
                    <TableCell align="right">{e.reussis}/{e.total}</TableCell>
                    <TableCell align="right">{e.points}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSuivi(null)}>{t('common.close')}</Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}
