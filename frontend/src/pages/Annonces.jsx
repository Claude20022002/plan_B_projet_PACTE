import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  LinearProgress,
  MenuItem,
  Skeleton,
  TextField,
  Typography,
} from '@mui/material';
import { AttachFile } from '@mui/icons-material';
import DashboardLayout from '../components/layouts/DashboardLayout';
import PageHeader from '../design-system/components/PageHeader';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Panneau, { Capitales, LignePanneau } from '../components/jeux/Panneau';
import { boutonPanneau } from '../components/jeux/styles';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { annonceAPI } from '../services/api';
import { ds } from '../design-system/tokens';

const TYPES_PIECE = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'];
const TAILLE_MAX = 5 * 1024 * 1024;
const FORMULAIRE_VIDE = { titre: '', corps: '', portee: '', id_cible: '', niveau: '', public: '', envoyer_email: false, fichier: null };

const taille = (octets) => (octets < 1024 * 1024 ? `${Math.max(1, Math.round(octets / 1024))} Ko` : `${(octets / 1024 / 1024).toFixed(1)} Mo`);

/**
 * Annonces ciblées (R1) : ce que l'école m'écrit (étudiants, enseignants) et, pour l'administration
 * et les enseignants, ce que j'ai envoyé avec les accusés de lecture et la relance des non-lus.
 * /annonces/:id ouvre directement une annonce (lien des notifications).
 */
export default function Annonces() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { id: idOuvert } = useParams();
  const peutEcrire = ['admin', 'enseignant'].includes(user?.role);
  const recoit = user?.role !== 'admin';

  const [recues, setRecues] = useState(null); // { annonces, non_lues }
  const [envoyees, setEnvoyees] = useState(null);
  const [erreur, setErreur] = useState(false);
  const [detail, setDetail] = useState(null);
  const [lecteurs, setLecteurs] = useState(null); // { annonce, liste }
  const [aSupprimer, setASupprimer] = useState(null);
  const [redaction, setRedaction] = useState(false);
  // Depuis « Mes classes » : rédaction ouverte sur le groupe de la classe ({ id_groupe, titre })
  const location = useLocation();
  const [modele, setModele] = useState(null);

  useEffect(() => {
    const nouvelle = location.state?.nouvelle;
    if (!nouvelle || !peutEcrire) return;
    setModele(nouvelle);
    setRedaction(true);
    // L'état est consommé : un rechargement de la page ne rouvre pas le formulaire
    navigate(location.pathname, { replace: true, state: null });
  }, [location.state, location.pathname, peutEcrire, navigate]);

  const fermerRedaction = () => {
    setRedaction(false);
    setModele(null);
  };

  const dateLongue = (d) => new Date(d).toLocaleString(i18n.language, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  const charger = useCallback(() => {
    setErreur(false);
    if (recoit) annonceAPI.getRecues().then(setRecues).catch(() => setErreur(true));
    if (peutEcrire) annonceAPI.getEnvoyees().then((r) => setEnvoyees(r?.data ?? [])).catch(() => setErreur(true));
  }, [recoit, peutEcrire]);

  useEffect(() => {
    charger();
  }, [charger]);

  const ouvrir = useCallback(
    async (annonce) => {
      setDetail(annonce);
      if (annonce.lu_le || annonce.est_auteur || !recoit) return;
      try {
        const { lu_le } = await annonceAPI.marquerLue(annonce.id);
        setDetail((d) => (d?.id === annonce.id ? { ...d, lu_le } : d));
        setRecues((r) => r && { non_lues: Math.max(0, r.non_lues - 1), annonces: r.annonces.map((a) => (a.id === annonce.id ? { ...a, lu_le } : a)) });
      } catch {
        // L'accusé de lecture n'empêche jamais la lecture
      }
    },
    [recoit]
  );

  // Lien direct (notification) : /annonces/:id
  useEffect(() => {
    if (!idOuvert) return;
    annonceAPI
      .get(idOuvert)
      .then(ouvrir)
      .catch(() => toast.error(t('annonces.introuvable')));
  }, [idOuvert, ouvrir, toast, t]);

  const fermerDetail = () => {
    setDetail(null);
    if (idOuvert) navigate('/annonces', { replace: true });
  };

  const telecharger = async (annonce) => {
    try {
      await annonceAPI.telechargerPieceJointe(annonce.id, annonce.piece_jointe.nom);
    } catch (e) {
      toast.error(e?.message || t('annonces.erreurAction'));
    }
  };

  const voirLecteurs = async (annonce) => {
    setLecteurs({ annonce, liste: null });
    try {
      const r = await annonceAPI.getLecteurs(annonce.id);
      setLecteurs({ annonce, liste: r?.data ?? [] });
    } catch (e) {
      setLecteurs(null);
      toast.error(e?.message || t('annonces.erreurAction'));
    }
  };

  const relancer = async (annonce) => {
    try {
      const { relances } = await annonceAPI.relancer(annonce.id);
      toast.success(relances ? t('annonces.relancees', { count: relances }) : t('annonces.toutLu'));
      charger();
    } catch (e) {
      toast.error(e?.message || t('annonces.erreurAction'));
    }
  };

  const supprimer = async () => {
    const annonce = aSupprimer;
    setASupprimer(null);
    try {
      await annonceAPI.supprimer(annonce.id);
      toast.success(t('annonces.supprimee'));
      charger();
    } catch (e) {
      toast.error(e?.message || t('annonces.erreurAction'));
    }
  };

  const meta = (a) => [a.auteur ? `${a.auteur.prenom} ${a.auteur.nom}` : null, a.cible, dateLongue(a.date)].filter(Boolean).join(' · ');
  const chargement = <Skeleton variant="rectangular" height={64} sx={{ bgcolor: ds.board.cell }} />;
  const vide = (texte) => (
    <LignePanneau premier>
      <Typography variant="body2" sx={{ color: ds.board.letterDim }}>{texte}</Typography>
    </LignePanneau>
  );

  return (
    <DashboardLayout>
      <PageHeader
        title={t('annonces.titre')}
        subtitle={t(peutEcrire ? 'annonces.sousTitreAuteur' : 'annonces.sousTitre')}
        actions={peutEcrire ? [{ label: t('annonces.nouvelle'), variant: 'contained', onClick: () => setRedaction(true) }] : []}
      />
      {erreur && (
        <Alert severity="warning" sx={{ mb: 2 }} action={<Button onClick={charger}>{t('common.retry')}</Button>}>
          {t('annonces.erreur')}
        </Alert>
      )}

      <Box sx={{ display: 'grid', gap: 2.5 }}>
        {recoit && (
          <Panneau titre={t('annonces.recues')} titreId="annonces-recues" droite={recues?.non_lues ? t('annonces.nonLues', { count: recues.non_lues }) : null}>
            {recues === null && chargement}
            {recues?.annonces.length === 0 && vide(t('annonces.aucuneRecue'))}
            {(recues?.annonces ?? []).map((a, i) => (
              <LignePanneau
                key={a.id}
                premier={i === 0}
                lampe={a.lu_le ? null : ds.brand.orange}
                action={
                  <Button size="small" variant="outlined" sx={boutonPanneau} onClick={() => ouvrir(a)}>
                    {t('annonces.lire')}
                  </Button>
                }
              >
                <Capitales sx={{ display: 'block', fontSize: '0.75rem', color: ds.board.letterDim, letterSpacing: '0.12em' }}>{meta(a)}</Capitales>
                <Box sx={{ fontWeight: a.lu_le ? 500 : 700 }}>{a.titre}</Box>
                <Box sx={{ fontSize: '0.875rem', color: ds.board.letterDim, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {a.corps}
                </Box>
                {a.piece_jointe && (
                  <Box sx={{ mt: 0.5, fontSize: '0.8125rem', color: ds.board.letterDim, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <AttachFile sx={{ fontSize: 16 }} aria-hidden /> {a.piece_jointe.nom}
                  </Box>
                )}
              </LignePanneau>
            ))}
          </Panneau>
        )}

        {peutEcrire && (
          <Panneau titre={t('annonces.envoyees')} titreId="annonces-envoyees">
            {envoyees === null && chargement}
            {envoyees?.length === 0 && vide(t('annonces.aucuneEnvoyee'))}
            {(envoyees ?? []).map((a, i) => {
              const part = a.destinataires ? Math.round((100 * a.lus) / a.destinataires) : 0;
              return (
                <LignePanneau
                  key={a.id}
                  premier={i === 0}
                  action={
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Button size="small" variant="outlined" sx={boutonPanneau} onClick={() => voirLecteurs(a)}>
                        {t('annonces.lecteurs')}
                      </Button>
                      <Button size="small" variant="outlined" sx={boutonPanneau} onClick={() => relancer(a)} disabled={a.lus >= a.destinataires}>
                        {t('annonces.relancer')}
                      </Button>
                      <Button size="small" variant="outlined" sx={boutonPanneau} onClick={() => setASupprimer(a)}>
                        {t('annonces.supprimer')}
                      </Button>
                    </Box>
                  }
                >
                  <Capitales sx={{ display: 'block', fontSize: '0.75rem', color: ds.board.letterDim, letterSpacing: '0.12em' }}>
                    {[a.cible, dateLongue(a.date), user?.role === 'admin' && a.auteur ? `${a.auteur.prenom} ${a.auteur.nom}` : null].filter(Boolean).join(' · ')}
                  </Capitales>
                  <Box component="button" type="button" onClick={() => ouvrir({ ...a, est_auteur: true })} sx={{ all: 'unset', cursor: 'pointer', fontWeight: 600, '&:focus-visible': { outline: `2px solid ${ds.brand.orange}` } }}>
                    {a.titre}
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.75, maxWidth: 360 }}>
                    <LinearProgress
                      variant="determinate"
                      value={part}
                      aria-label={t('annonces.lus', { lus: a.lus, total: a.destinataires })}
                      sx={{ flex: 1, height: 6, borderRadius: 3, bgcolor: ds.board.seam, '& .MuiLinearProgress-bar': { bgcolor: ds.board.letter } }}
                    />
                    <Box sx={{ fontSize: '0.8125rem', color: ds.board.letterDim, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                      {t('annonces.lus', { lus: a.lus, total: a.destinataires })}
                    </Box>
                  </Box>
                  {a.relancee_le && <Box sx={{ fontSize: '0.75rem', color: ds.board.letterDim, mt: 0.5 }}>{t('annonces.relanceeLe', { date: dateLongue(a.relancee_le) })}</Box>}
                </LignePanneau>
              );
            })}
          </Panneau>
        )}
      </Box>

      {/* ── Lecture d'une annonce ── */}
      <Dialog open={Boolean(detail)} onClose={fermerDetail} maxWidth="sm" fullWidth aria-labelledby="annonce-titre">
        {detail && (
          <>
            <DialogTitle id="annonce-titre">{detail.titre}</DialogTitle>
            <DialogContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{meta(detail)}</Typography>
              <Typography sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{detail.corps}</Typography>
              {detail.piece_jointe && (
                <Button startIcon={<AttachFile />} variant="outlined" sx={{ mt: 2 }} onClick={() => telecharger(detail)}>
                  {detail.piece_jointe.nom} · {taille(detail.piece_jointe.taille)}
                </Button>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={fermerDetail}>{t('common.close')}</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* ── Lecteurs : non-lus d'abord ── */}
      <Dialog open={Boolean(lecteurs)} onClose={() => setLecteurs(null)} maxWidth="xs" fullWidth aria-labelledby="lecteurs-titre">
        <DialogTitle id="lecteurs-titre">{t('annonces.lecteurs')}</DialogTitle>
        <DialogContent dividers>
          {lecteurs?.liste === null && <Skeleton variant="rectangular" height={120} />}
          {(lecteurs?.liste ?? []).map((l) => (
            <Box key={l.id_user} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, py: 0.75 }}>
              <Typography variant="body2">{`${l.nom ?? ''} ${l.prenom ?? ''}`.trim()}</Typography>
              <Typography variant="body2" color={l.lu_le ? 'text.secondary' : 'warning.main'} sx={{ whiteSpace: 'nowrap' }}>
                {l.lu_le ? t('annonces.luLe', { date: dateLongue(l.lu_le) }) : t('annonces.nonLu')}
              </Typography>
            </Box>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLecteurs(null)}>{t('common.close')}</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={Boolean(aSupprimer)}
        title={t('annonces.supprimerTitre')}
        message={t('annonces.supprimerMessage', { titre: aSupprimer?.titre ?? '' })}
        confirmLabel={t('annonces.supprimer')}
        onConfirm={supprimer}
        onCancel={() => setASupprimer(null)}
      />

      {redaction && <Redaction onFermer={fermerRedaction} onEnvoyee={charger} modele={modele} />}
    </DashboardLayout>
  );
}

/** Formulaire d'une nouvelle annonce : cibles proposées selon les droits (GET /annonces/cibles). */
function Redaction({ onFermer, onEnvoyee, modele = null }) {
  const { t } = useTranslation();
  const toast = useToast();
  const [cibles, setCibles] = useState(null);
  const [f, setF] = useState(() => ({ ...FORMULAIRE_VIDE, titre: modele?.titre ?? '' }));
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    annonceAPI
      .getCibles()
      .then((c) => {
        setCibles(c);
        // Groupe demandé (depuis « Mes classes »), s'il fait partie des cibles permises
        const groupe = c.portees.includes('groupe') && c.groupes.some((g) => g.id === modele?.id_groupe) ? modele.id_groupe : null;
        setF((x) => ({
          ...x,
          portee: groupe ? 'groupe' : c.portees[0] ?? '',
          id_cible: groupe ?? '',
          public: groupe && c.publics.includes('etudiants') ? 'etudiants' : c.publics[0] ?? '',
        }));
      })
      .catch((e) => setErreur(e?.message || t('annonces.erreur')));
  }, [t, modele]);

  const maj = (champ) => (e) => setF((x) => ({ ...x, [champ]: e.target.value }));
  const filiere = useMemo(() => cibles?.filieres.find((x) => String(x.id) === String(f.id_cible)), [cibles, f.id_cible]);

  const options = () => {
    if (!cibles) return [];
    if (f.portee === 'campus') return cibles.campus.map((c) => ({ id: c.id, label: c.nom }));
    if (f.portee === 'filiere' || f.portee === 'niveau') return cibles.filieres.map((x) => ({ id: x.id, label: `${x.code} · ${x.nom}` }));
    if (f.portee === 'groupe') return cibles.groupes.map((g) => ({ id: g.id, label: [g.nom, g.niveau].filter(Boolean).join(' · ') }));
    return [];
  };

  const choisirFichier = (e) => {
    const fichier = e.target.files?.[0] ?? null;
    e.target.value = '';
    if (!fichier) return;
    if (!TYPES_PIECE.includes(fichier.type)) return setErreur(t('annonces.form.typeFichier'));
    if (fichier.size > TAILLE_MAX) return setErreur(t('annonces.form.tailleFichier'));
    setErreur('');
    setF((x) => ({ ...x, fichier }));
  };

  const pret = f.titre.trim() && f.corps.trim() && f.portee && (f.portee === 'etablissement' || f.id_cible) && (f.portee !== 'niveau' || f.niveau);

  const envoyer = async () => {
    setEnvoi(true);
    setErreur('');
    try {
      const r = await annonceAPI.publier({
        titre: f.titre.trim(),
        corps: f.corps.trim(),
        portee: f.portee,
        id_cible: f.portee === 'etablissement' ? null : Number(f.id_cible),
        niveau: f.portee === 'niveau' ? f.niveau : null,
        public: f.public,
        envoyer_email: f.envoyer_email,
      });
      if (f.fichier) {
        try {
          await annonceAPI.deposerPieceJointe(r.id, f.fichier);
        } catch {
          toast.warning(t('annonces.form.sansPiece'));
        }
      }
      toast.success(t('annonces.envoyee', { count: r.destinataires }));
      onEnvoyee();
      onFermer();
    } catch (e) {
      setErreur(e?.message || t('annonces.erreurAction'));
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <Dialog open onClose={envoi ? undefined : onFermer} maxWidth="sm" fullWidth aria-labelledby="redaction-titre">
      <DialogTitle id="redaction-titre">{t('annonces.nouvelle')}</DialogTitle>
      <DialogContent sx={{ display: 'grid', gap: 2, pt: '8px !important' }}>
        {erreur && <Alert severity="error">{erreur}</Alert>}
        {!cibles && !erreur && <Skeleton variant="rectangular" height={200} />}
        {cibles && (
          <>
            <TextField label={t('annonces.form.titre')} value={f.titre} onChange={maj('titre')} inputProps={{ maxLength: 200 }} required autoFocus />
            <TextField label={t('annonces.form.corps')} value={f.corps} onChange={maj('corps')} inputProps={{ maxLength: 10000 }} required multiline minRows={4} />
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
              <TextField select label={t('annonces.form.portee')} value={f.portee} onChange={(e) => setF((x) => ({ ...x, portee: e.target.value, id_cible: '', niveau: '' }))}>
                {cibles.portees.map((p) => (
                  <MenuItem key={p} value={p}>{t(`annonces.portees.${p}`)}</MenuItem>
                ))}
              </TextField>
              {cibles.publics.length > 1 && (
                <TextField select label={t('annonces.form.public')} value={f.public} onChange={maj('public')}>
                  {cibles.publics.map((p) => (
                    <MenuItem key={p} value={p}>{t(`annonces.publics.${p}`)}</MenuItem>
                  ))}
                </TextField>
              )}
            </Box>
            {f.portee !== 'etablissement' && (
              <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: f.portee === 'niveau' ? '2fr 1fr' : '1fr' } }}>
                <TextField select label={t(`annonces.portees.${f.portee}`)} value={f.id_cible} onChange={(e) => setF((x) => ({ ...x, id_cible: e.target.value, niveau: '' }))} required>
                  {options().map((o) => (
                    <MenuItem key={o.id} value={o.id}>{o.label}</MenuItem>
                  ))}
                </TextField>
                {f.portee === 'niveau' && (
                  <TextField select label={t('annonces.form.niveau')} value={f.niveau} onChange={maj('niveau')} required disabled={!filiere}>
                    {(filiere?.niveaux ?? []).map((n) => (
                      <MenuItem key={n} value={n}>{n}</MenuItem>
                    ))}
                  </TextField>
                )}
              </Box>
            )}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Button component="label" variant="outlined" startIcon={<AttachFile />}>
                {f.fichier ? t('annonces.form.changerPiece') : t('annonces.form.piece')}
                <input type="file" hidden accept={TYPES_PIECE.join(',')} onChange={choisirFichier} />
              </Button>
              {f.fichier && (
                <Typography variant="body2" color="text.secondary">
                  {f.fichier.name} · {taille(f.fichier.size)}{' '}
                  <Button size="small" onClick={() => setF((x) => ({ ...x, fichier: null }))}>{t('annonces.form.retirerPiece')}</Button>
                </Typography>
              )}
            </Box>
            <FormControlLabel
              control={<Checkbox checked={f.envoyer_email} onChange={(e) => setF((x) => ({ ...x, envoyer_email: e.target.checked }))} />}
              label={t('annonces.form.email')}
            />
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onFermer} disabled={envoi}>{t('common.cancel')}</Button>
        <Button variant="contained" onClick={envoyer} disabled={!pret || envoi}>
          {envoi ? t('annonces.form.envoi') : t('annonces.form.envoyer')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
