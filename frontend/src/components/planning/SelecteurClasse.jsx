import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Box, Chip, MenuItem, Skeleton, TextField, Typography } from '@mui/material';
import { enseignantAPI } from '../../services/api';

const cleClasse = (c) => (c ? `${c.id_cours}:${c.id_groupe}` : '');

/**
 * Choix d'une de mes classes (module × groupe), d'après mes services et mon emploi du temps :
 * la séance en cours ou la prochaine est proposée d'abord, et choisie par défaut. Le serveur
 * refuse de toute façon une classe qui n'est pas la mienne.
 * @param {{ valeur: object|null, onChange: (classe) => void, filtreCours?: number }} props
 */
export default function SelecteurClasse({ valeur, onChange, filtreCours = null, label }) {
  const { t, i18n } = useTranslation();
  const [classes, setClasses] = useState(null);
  const locale = i18n.language?.startsWith('en') ? 'en-GB' : 'fr-FR';

  useEffect(() => {
    let actif = true;
    enseignantAPI
      .mesClasses()
      .then((liste) => actif && setClasses(Array.isArray(liste) ? liste : []))
      .catch(() => actif && setClasses([]));
    return () => {
      actif = false;
    };
  }, []);

  const visibles = useMemo(() => (classes ?? []).filter((c) => !filtreCours || c.id_cours === Number(filtreCours)), [classes, filtreCours]);

  // Par défaut : la première (séance en cours, sinon la prochaine)
  useEffect(() => {
    if (!valeur && visibles.length) onChange(visibles[0]);
  }, [valeur, visibles, onChange]);

  if (classes === null) return <Skeleton height={56} />;
  if (!visibles.length) return <Alert severity="info">{t('classes.aucune')}</Alert>;

  const seance = (c) => {
    const s = c.prochaine_seance;
    if (!s) return t('classes.sansSeance');
    const jour = new Date(`${s.date}T12:00:00`).toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' });
    return [c.en_cours ? t('classes.enCours', { fin: s.heure_fin }) : t('classes.prochaine', { date: jour, heure: s.heure_debut }), s.salle].filter(Boolean).join(' · ');
  };

  return (
    <TextField
      select
      label={label ?? t('classes.label')}
      value={cleClasse(valeur)}
      onChange={(e) => onChange(visibles.find((c) => cleClasse(c) === e.target.value) ?? null)}
      helperText={t('classes.aide')}
      SelectProps={{ renderValue: (cle) => {
        const c = visibles.find((x) => cleClasse(x) === cle);
        return c ? `${c.code_cours} ${c.nom_cours} · ${c.nom_groupe}` : '';
      } }}
    >
      {visibles.map((c) => (
        <MenuItem key={cleClasse(c)} value={cleClasse(c)}>
          <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {c.code_cours} {c.nom_cours} · {c.nom_groupe}
              </Typography>
              {c.en_cours && <Chip size="small" color="success" label={t('classes.enCoursCourt')} />}
            </Box>
            <Typography variant="caption" color="text.secondary">
              {t('classes.effectif', { count: c.effectif })} · {seance(c)}
            </Typography>
          </Box>
        </MenuItem>
      ))}
    </TextField>
  );
}
