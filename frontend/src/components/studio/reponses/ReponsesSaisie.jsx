import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, InputAdornment, MenuItem, TextField, Typography } from '@mui/material';
import { texteAccepte } from '../../../../../shared/quiz/studio/correction.js';

/**
 * Réponses à saisir : réponse courte, nombre, réponse rédigée, texte à trous (champ ou liste
 * déroulante dans le fil du texte). En correction, la bonne réponse s'affiche sous le champ.
 */

const etatChamp = (correction) => (correction?.statut === 'juste' ? 'success' : correction?.statut === 'faux' || correction?.statut === 'sans_reponse' ? 'error' : undefined);

function BonneReponse({ children }) {
  const { t } = useTranslation();
  return (
    <Typography variant="body2" sx={{ mt: 1, color: 'success.main', fontWeight: 600 }}>
      {t('studio.joueur.bonneReponse')} : {children}
    </Typography>
  );
}

export function ReponseCourte({ question, valeur, onChange, desactive, correction }) {
  const { t } = useTranslation();
  return (
    <Box>
      <TextField
        fullWidth
        label={t('studio.joueur.saisie')}
        value={valeur ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
        disabled={desactive}
        color={etatChamp(correction)}
        focused={Boolean(correction) || undefined}
        inputProps={{ maxLength: 300, autoComplete: 'off', spellCheck: false, 'aria-describedby': undefined }}
        aria-label={question.enonce}
      />
      {correction?.bonne_reponse && <BonneReponse>{[].concat(correction.bonne_reponse).join(' · ')}</BonneReponse>}
    </Box>
  );
}

export function ReponseNumerique({ question, valeur, onChange, desactive, correction }) {
  const { t } = useTranslation();
  const bonne = correction?.bonne_reponse;
  return (
    <Box>
      <TextField
        label={t('studio.joueur.saisie')}
        value={valeur ?? ''}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9.,\-\s]/g, '') || null)}
        disabled={desactive}
        color={etatChamp(correction)}
        focused={Boolean(correction) || undefined}
        inputProps={{ inputMode: 'decimal', autoComplete: 'off' }}
        InputProps={question.unite ? { endAdornment: <InputAdornment position="end">{question.unite}</InputAdornment> } : undefined}
        sx={{ width: { xs: '100%', sm: 260 } }}
      />
      {bonne && (
        <BonneReponse>
          {bonne.valeur}
          {bonne.tolerance ? ` ± ${bonne.tolerance}` : ''} {bonne.unite ?? ''}
        </BonneReponse>
      )}
    </Box>
  );
}

export function ReponseLibre({ question, valeur, onChange, desactive, correction }) {
  const { t } = useTranslation();
  const max = question.longueur_max ?? 1500;
  return (
    <Box>
      <TextField
        fullWidth
        multiline
        minRows={6}
        label={t('studio.joueur.saisie')}
        value={valeur ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
        disabled={desactive}
        inputProps={{ maxLength: max }}
        helperText={t('studio.joueur.caracteres', { n: (valeur ?? '').length, max })}
      />
      {correction?.bonne_reponse && <BonneReponse>{correction.bonne_reponse}</BonneReponse>}
    </Box>
  );
}

/** Texte à trous : le texte est découpé autour des repères {{n}}, chaque trou devient un champ. */
export function ReponseTrous({ question, valeur, onChange, desactive, correction }) {
  const { t } = useTranslation();
  const saisies = valeur && typeof valeur === 'object' ? valeur : {};
  const bonnes = correction?.bonne_reponse ?? null;
  const parties = question.texte.split(/(\{\{\d{1,2}\}\})/g);
  const changer = (id, texte) => {
    const suivantes = { ...saisies, [id]: texte };
    if (!texte) delete suivantes[id];
    onChange(Object.keys(suivantes).length ? suivantes : null);
  };
  return (
    <Box>
      <Typography component="div" variant="body1" sx={{ lineHeight: 2.6 }}>
        {parties.map((partie, i) => {
          const repere = /^\{\{(\d{1,2})\}\}$/.exec(partie);
          if (!repere) return <Fragment key={i}>{partie}</Fragment>;
          const trou = question.trous.find((x) => x.id === repere[1]);
          if (!trou) return <Fragment key={i}>{partie}</Fragment>;
          const libelle = t('studio.question.trou', { n: trou.id });
          const juste = bonnes ? texteAccepte(saisies[trou.id], bonnes[trou.id] ?? []) : null;
          const commun = {
            size: 'small',
            value: saisies[trou.id] ?? '',
            onChange: (e) => changer(trou.id, e.target.value),
            disabled: desactive,
            color: juste === null ? undefined : juste ? 'success' : 'error',
            focused: juste !== null || undefined,
            inputProps: { 'aria-label': libelle, autoComplete: 'off', spellCheck: false },
            sx: { mx: 0.5, verticalAlign: 'middle', minWidth: 120, width: trou.options ? 'auto' : '16ch' },
          };
          return (
            <Box key={i} component="span" sx={{ display: 'inline-flex', flexDirection: 'column', verticalAlign: 'middle' }}>
              {trou.options ? (
                <TextField select {...commun}>
                  <MenuItem value="">
                    <em>{t('studio.joueur.associer')}</em>
                  </MenuItem>
                  {trou.options.map((o) => (
                    <MenuItem key={o} value={o}>
                      {o}
                    </MenuItem>
                  ))}
                </TextField>
              ) : (
                <TextField {...commun} />
              )}
              {bonnes && !juste && (
                <Typography component="span" variant="caption" sx={{ color: 'success.main', fontWeight: 600, lineHeight: 1.2, mx: 0.5 }}>
                  {bonnes[trou.id]?.[0]}
                </Typography>
              )}
            </Box>
          );
        })}
      </Typography>
    </Box>
  );
}
