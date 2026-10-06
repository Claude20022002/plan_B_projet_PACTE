import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Button, ButtonBase, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { ds } from '../../design-system/tokens';
import { AVATARS, avatarDe } from '../../../../shared/jeux/avatars.js';
import { Capitales } from './Panneau';

/**
 * Personnages et décor des jeux (Kenney, CC0, repris de CatéGO : public/img/jeux). Le décor est
 * fait de silhouettes blanches teintées par un masque CSS aux couleurs du marine HESTIM.
 */
const image = (chemin) => `/img/jeux/${chemin}`;

/** Personnage statique (pas d'animation) */
export function Personnage({ avatar, idUser, taille = 48, sx }) {
  return (
    <Box
      component="img"
      src={image(`personnages/${avatarDe(idUser, avatar)}.png`)}
      alt=""
      aria-hidden
      sx={{
        width: taille,
        height: taille,
        objectFit: 'contain',
        flexShrink: 0,
        ...sx,
      }}
    />
  );
}

const Silhouette = ({ fichier, couleur, sx }) => (
  <Box
    aria-hidden
    sx={{
      position: 'absolute',
      bgcolor: couleur,
      mask: `url(${image(`decor/${fichier}`)}) center / contain no-repeat`,
      WebkitMask: `url(${image(`decor/${fichier}`)}) center / contain no-repeat`,
      ...sx,
    }}
  />
);

/**
 * Le joueur dans sa scène : ciel marine, nuages, arbres et collines, son personnage (qu'il peut
 * changer), ses points et ses défis réussis tous jeux confondus.
 */
export default function SceneJoueur({ user, profil, jeux, onChoisir }) {
  const { t } = useTranslation();
  const [ouvert, setOuvert] = useState(false);
  const avatar = profil?.avatar;
  const total = (jeux ?? []).reduce((s, j) => ({ points: s.points + j.progression.points, reussis: s.reussis + j.progression.reussis }), { points: 0, reussis: 0 });

  return (
    <Box component="section" aria-label={t('jeux.joueur.titre')} sx={{ position: 'relative', height: { xs: 150, sm: 168 }, overflow: 'hidden', borderRadius: `${ds.radius.lg}px`, bgcolor: ds.brand.navy }}>
      <Silhouette fichier="cloud1.png" couleur="#24397F" sx={{ top: 14, right: { xs: 24, sm: 80 }, width: 96, height: 64 }} />
      <Silhouette fichier="cloud4.png" couleur="#24397F" sx={{ top: 50, right: { xs: 130, sm: 220 }, width: 60, height: 38 }} />
      <Silhouette fichier="cloud7.png" couleur="#24397F" sx={{ top: 10, left: '46%', width: 54, height: 32 }} />
      <Silhouette fichier="tree03.png" couleur={ds.brand.navyDeep} sx={{ bottom: 30, right: { xs: 22, sm: 64 }, width: 36, height: 70 }} />
      <Silhouette fichier="tree08.png" couleur={ds.brand.navyDeep} sx={{ bottom: 26, right: { xs: 62, sm: 104 }, width: 26, height: 48 }} />
      <Silhouette fichier="hills1.png" couleur={ds.brand.navyDeep} sx={{ bottom: 0, left: 0, right: 0, height: { xs: 56, sm: 72 }, maskSize: '100% 100%', WebkitMaskSize: '100% 100%' }} />

      <Box sx={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'flex-end', gap: 2, px: { xs: 2, sm: 3 }, pb: 2.5 }}>
        <ButtonBase
          onClick={() => setOuvert(true)}
          aria-label={t('jeux.joueur.changer')}
          sx={{ position: 'relative', borderRadius: `${ds.radius.md}px`, p: 0.5, '&.Mui-focusVisible': { outline: `2px solid ${ds.brand.orange}`, outlineOffset: 2 } }}
        >
          <Personnage avatar={avatar} idUser={user?.id_user} taille={72} />
          <Box aria-hidden sx={{ position: 'absolute', right: 0, bottom: 2, width: 22, height: 22, borderRadius: '50%', bgcolor: ds.board.letter, color: ds.board.ground, display: 'grid', placeItems: 'center', border: `2px solid ${ds.brand.navy}` }}>
            <EditIcon sx={{ fontSize: 12 }} />
          </Box>
        </ButtonBase>
        <Box sx={{ pb: { xs: 3.5, sm: 4.5 }, minWidth: 0, color: '#FFFFFF' }}>
          <Capitales component="p" sx={{ m: 0, fontSize: { xs: '1.5rem', sm: '1.75rem' }, fontWeight: 700, lineHeight: 1.1 }}>
            {user?.prenom}
          </Capitales>
          <Capitales component="p" sx={{ m: 0, fontSize: '1.0625rem', fontVariantNumeric: 'tabular-nums' }}>
            {t('jeux.points', { count: total.points })}
          </Capitales>
          <Typography variant="body2" sx={{ color: '#C9D1EC' }}>
            {t('jeux.joueur.defisReussis', { count: total.reussis })}
          </Typography>
        </Box>
      </Box>

      <Dialog open={ouvert} onClose={() => setOuvert(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{t('jeux.joueur.personnage')}</DialogTitle>
        <DialogContent>
          <Box role="radiogroup" aria-label={t('jeux.joueur.personnage')} sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1.25 }}>
            {AVATARS.map((a, i) => {
              const actif = a === avatar;
              return (
                <ButtonBase
                  key={a}
                  role="radio"
                  aria-checked={actif}
                  aria-label={t('jeux.joueur.personnageN', { n: i + 1 })}
                  onClick={() => {
                    setOuvert(false);
                    onChoisir(a);
                  }}
                  sx={{
                    aspectRatio: '1',
                    borderRadius: `${ds.radius.md}px`,
                    bgcolor: ds.board.ground,
                    border: `2px solid ${actif ? ds.brand.orange : 'transparent'}`,
                    '&:hover': { borderColor: actif ? ds.brand.orange : ds.board.letterDim },
                    '&.Mui-focusVisible': { outline: `2px solid ${ds.brand.navy}`, outlineOffset: 2 },
                  }}
                >
                  <Personnage avatar={a} taille={56} />
                </ButtonBase>
              );
            })}
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
            {t('jeux.joueur.credit')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOuvert(false)}>{t('common.close')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
