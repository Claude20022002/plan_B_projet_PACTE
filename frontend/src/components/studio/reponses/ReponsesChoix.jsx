import { useTranslation } from 'react-i18next';
import { Box, ButtonBase, Stack, Typography } from '@mui/material';
import { CancelOutlined, CheckCircleOutline } from '@mui/icons-material';

/**
 * Réponses à choisir : choix unique (boutons radio), choix multiple (cases), vrai ou faux.
 * Chaque option est une grande cible (48 px au moins) avec sa lettre, comme sur la feuille
 * d'examen ; en correction, la bonne réponse est verte et un choix faux rouge, avec une icône en
 * plus de la couleur (jamais la couleur seule).
 */

const LETTRES = 'ABCDEFGH';

function Option({ lettre, texte, choisie, multiple, onClick, desactive, etat, role, nom }) {
  const couleur = etat === 'juste' ? 'success.main' : etat === 'faux' ? 'error.main' : choisie ? 'primary.main' : 'divider';
  return (
    <ButtonBase
      role={role}
      aria-checked={choisie}
      aria-disabled={desactive || undefined}
      name={nom}
      onClick={desactive ? undefined : onClick}
      sx={{
        width: '100%',
        minHeight: 52,
        justifyContent: 'flex-start',
        textAlign: 'left',
        gap: 1.5,
        px: 1.5,
        py: 1,
        borderRadius: 2,
        border: 2,
        borderColor: couleur,
        bgcolor: choisie ? 'action.selected' : 'background.paper',
        transition: 'border-color 120ms, background-color 120ms',
        '&:hover': desactive ? {} : { borderColor: choisie ? 'primary.main' : 'text.secondary' },
        '&.Mui-focusVisible': { outline: '3px solid', outlineColor: 'primary.main', outlineOffset: 2 },
        cursor: desactive ? 'default' : 'pointer',
      }}
    >
      <Box
        aria-hidden
        sx={{
          flex: '0 0 32px',
          height: 32,
          display: 'grid',
          placeItems: 'center',
          borderRadius: multiple ? 1 : '50%',
          border: 2,
          borderColor: choisie ? 'primary.main' : 'text.secondary',
          bgcolor: choisie ? 'primary.main' : 'transparent',
          color: choisie ? 'primary.contrastText' : 'text.secondary',
          fontWeight: 700,
          fontSize: 14,
        }}
      >
        {lettre}
      </Box>
      <Typography variant="body1" sx={{ flex: 1, py: 0.5, overflowWrap: 'anywhere' }}>
        {texte}
      </Typography>
      {etat === 'juste' && <CheckCircleOutline color="success" aria-hidden />}
      {etat === 'faux' && <CancelOutlined color="error" aria-hidden />}
    </ButtonBase>
  );
}

const etatOption = (id, choisie, bonnes) => {
  if (!bonnes) return null;
  if (bonnes.includes(id)) return 'juste';
  return choisie ? 'faux' : null;
};

export function ReponseChoix({ question, valeur, onChange, desactive, correction }) {
  const { t } = useTranslation();
  const multiple = question.type === 'choix_multiple';
  const choisies = multiple ? (Array.isArray(valeur) ? valeur : []) : valeur ? [valeur] : [];
  const bonnes = correction?.bonne_reponse === undefined ? null : [].concat(correction.bonne_reponse ?? []);
  const basculer = (id) => {
    if (!multiple) return onChange(id === valeur ? null : id);
    const suivantes = choisies.includes(id) ? choisies.filter((x) => x !== id) : [...choisies, id];
    return onChange(suivantes.length ? suivantes : null);
  };
  return (
    <Box>
      {multiple && question.nombre_attendu && (
        <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
          {t('studio.joueur.choisir', { count: question.nombre_attendu })}
        </Typography>
      )}
      <Stack spacing={1} role={multiple ? 'group' : 'radiogroup'} aria-label={question.enonce}>
        {question.options.map((o, i) => (
          <Option
            key={o.id}
            lettre={LETTRES[i]}
            texte={o.texte}
            multiple={multiple}
            role={multiple ? 'checkbox' : 'radio'}
            choisie={choisies.includes(o.id)}
            onClick={() => basculer(o.id)}
            desactive={desactive}
            etat={etatOption(o.id, choisies.includes(o.id), bonnes)}
          />
        ))}
      </Stack>
    </Box>
  );
}

export function ReponseVraiFaux({ question, valeur, onChange, desactive, correction }) {
  const { t } = useTranslation();
  const bonne = correction?.bonne_reponse;
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} role="radiogroup" aria-label={question.enonce}>
      {[true, false].map((v, i) => (
        <Option
          key={String(v)}
          lettre={LETTRES[i]}
          texte={v ? t('studio.question.vrai') : t('studio.question.faux')}
          role="radio"
          choisie={valeur === v}
          onClick={() => onChange(valeur === v ? null : v)}
          desactive={desactive}
          etat={bonne === undefined ? null : bonne === v ? 'juste' : valeur === v ? 'faux' : null}
        />
      ))}
    </Stack>
  );
}
