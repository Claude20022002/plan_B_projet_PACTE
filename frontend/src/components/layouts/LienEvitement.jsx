import { useTranslation } from 'react-i18next';
import { Box } from '@mui/material';
import { ds } from '../../design-system/tokens';

/** Identifiant de la zone principale, cible du lien d'évitement. */
export const ID_CONTENU = 'contenu';

/**
 * Lien « Aller au contenu » (WCAG 2.4.1, recette du 20 octobre, M-13) : premier arrêt de la touche
 * Tab, caché tant qu'il n'a pas le focus. Il fallait 17 Tab pour passer le menu et atteindre le
 * tableau de l'étudiant. Le focus va sur la zone principale, qui le reçoit (tabIndex -1).
 */
export default function LienEvitement() {
  const { t } = useTranslation();

  const aller = (e) => {
    e.preventDefault();
    document.getElementById(ID_CONTENU)?.focus();
  };

  return (
    <Box
      component="a"
      href={`#${ID_CONTENU}`}
      onClick={aller}
      sx={{
        position: 'fixed',
        top: 8,
        left: 8,
        zIndex: (theme) => theme.zIndex.tooltip + 1,
        px: 2,
        py: 1,
        borderRadius: `${ds.radius.sm}px`,
        bgcolor: 'background.paper',
        color: 'text.primary',
        fontWeight: 600,
        boxShadow: 3,
        outline: `2px solid ${ds.brand.orange}`,
        // Hors de l'écran tant qu'il n'a pas le focus : invisible à la souris, premier arrêt au clavier
        transform: 'translateY(-200%)',
        '&:focus': { transform: 'none' },
      }}
    >
      {t('nav.allerAuContenu')}
    </Box>
  );
}
