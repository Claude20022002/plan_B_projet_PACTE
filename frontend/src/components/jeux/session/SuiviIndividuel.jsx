import { useTranslation } from 'react-i18next';
import { Box, Typography } from '@mui/material';
import Panneau, { Capitales, LignePanneau } from '../Panneau';
import { Personnage } from '../SceneJoueur';
import { ds } from '../../../design-system/tokens';

/**
 * Session individuelle, côté enseignant : chaque étudiant joue sur son téléphone ; l'enseignant
 * voit qui a rejoint et les défis réussis depuis le lancement, le plus avancé en tête.
 */
export default function SuiviIndividuel({ session }) {
  const { t } = useTranslation();
  const { participants } = session;
  return (
    <Panneau titre={t('sessionsJeu.individuel.titre')} droite={t('sessionsJeu.participants', { count: participants.length })} titreId="participants-titre">
      {participants.length === 0 && (
        <LignePanneau premier>
          <Typography variant="body2" sx={{ color: ds.board.letterDim }}>{t('sessionsJeu.individuel.personne')}</Typography>
        </LignePanneau>
      )}
      {participants.map((p, i) => (
        <LignePanneau
          key={p.id_user}
          premier={i === 0}
          action={
            <Capitales sx={{ fontSize: '0.875rem', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
              {t('sessionsJeu.individuel.defis', { count: p.defis })} · {t('jeux.points', { count: p.points })}
            </Capitales>
          }
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Personnage avatar={p.avatar} idUser={p.id_user} taille={32} />
            <Box sx={{ fontWeight: 600 }}>{p.prenom} {p.nom}</Box>
          </Box>
        </LignePanneau>
      ))}
    </Panneau>
  );
}
