import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Alert, Box, Button, Chip, CircularProgress, LinearProgress, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, Typography } from '@mui/material';
import { ArrowBack, Download, QrCode2, Refresh, WarningAmber } from '@mui/icons-material';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import CopieDialog from '../../components/studio/resultats/CopieDialog';
import CodeAcces from '../../components/studio/editeur/CodeAcces';
import { IconeType } from '../../components/studio/typesQuestion';
import { studioAPI } from '../../services/studioApi';
import { useToast } from '../../contexts/ToastContext';

/**
 * Résultats d'une passation : indicateurs (sur la meilleure copie de chaque étudiant), liste des
 * copies (ouvrir pour corriger à la main), analyse des questions (facilité, discrimination,
 * réponses choisies) pour repérer une question ambiguë ou fausse.
 */

function Indicateur({ libelle, valeur }) {
  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary" component="p">
        {libelle}
      </Typography>
      <Typography sx={{ fontSize: 28, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{valeur ?? '—'}</Typography>
    </Paper>
  );
}

const duree = (s) => (s === null ? '—' : `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, '0')}`);

export default function Resultats() {
  const { id } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const [r, setR] = useState(null);
  const [erreur, setErreur] = useState(null);
  const [copie, setCopie] = useState(null);
  const [qr, setQr] = useState(false);

  const charger = useCallback(() => studioAPI.resultats(id).then(setR).catch((e) => setErreur(e.message)), [id]);
  useEffect(() => {
    charger();
  }, [charger]);
  const fermerCopie = useCallback(() => setCopie(null), []);

  if (erreur) return <DashboardLayout><Alert severity="error">{erreur}</Alert></DashboardLayout>;
  if (!r) return <DashboardLayout><CircularProgress aria-label={t('common.loading')} /></DashboardLayout>;
  const s = r.statistiques;
  const pct = (v) => (v === null || v === undefined ? null : `${v} %`);

  return (
    <DashboardLayout>
      <Button startIcon={<ArrowBack />} onClick={() => navigate(`/studio-quiz/${r.session.id_questionnaire}?onglet=passations`)} sx={{ mb: 1 }}>
        {t('studio.passation.liste')}
      </Button>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }} sx={{ mb: 3 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h1" component="h1">
            {t('studio.resultats.titre')} · {r.session.titre}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.75 }}>
            <Chip size="small" label={r.session.code} sx={{ fontWeight: 700, letterSpacing: '0.12em' }} />
            <Chip size="small" color={r.session.statut === 'ouverte' ? 'success' : 'default'} label={r.session.statut === 'ouverte' ? t('studio.passation.ouverte') : t('studio.passation.fermee')} />
          </Stack>
        </Box>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {r.session.statut === 'ouverte' && (
            <Button startIcon={<QrCode2 />} onClick={() => setQr((v) => !v)}>
              {t('studio.passation.qr')}
            </Button>
          )}
          <Button startIcon={<Refresh />} onClick={charger}>
            {t('studio.resultats.actualiser')}
          </Button>
          <Button variant="contained" startIcon={<Download />} onClick={() => studioAPI.resultatsCsv(id, r.session.code).catch((e) => toast.error(e.message))}>
            {t('studio.resultats.exporter')}
          </Button>
        </Stack>
      </Stack>
      {qr && (
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, mb: 3 }}>
          <CodeAcces code={r.session.code} titre={r.session.titre} />
        </Paper>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(5, 1fr)' }, gap: 1.5, mb: 3 }}>
        <Indicateur libelle={t('studio.resultats.copies')} valeur={s.copies} />
        <Indicateur libelle={t('studio.resultats.moyenne')} valeur={pct(s.moyenne)} />
        <Indicateur libelle={t('studio.resultats.mediane')} valeur={pct(s.mediane)} />
        <Indicateur libelle={t('studio.resultats.reussite')} valeur={pct(s.taux_reussite)} />
        <Indicateur libelle={t('studio.resultats.ecart')} valeur={s.ecart_type} />
      </Box>

      <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
        {t('studio.resultats.copies')}
      </Typography>
      {r.copies.length === 0 ? (
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          {t('studio.resultats.aucune')}
        </Typography>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3, mb: 4 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t('studio.resultats.etudiant')}</TableCell>
                <TableCell>{t('studio.resultats.tentative')}</TableCell>
                <TableCell>{t('studio.resultats.score')}</TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{t('studio.resultats.duree')}</TableCell>
                <TableCell>{t('studio.resultats.statut')}</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {r.copies.map((c) => (
                <TableRow key={c.id_tentative} hover>
                  <TableCell>{c.etudiant ? `${c.etudiant.prenom} ${c.etudiant.nom}` : '—'}</TableCell>
                  <TableCell>{c.numero}</TableCell>
                  <TableCell sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{c.pourcentage === null ? '—' : `${c.pourcentage} % (${c.points}/${c.max})`}</TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{duree(c.duree_s)}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                      {c.statut === 'en_cours' ? <Chip size="small" color="primary" variant="outlined" label={t('studio.resultats.enCours')} /> : c.reussi === null ? null : <Chip size="small" color={c.reussi ? 'success' : 'error'} label={c.reussi ? t('studio.resultats.reussi') : t('studio.resultats.echoue')} />}
                      {c.a_corriger > 0 && <Chip size="small" color="warning" label={t('studio.resultats.aCorriger', { count: c.a_corriger })} />}
                    </Stack>
                  </TableCell>
                  <TableCell align="right">
                    <Button size="small" onClick={() => setCopie(c.id_tentative)}>
                      {t('studio.resultats.voir')}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Typography variant="h6" component="h2">
        {t('studio.resultats.analyse')}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, maxWidth: 820 }}>
        {t('studio.resultats.analyseAide')}
      </Typography>
      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>{t('studio.question.enonce')}</TableCell>
              <TableCell sx={{ minWidth: 140 }}>{t('studio.resultats.facilite')}</TableCell>
              <TableCell>{t('studio.resultats.discrimination')}</TableCell>
              <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{t('studio.resultats.sansReponse')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {r.questions.map((q, i) => {
              const douteuse = q.discrimination !== null && q.discrimination < 0.1;
              return (
                <TableRow key={q.id_question}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="flex-start">
                      <IconeType type={q.type} fontSize="small" color="action" />
                      <Box>
                        <Typography variant="body2" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {q.enonce}
                        </Typography>
                        {q.repartition && Object.keys(q.repartition).length > 0 && (
                          <Typography variant="caption" color="text.secondary">
                            {t('studio.resultats.repartition')} : {Object.entries(q.repartition).map(([k, v]) => `${k === 'true' ? t('studio.question.vrai') : k === 'false' ? t('studio.question.faux') : k} ×${v}`).join(', ')}
                          </Typography>
                        )}
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    {q.facilite === null ? '—' : (
                      <Box>
                        <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums' }}>{q.facilite} %</Typography>
                        <LinearProgress variant="determinate" value={q.facilite} color={q.facilite < 30 ? 'error' : q.facilite > 90 ? 'warning' : 'primary'} aria-hidden sx={{ height: 6, borderRadius: 3 }} />
                      </Box>
                    )}
                  </TableCell>
                  <TableCell>
                    {q.discrimination === null ? '—' : (
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <span>{q.discrimination}</span>
                        {douteuse && (
                          <Tooltip title={t('studio.resultats.douteuse')}>
                            <WarningAmber fontSize="small" color="warning" aria-label={t('studio.resultats.douteuse')} />
                          </Tooltip>
                        )}
                      </Stack>
                    )}
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{q.sans_reponse}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      <CopieDialog idCopie={copie} onFermer={fermerCopie} onNotee={charger} />
    </DashboardLayout>
  );
}
