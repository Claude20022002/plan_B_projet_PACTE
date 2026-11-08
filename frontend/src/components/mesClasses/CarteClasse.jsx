import { useTranslation } from 'react-i18next';
import { Box, Card, CardActionArea, CardContent, Typography } from '@mui/material';
import { libelleSeance, nomClasse } from './classe';

/**
 * Carte d'une classe dans « Mes classes » (lot E-4) : module, groupe, effectif, prochaine séance.
 * Toute la carte ouvre l'espace de la classe ; si l'appel du jour est resté ouvert, elle ouvre
 * directement l'onglet Appel. Pas de bouton dans la carte : une seule cible, lisible au doigt.
 */
export default function CarteClasse({ classe, locale, onOuvrir }) {
  const { t } = useTranslation();
  const seance = classe.prochaine_seance;
  const appelOuvert = seance?.appel === 'ouvert';

  return (
    <Card variant="outlined" sx={{ height: '100%', borderColor: classe.en_cours ? 'success.main' : 'divider' }}>
      <CardActionArea
        onClick={() => onOuvrir(classe, appelOuvert ? 'appel' : null)}
        aria-label={t('classes.page.ouvrir', { classe: nomClasse(classe) })}
        sx={{ height: '100%', alignItems: 'stretch' }}
      >
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minHeight: 22 }}>
            <Typography variant="caption" color="text.secondary">
              {classe.code_cours}
            </Typography>
            {classe.en_cours && (
              <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 600 }}>
                ● {t('classes.enCoursCourt')}
              </Typography>
            )}
          </Box>
          <Typography variant="subtitle1" component="h3" sx={{ fontWeight: 600, lineHeight: 1.3 }}>
            {classe.nom_cours}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {[classe.nom_groupe, t('classes.effectif', { count: classe.effectif })].join(' · ')}
          </Typography>
          <Typography variant="body2">{libelleSeance(classe, t, locale)}</Typography>
          {appelOuvert && (
            <Typography variant="body2" sx={{ color: 'warning.main', fontWeight: 600 }}>
              {t('classes.page.appelOuvertCarte')}
            </Typography>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
