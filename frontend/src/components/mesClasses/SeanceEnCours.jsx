import { useTranslation } from 'react-i18next';
import { Box, Button, Card, CardContent, Typography } from '@mui/material';
import { FactCheck, LocalLibrary, Quiz } from '@mui/icons-material';
import { libelleSeance, nomClasse } from './classe';

/**
 * La séance en cours, en tête de « Mes classes » (lot E-4) : une action principale, l'appel ;
 * les supports de cours en action secondaire. Les quiz se créent et se lancent depuis Activités :
 * ils ne sont pas attachés à une classe (retours du 21 octobre).
 * `options` : { devoirs } dit si les devoirs sont proposés.
 */
export default function SeanceEnCours({ classe, locale, options, onAppel, onDevoir, onSupports }) {
  const { t } = useTranslation();
  const seance = classe.prochaine_seance;
  const appelPrincipal = seance?.appel && seance.appel !== 'ferme';

  return (
    <Card variant="outlined" sx={{ borderColor: 'success.main', borderWidth: 2 }}>
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Box>
          <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 600 }}>
            ● {t('classes.enCoursCourt')} · {classe.code_cours}
          </Typography>
          <Typography variant="h6" component="h2" sx={{ fontWeight: 600, lineHeight: 1.25 }}>
            {nomClasse(classe)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {[t('classes.effectif', { count: classe.effectif }), libelleSeance(classe, t, locale)].join(' · ')}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {/* L'appel : l'action principale tant qu'il n'est pas terminé, puis « Voir l'appel » */}
          {seance?.appel && (
            <Button size="large" variant={appelPrincipal ? 'contained' : 'outlined'} startIcon={<FactCheck />} onClick={() => onAppel(seance)}>
              {t(`classes.page.appel.${seance.appel}`)}
            </Button>
          )}
          {/* Devoirs masqués (lot D-1) : le bouton revient avec l'interrupteur */}
          {options.devoirs && (
            <Button variant="outlined" startIcon={<Quiz />} onClick={() => onDevoir(classe)}>
              {t('classes.page.devoir')}
            </Button>
          )}
          <Button variant="outlined" startIcon={<LocalLibrary />} onClick={() => onSupports(classe)}>
            {t('classes.page.supports')}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
