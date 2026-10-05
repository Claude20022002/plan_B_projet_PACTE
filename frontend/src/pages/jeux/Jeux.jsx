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
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import PageHeader from '../../design-system/components/PageHeader';
import Panneau, { Capitales, LignePanneau } from '../../components/jeux/Panneau';
import SceneJoueur, { Personnage } from '../../components/jeux/SceneJoueur';
import ResultatsQuiz from '../../components/jeux/ResultatsQuiz';
import { boutonPanneau, boutonPanneauPlein } from '../../components/jeux/styles';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { jeuxAPI, quizAPI } from '../../services/api';
import { ds } from '../../design-system/tokens';
import { libelle } from '../../../../shared/jeux/catalogue.js';
import { adresseEspace } from '../../../../shared/espaces.js';

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
  const [historique, setHistorique] = useState([]);
  const [resultats, setResultats] = useState(null); // id de la partie affichée

  const charger = useCallback(() => {
    jeuxAPI
      .getAccueil()
      .then((a) => {
        setAccueil(a);
        setErreur(false);
      })
      .catch(() => setErreur(true));
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

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

  const basculer = async (module, code) => {
    const propose = module.jeux.includes(code);
    try {
      if (propose) await jeuxAPI.retirer(code, module.id_cours);
      else await jeuxAPI.proposer(code, module.id_cours);
      toast.success(propose ? t('jeux.modules.retire', { module: module.nom }) : t('jeux.modules.propose', { module: module.nom }));
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
  const urlQuiz = urlSure(quiz.config?.url) ? quiz.config.url : null;
  const lancerQuiz = quiz.config?.peutLancer ? adresseEspace('quiz', { role: user?.role, urlQuiz }) : null;
  const rejoindreQuiz = !quiz.config?.peutLancer ? adresseEspace('quiz', { role: user?.role, urlQuiz }) : null;
  const modules = accueil?.modules ?? [];

  return (
    <DashboardLayout>
      <PageHeader title={t('jeux.titre')} subtitle={t(enseignant ? 'jeux.sousTitreEnseignant' : 'jeux.sousTitre')} />

      {erreur && (
        <Alert severity="warning" sx={{ mb: 2 }} action={<Button onClick={charger}>{t('common.retry')}</Button>}>
          {t('jeux.erreur')}
        </Alert>
      )}

      <Box sx={{ display: 'grid', gap: 2.5 }}>
        {/* ── Le joueur dans sa scène (personnage et décor repris de CatéGO) ── */}
        {accueil && <SceneJoueur user={user} profil={accueil.profil} jeux={accueil.jeux} onChoisir={choisirAvatar} />}

        {/* ── Quiz en direct (ClassQuiz) ─────────────────────────────── */}
        {urlQuiz && (
          <Panneau
            titre={t('jeux.quiz.titre')}
            titreId="quiz-titre"
            droite={
              lancerQuiz ? (
                <Button size="small" variant="contained" href={lancerQuiz} sx={boutonPanneauPlein}>
                  {t('board.launchQuiz')}
                </Button>
              ) : null
            }
          >
            {quiz.parties.length === 0 ? (
              <LignePanneau
                premier
                action={
                  rejoindreQuiz ? (
                    <Button size="small" variant="outlined" href={rejoindreQuiz} sx={boutonPanneau}>
                      {t('jeux.quiz.saisirCode')}
                    </Button>
                  ) : null
                }
              >
                <Typography variant="body2" sx={{ color: ds.board.letterDim }}>
                  {t(enseignant ? 'jeux.quiz.aucuneEnseignant' : 'jeux.quiz.aucune')}
                </Typography>
              </LignePanneau>
            ) : (
              quiz.parties.map((p, i) => (
                <LignePanneau
                  key={p.id}
                  premier={i === 0}
                  lampe={ds.board.live}
                  action={
                    <Button size="small" variant="contained" href={p.url} sx={boutonPanneauPlein}>
                      {t(enseignant ? 'jeux.quiz.ouvrir' : 'jeux.quiz.rejoindre')}
                    </Button>
                  }
                >
                  <Capitales sx={{ display: 'block', fontSize: '0.75rem', color: ds.board.live, letterSpacing: '0.12em' }}>{t('jeux.quiz.enCours')}</Capitales>
                  <Box sx={{ fontWeight: 600 }}>{p.titre}</Box>
                  <Box sx={{ fontSize: '0.875rem', color: ds.board.letterDim }}>
                    {[p.module?.nom, t('jeux.quiz.code', { pin: p.pin })].filter(Boolean).join(' · ')}
                  </Box>
                </LignePanneau>
              ))
            )}
          </Panneau>
        )}

        {/* ── Quiz terminés : résultats, défi par équipes, nuages de mots ── */}
        {historique.length > 0 && (
          <Panneau titre={t(enseignant ? 'jeux.resultats.historiqueEnseignant' : 'jeux.resultats.historique')} titreId="historique-titre">
            {historique.slice(0, 8).map((h, i) => (
              <LignePanneau
                key={h.id}
                premier={i === 0}
                action={
                  <Button size="small" variant="outlined" sx={boutonPanneau} onClick={() => setResultats(h.id)}>
                    {t('jeux.resultats.voir')}
                  </Button>
                }
              >
                <Box sx={{ fontWeight: 600 }}>{h.titre}</Box>
                <Box sx={{ fontSize: '0.875rem', color: ds.board.letterDim }}>
                  {[
                    h.module?.nom,
                    h.terminee_le ? new Date(h.terminee_le).toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' }) : null,
                    enseignant
                      ? t('jeux.resultats.resumeEnseignant', { count: h.nb_joueurs ?? 0, moyenne: h.moyenne })
                      : t('jeux.resultats.resumeEtudiant', { score: h.score, rang: h.rang, total: h.nb_joueurs }),
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </Box>
              </LignePanneau>
            ))}
          </Panneau>
        )}

        {/* ── Jeux de mes modules ─────────────────────────────────────── */}
        {(enseignant || modules.length > 0) && (
          <Panneau titre={t(enseignant ? 'jeux.modules.titreEnseignant' : 'jeux.modules.titre')} titreId="modules-titre">
            {!accueil && <Skeleton variant="rectangular" height={64} sx={{ bgcolor: ds.board.cell }} />}
            {accueil && modules.length === 0 && (
              <LignePanneau premier>
                <Typography variant="body2" sx={{ color: ds.board.letterDim }}>{t('jeux.modules.aucun')}</Typography>
              </LignePanneau>
            )}
            {modules.map((m, i) =>
              enseignant ? (
                (accueil?.jeux ?? []).map((jeu, j) => {
                  const propose = m.jeux.includes(jeu.code);
                  return (
                    <LignePanneau
                      key={`${m.id_cours}-${jeu.code}`}
                      premier={i === 0 && j === 0}
                      lampe={propose ? ds.board.live : null}
                      action={
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {propose && (
                            <Button size="small" variant="outlined" sx={boutonPanneau} onClick={() => ouvrirSuivi(m, jeu.code)}>
                              {t('jeux.modules.suivi')}
                            </Button>
                          )}
                          <Button size="small" variant={propose ? 'outlined' : 'contained'} sx={propose ? boutonPanneau : boutonPanneauPlein} onClick={() => basculer(m, jeu.code)}>
                            {propose ? t('jeux.modules.retirer') : t('jeux.modules.proposer')}
                          </Button>
                        </Box>
                      }
                    >
                      <Capitales sx={{ display: 'block', fontSize: '1rem' }}>{m.code} · {m.nom}</Capitales>
                      <Box sx={{ fontSize: '0.875rem', color: ds.board.letterDim }}>
                        {libelle(jeu.titre, i18n.language)} — {propose ? t('jeux.modules.estPropose') : t('jeux.modules.nonPropose')}
                      </Box>
                    </LignePanneau>
                  );
                })
              ) : (
                m.jeux.map((code, j) => (
                  <LignePanneau
                    key={`${m.id_cours}-${code}`}
                    premier={i === 0 && j === 0}
                    lampe={ds.board.live}
                    action={
                      <Button size="small" variant="contained" sx={boutonPanneauPlein} onClick={() => jouer(code)}>
                        {t('jeux.jouer')}
                      </Button>
                    }
                  >
                    <Capitales sx={{ display: 'block', fontSize: '1rem' }}>{titreJeu(code)}</Capitales>
                    <Box sx={{ fontSize: '0.875rem', color: ds.board.letterDim }}>{t('jeux.modules.proposePar', { module: `${m.code} · ${m.nom}` })}</Box>
                  </LignePanneau>
                ))
              )
            )}
          </Panneau>
        )}

        {/* ── Tous les jeux ───────────────────────────────────────────── */}
        <Panneau titre={t('jeux.catalogue')} titreId="catalogue-titre">
          {!accueil && !erreur && <Skeleton variant="rectangular" height={96} sx={{ bgcolor: ds.board.cell }} />}
          {(accueil?.jeux ?? []).map((jeu, i) => {
            const p = jeu.progression;
            const pourcentage = p.total ? Math.round((100 * p.reussis) / p.total) : 0;
            return (
              <LignePanneau
                key={jeu.code}
                premier={i === 0}
                lampe={p.reussis > 0 ? ds.board.live : null}
                action={
                  <Button variant="contained" sx={boutonPanneauPlein} onClick={() => jouer(jeu.code)}>
                    {p.reussis > 0 ? t('jeux.continuer') : t('jeux.jouer')}
                  </Button>
                }
              >
                <Capitales sx={{ display: 'block', fontSize: '1.125rem' }}>{libelle(jeu.titre, i18n.language)}</Capitales>
                <Box sx={{ fontSize: '0.9375rem', color: ds.board.letterDim, maxWidth: '72ch', mt: 0.25 }}>{libelle(jeu.resume, i18n.language)}</Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 1, maxWidth: 420 }}>
                  <LinearProgress
                    variant="determinate"
                    value={pourcentage}
                    aria-label={t('jeux.progression', { count: p.reussis, total: p.total, points: p.points })}
                    sx={{ flex: 1, height: 4, borderRadius: '2px', bgcolor: ds.board.seam, '& .MuiLinearProgress-bar': { bgcolor: ds.board.letter } }}
                  />
                  <Capitales sx={{ fontSize: '0.8125rem', color: ds.board.letterDim, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                    {p.reussis}/{p.total} · {t('jeux.points', { count: p.points })}
                  </Capitales>
                </Box>
                <Box sx={{ fontSize: '0.75rem', color: ds.board.letterDim, mt: 0.75 }}>
                  {t('jeux.source', { nom: jeu.source.nom, auteur: jeu.source.auteur, licence: jeu.source.licence })}{' '}
                  <Link href={jeu.source.url} target="_blank" rel="noopener noreferrer" sx={{ color: ds.board.letter }}>
                    {t('jeux.voirSource')}
                  </Link>
                </Box>
              </LignePanneau>
            );
          })}
          <LignePanneau>
            <Typography variant="body2" sx={{ color: ds.board.letterDim }}>{t('jeux.bientot')}</Typography>
          </LignePanneau>
        </Panneau>
      </Box>

      <ResultatsQuiz idPartie={resultats} onClose={() => setResultats(null)} />

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
