import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box, Button, TextField } from '@mui/material';
import Panneau, { Capitales, LignePanneau } from '../Panneau';
import { boutonPanneau, boutonPanneauPlein } from '../styles';
import { sessionsJeuAPI } from '../../../services/api';
import { ds } from '../../../design-system/tokens';
import { jeuParCode, libelle } from '../../../../../shared/jeux/catalogue.js';

/**
 * Sessions de jeu sur la page Activités. Enseignant : ses sessions encore ouvertes, pour revenir
 * au QR code ou au tableau (rien s'il n'en a pas). Étudiant : la saisie du code projeté, pour qui
 * ne scanne pas le QR code.
 */
export default function PanneauSessions({ enseignant }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [code, setCode] = useState('');

  useEffect(() => {
    if (!enseignant) return undefined;
    let actif = true;
    sessionsJeuAPI.ouvertes().then((r) => actif && setSessions(r?.data ?? [])).catch(() => {});
    return () => {
      actif = false;
    };
  }, [enseignant]);

  if (enseignant) {
    if (!sessions.length) return null;
    return (
      <Panneau titre={t('sessionsJeu.enCours')} titreId="sessions-jeu-titre">
        {sessions.map((s, i) => (
          <LignePanneau
            key={s.id_session_jeu}
            premier={i === 0}
            lampe={ds.board.live}
            action={
              <Button size="small" variant="outlined" sx={boutonPanneau} onClick={() => navigate(`/jeux/sessions/${s.id_session_jeu}`)}>
                {t('sessionsJeu.reprendre')}
              </Button>
            }
          >
            <Capitales sx={{ display: 'block', fontSize: '1rem' }}>{libelle(jeuParCode(s.code_jeu)?.titre, i18n.language)}</Capitales>
            <Box sx={{ fontSize: '0.875rem', color: ds.board.letterDim }}>
              {[s.module ? `${s.module.code} · ${s.module.nom}` : null, t(`sessionsJeu.modes.${s.mode}.nom`), s.code].filter(Boolean).join(' · ')}
            </Box>
          </LignePanneau>
        ))}
      </Panneau>
    );
  }

  const valeur = code.replace(/[\s-]/g, '').toUpperCase();
  return (
    <Panneau titre={t('sessionsJeu.rejoindre.titre')} titreId="rejoindre-jeu-titre">
      <LignePanneau premier>
        <Box component="form" onSubmit={(e) => { e.preventDefault(); if (valeur.length === 6) navigate(`/jeux/session/${valeur}`); }} sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            size="small"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="ABC234"
            inputProps={{ maxLength: 8, 'aria-label': t('sessionsJeu.rejoindre.code'), autoCapitalize: 'characters', autoComplete: 'off', style: { letterSpacing: '0.18em', fontWeight: 700 } }}
            sx={{ width: 180, '& .MuiInputBase-root': { bgcolor: 'background.paper' } }}
          />
          <Button type="submit" size="small" variant="contained" sx={boutonPanneauPlein} disabled={valeur.length !== 6}>
            {t('sessionsJeu.rejoindre.action')}
          </Button>
          <Box sx={{ fontSize: '0.875rem', color: ds.board.letterDim, flexBasis: '100%' }}>{t('sessionsJeu.rejoindre.aide')}</Box>
        </Box>
      </LignePanneau>
    </Panneau>
  );
}
