import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box, Button, Card, CardActionArea, CardContent, Chip, FormControlLabel, IconButton, InputAdornment, Menu, MenuItem, Skeleton, Stack, Switch, TextField, Typography } from '@mui/material';
import { Add, AutoAwesome, MoreVert, Quiz as IconeQuiz, Search, Send, WarningAmber } from '@mui/icons-material';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import PageHeader from '../../design-system/components/PageHeader';
import EmptyState from '../../design-system/components/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import NouveauQuizDialog from '../../components/studio/editeur/NouveauQuizDialog';
import GenererIaDialog from '../../components/studio/editeur/GenererIaDialog';
import OuvrirPassationDialog from '../../components/studio/editeur/OuvrirPassationDialog';
import { studioAPI } from '../../services/studioApi';
import { useToast } from '../../contexts/ToastContext';

/**
 * « Mes quiz » : la banque de l'enseignant (décision du 15 octobre 2026 : un quiz appartient à
 * l'enseignant, sans classe ni module ; les étiquettes servent à les retrouver). Une seule action
 * principale, « Créer un quiz » ; chaque carte ouvre l'éditeur.
 */

function EtatQuiz({ quiz }) {
  const { t } = useTranslation();
  if (quiz.generation?.statut === 'en_cours') return <Chip size="small" color="primary" icon={<AutoAwesome />} label={t('studio.banque.generation')} />;
  if (quiz.generation?.statut === 'erreur') return <Chip size="small" color="error" variant="outlined" label={t('studio.banque.erreurGeneration')} />;
  if (quiz.a_relire) return <Chip size="small" color="warning" icon={<WarningAmber />} label={t('studio.banque.aRelire', { count: quiz.a_relire })} />;
  if (!quiz.nb_questions) return <Chip size="small" variant="outlined" label={t('studio.banque.vide')} />;
  return <Chip size="small" color="success" variant="outlined" label={t('studio.banque.pret')} />;
}

/** Prêt à diffuser : des questions, aucune à relire, pas de génération en cours (même règle que l'éditeur) */
const pretADiffuser = (quiz) => quiz.nb_questions > 0 && !quiz.a_relire && quiz.generation?.statut !== 'en_cours';

function CarteQuiz({ quiz, onOuvrir, onMenu, onDiffuser }) {
  const { t } = useTranslation();
  return (
    <Card variant="outlined" sx={{ position: 'relative', borderRadius: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardActionArea onClick={onOuvrir} sx={{ alignItems: 'stretch', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
        <CardContent sx={{ width: '100%', pr: 6 }}>
          <Typography variant="subtitle1" component="h3" sx={{ fontWeight: 700, lineHeight: 1.3, mb: 0.5, overflowWrap: 'anywhere' }}>
            {quiz.titre}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            {t('studio.banque.questions', { count: quiz.nb_questions })} · {t('studio.banque.points', { count: quiz.points })}
          </Typography>
          <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" sx={{ mb: 1.5 }}>
            <EtatQuiz quiz={quiz} />
            {quiz.passations_ouvertes > 0 && <Chip size="small" color="primary" variant="outlined" label={t('studio.banque.passationsOuvertes', { count: quiz.passations_ouvertes })} />}
          </Stack>
          {quiz.etiquettes.length > 0 && (
            <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap">
              {quiz.etiquettes.map((e) => (
                <Chip key={e} size="small" label={e} sx={{ bgcolor: 'action.hover' }} />
              ))}
            </Stack>
          )}
        </CardContent>
      </CardActionArea>
      {/* Diffuser sans passer par l'éditeur : code et QR code pour les étudiants */}
      {pretADiffuser(quiz) && (
        <Box sx={{ px: 2, pb: 2 }}>
          <Button size="small" variant="contained" startIcon={<Send />} onClick={onDiffuser}>
            {t('studio.banque.diffuser')}
          </Button>
        </Box>
      )}
      <IconButton onClick={onMenu} aria-label={t('studio.banque.actions')} aria-haspopup="menu" sx={{ position: 'absolute', top: 8, right: 8 }}>
        <MoreVert />
      </IconButton>
    </Card>
  );
}

export default function MesQuiz() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const toast = useToast();
  const [quiz, setQuiz] = useState(null);
  const [recherche, setRecherche] = useState('');
  const [etiquette, setEtiquette] = useState('');
  const [archives, setArchives] = useState(false);
  const [nouveau, setNouveau] = useState(false);
  // « Le faire moi-même » de « Créer un quiz » (page Activités) arrive ici avec ?nouveau=1
  useEffect(() => {
    if (params.get('nouveau') !== '1') return;
    setNouveau(true);
    setParams({}, { replace: true });
  }, [params, setParams]);
  const [generer, setGenerer] = useState(false);
  const [iaDisponible, setIaDisponible] = useState(false);
  const [menu, setMenu] = useState(null);
  const [aSupprimer, setASupprimer] = useState(null);
  const [aDiffuser, setADiffuser] = useState(null); // quiz dont on ouvre une passation

  // Le contexte des messages change à chaque affichage : lu par référence, pour ne pas relancer le chargement
  const toastRef = useRef(toast);
  toastRef.current = toast;
  const charger = useCallback(async () => {
    try {
      setQuiz(await studioAPI.lister({ archives: archives ? '1' : undefined }));
    } catch (e) {
      toastRef.current.error(e.message);
      setQuiz([]);
    }
  }, [archives]);

  useEffect(() => {
    charger();
  }, [charger]);
  useEffect(() => {
    studioAPI.disponibiliteIa().then((d) => setIaDisponible(d.texte)).catch(() => setIaDisponible(false));
  }, []);
  // Une génération en cours : la liste se met à jour seule
  useEffect(() => {
    if (!quiz?.some((q) => q.generation?.statut === 'en_cours')) return undefined;
    const minuterie = setInterval(charger, 3000);
    return () => clearInterval(minuterie);
  }, [quiz, charger]);

  const toutesEtiquettes = useMemo(() => [...new Set((quiz ?? []).flatMap((q) => q.etiquettes))].sort((a, b) => a.localeCompare(b)), [quiz]);
  const visibles = useMemo(() => {
    const texte = recherche.trim().toLowerCase();
    return (quiz ?? []).filter((q) => (!texte || q.titre.toLowerCase().includes(texte)) && (!etiquette || q.etiquettes.includes(etiquette)));
  }, [quiz, recherche, etiquette]);

  const agir = async (action) => {
    const cible = menu.quiz;
    setMenu(null);
    try {
      if (action === 'dupliquer') {
        const copie = await studioAPI.dupliquer(cible.id_questionnaire);
        toast.success(t('studio.banque.duplique'));
        navigate(`/studio-quiz/${copie.id_questionnaire}`);
      } else if (action === 'exporter') await studioAPI.exporter(cible.id_questionnaire, cible.titre);
      else if (action === 'archiver') {
        await studioAPI.modifier(cible.id_questionnaire, { archive: !cible.archive });
        toast.success(t('studio.banque.archive'));
        charger();
      } else if (action === 'supprimer') setASupprimer(cible);
    } catch (e) {
      toast.error(e.message);
    }
  };

  const supprimer = async () => {
    try {
      await studioAPI.supprimer(aSupprimer.id_questionnaire);
      toast.success(t('studio.banque.supprime'));
      charger();
    } catch (e) {
      toast.error(e.message);
    }
    setASupprimer(null);
  };

  return (
    <DashboardLayout>
      <PageHeader title={t('studio.banque.titre')} subtitle={t('studio.banque.sousTitre')} actions={[{ label: t('studio.banque.creer'), variant: 'contained', startIcon: <Add />, onClick: () => setNouveau(true) }]} />
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 3 }} alignItems={{ sm: 'center' }}>
        <TextField
          size="small"
          placeholder={t('studio.banque.recherche')}
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          inputProps={{ 'aria-label': t('studio.banque.recherche') }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
          sx={{ flex: 1, maxWidth: { sm: 360 } }}
        />
        {toutesEtiquettes.length > 0 && (
          <TextField select size="small" value={etiquette} onChange={(e) => setEtiquette(e.target.value)} SelectProps={{ displayEmpty: true }} inputProps={{ 'aria-label': t('studio.nouveau.etiquettes') }} sx={{ minWidth: 200 }}>
            <MenuItem value="">{t('studio.banque.toutes')}</MenuItem>
            {toutesEtiquettes.map((e) => (
              <MenuItem key={e} value={e}>
                {e}
              </MenuItem>
            ))}
          </TextField>
        )}
        <FormControlLabel control={<Switch checked={archives} onChange={(e) => setArchives(e.target.checked)} />} label={t('studio.banque.archives')} />
      </Stack>

      {quiz === null ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 2 }}>
          {[1, 2, 3].map((n) => (
            <Skeleton key={n} variant="rounded" height={150} />
          ))}
        </Box>
      ) : quiz.length === 0 && !archives ? (
        <EmptyState icon={<IconeQuiz />} title={t('studio.banque.videTitre')} description={t('studio.banque.videTexte')} actionLabel={t('studio.banque.creer')} onAction={() => setNouveau(true)} />
      ) : visibles.length === 0 ? (
        <Typography color="text.secondary">{t('studio.banque.aucunResultat')}</Typography>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 2 }}>
          {visibles.map((q) => (
            <CarteQuiz key={q.id_questionnaire} quiz={q} onOuvrir={() => navigate(`/studio-quiz/${q.id_questionnaire}`)} onMenu={(e) => setMenu({ ancre: e.currentTarget, quiz: q })} onDiffuser={() => setADiffuser(q)} />
          ))}
        </Box>
      )}

      <Menu anchorEl={menu?.ancre} open={Boolean(menu)} onClose={() => setMenu(null)}>
        <MenuItem onClick={() => agir('dupliquer')}>{t('studio.banque.dupliquer')}</MenuItem>
        <MenuItem onClick={() => agir('exporter')}>{t('studio.banque.exporter')}</MenuItem>
        <MenuItem onClick={() => agir('archiver')}>{menu?.quiz.archive ? t('studio.banque.desarchiver') : t('studio.banque.archiver')}</MenuItem>
        <MenuItem onClick={() => agir('supprimer')} sx={{ color: 'error.main' }}>
          {t('studio.banque.supprimer')}
        </MenuItem>
      </Menu>
      <ConfirmDialog
        open={Boolean(aSupprimer)}
        title={t('studio.banque.supprimerTitre')}
        message={t('studio.banque.supprimerTexte', { titre: aSupprimer?.titre })}
        confirmLabel={t('common.delete')}
        onConfirm={supprimer}
        onCancel={() => setASupprimer(null)}
      />
      <NouveauQuizDialog
        ouvert={nouveau}
        onFermer={() => setNouveau(false)}
        iaDisponible={iaDisponible}
        suggestions={toutesEtiquettes}
        onGenerer={() => setGenerer(true)}
        onCree={(id, comment) => {
          if (comment === 'importe') toast.success(t('studio.banque.importe'));
          navigate(`/studio-quiz/${id}`);
        }}
      />
      {aDiffuser && <OuvrirPassationDialog ouvert onFermer={() => setADiffuser(null)} quiz={aDiffuser} onOuverte={charger} />}
      <GenererIaDialog
        ouvert={generer}
        onFermer={() => setGenerer(false)}
        onLancee={(id) => {
          setGenerer(false);
          toast.info(t('studio.ia.lance'));
          navigate(`/studio-quiz/${id}`);
        }}
      />
    </DashboardLayout>
  );
}
