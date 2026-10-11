import { useTranslation } from 'react-i18next';
import { Box, Button, Checkbox, CircularProgress, FormControlLabel, IconButton, Paper, Radio, Stack, TextField, Tooltip, Typography } from '@mui/material';
import { Add, DeleteOutline, Refresh } from '@mui/icons-material';
import { QUESTION_MAX, REPONSE_MAX, REPONSES_MAX, REPONSES_MIN } from '../../../utils/brouillonQuiz';

/** Une question du brouillon : énoncé, réponses (une ou plusieurs justes), explication de l'IA. */
export default function QuestionBrouillon({ numero, question, changer, supprimer, regenerer, occupe, peutRegenerer }) {
  const { t } = useTranslation();
  const plusieurs = question.type === 'CHECK';
  const majReponse = (i, champs) => changer({ ...question, reponses: question.reponses.map((r, j) => (j === i ? { ...r, ...champs } : r)) });
  // Une seule bonne réponse : en cocher une décoche les autres
  const cocher = (i, juste) => changer({ ...question, reponses: question.reponses.map((r, j) => (plusieurs ? (j === i ? { ...r, juste } : r) : { ...r, juste: j === i })) });
  const basculerType = (e) => {
    if (e.target.checked) return changer({ ...question, type: 'CHECK' });
    const premiere = question.reponses.findIndex((r) => r.juste);
    return changer({ ...question, type: 'ABCD', reponses: question.reponses.map((r, j) => ({ ...r, juste: j === Math.max(0, premiere) })) });
  };

  return (
    <Paper variant="outlined" component="fieldset" disabled={occupe} sx={{ p: 2, m: 0, minWidth: 0, opacity: occupe ? 0.6 : 1 }}>
      <Box component="legend" sx={{ px: 1, fontWeight: 700 }}>{t('jeux.quizIa.question', { numero })}</Box>
      <Stack spacing={1.5}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
          <TextField
            label={t('jeux.quizIa.enonce')}
            value={question.question}
            onChange={(e) => changer({ ...question, question: e.target.value })}
            inputProps={{ maxLength: QUESTION_MAX }}
            multiline
            fullWidth
            required
          />
          {peutRegenerer && (
            <Tooltip title={t('jeux.quizIa.regenerer')}>
              <span>
                <IconButton onClick={regenerer} disabled={occupe} aria-label={t('jeux.quizIa.regenererQuestion', { numero })}>
                  {occupe ? <CircularProgress size={20} /> : <Refresh />}
                </IconButton>
              </span>
            </Tooltip>
          )}
          <Tooltip title={t('jeux.quizIa.supprimer')}>
            <IconButton onClick={supprimer} aria-label={t('jeux.quizIa.supprimerQuestion', { numero })}>
              <DeleteOutline />
            </IconButton>
          </Tooltip>
        </Box>
        {question.reponses.map((r, i) => (
          <Box key={i} sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
            {plusieurs ? (
              <Checkbox checked={r.juste} onChange={(e) => cocher(i, e.target.checked)} inputProps={{ 'aria-label': t('jeux.quizIa.bonneReponse', { numero: i + 1 }) }} />
            ) : (
              <Radio checked={r.juste} onChange={() => cocher(i, true)} inputProps={{ 'aria-label': t('jeux.quizIa.bonneReponse', { numero: i + 1 }) }} />
            )}
            <TextField
              size="small"
              label={t('jeux.quizIa.reponse', { numero: i + 1 })}
              value={r.texte}
              onChange={(e) => majReponse(i, { texte: e.target.value })}
              inputProps={{ maxLength: REPONSE_MAX }}
              fullWidth
            />
            <IconButton
              size="small"
              disabled={question.reponses.length <= REPONSES_MIN}
              onClick={() => changer({ ...question, reponses: question.reponses.filter((_, j) => j !== i) })}
              aria-label={t('jeux.quizIa.retirerReponse', { numero: i + 1 })}
            >
              <DeleteOutline fontSize="small" />
            </IconButton>
          </Box>
        ))}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2 }}>
          <Button size="small" startIcon={<Add />} disabled={question.reponses.length >= REPONSES_MAX} onClick={() => changer({ ...question, reponses: [...question.reponses, { texte: '', juste: false }] })}>
            {t('jeux.quizIa.ajouterReponse')}
          </Button>
          <FormControlLabel control={<Checkbox checked={plusieurs} onChange={basculerType} />} label={t('jeux.quizIa.plusieursJustes')} />
        </Box>
        {(question.explication || question.source) && (
          <Typography variant="body2" color="text.secondary">
            {[question.source && t('jeux.quizIa.source', { source: question.source }), question.explication].filter(Boolean).join(' · ')}
          </Typography>
        )}
      </Stack>
    </Paper>
  );
}
