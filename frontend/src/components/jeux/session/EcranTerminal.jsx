import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box } from '@mui/material';
import { ds } from '../../../design-system/tokens';
import Panneau from '../Panneau';

/**
 * Terminal joué au tableau avec la classe : il affiche ce que donnent les commandes gardées par le
 * serveur (shared/terminal/tableau.js). Avec `onEnvoyer`, une ligne de saisie permet à
 * l'enseignant de taper lui-même une commande ; sans, l'écran est en lecture seule (téléphones).
 */
export default function EcranTerminal({ ecran, titre, etat, onEnvoyer, envoi = false, hauteur = 360 }) {
  const { t } = useTranslation();
  const [saisie, setSaisie] = useState('');
  const zone = useRef(null);

  useEffect(() => {
    zone.current?.scrollTo({ top: zone.current.scrollHeight });
  }, [ecran]);

  const envoyer = async (e) => {
    e.preventDefault();
    const ligne = saisie.trim();
    if (!ligne || envoi) return;
    if ((await onEnvoyer(ligne)) !== false) setSaisie('');
  };

  const couleur = { sortie: ds.board.letter, erreur: ds.board.letterDim, commande: ds.board.letter };

  return (
    <Panneau titre={titre} droite={etat} component="div">
      <Box
        ref={zone}
        sx={{ height: { xs: 260, md: hauteur }, overflowY: 'auto', px: { xs: 1.25, sm: 2 }, py: 1.5, fontFamily: ds.font.mono, fontSize: { xs: '0.8125rem', sm: '0.9375rem' }, lineHeight: 1.6, userSelect: 'text' }}
      >
        <Box role="log" aria-live="polite" aria-label={t('jeux.terminal.sortie')}>
          {ecran.lignes.map((l, i) => (
            <Box key={i} component="pre" sx={{ m: 0, font: 'inherit', whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: couleur[l.type], fontStyle: l.type === 'erreur' ? 'italic' : 'normal' }}>
              {l.type === 'commande' ? (
                <>
                  <Box component="span" sx={{ color: ds.board.letterDim }}>{l.invite} </Box>
                  {l.texte}
                </>
              ) : (
                l.texte
              )}
            </Box>
          ))}
        </Box>
        <Box component={onEnvoyer ? 'form' : 'div'} onSubmit={onEnvoyer ? envoyer : undefined} sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
          <Box component="span" sx={{ color: ds.board.letterDim, flexShrink: 0, maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {ecran.invite}
          </Box>
          {onEnvoyer && (
            <Box
              component="input"
              value={saisie}
              onChange={(e) => setSaisie(e.target.value)}
              disabled={envoi}
              aria-label={t('sessionsJeu.collectif.saisieProf')}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              maxLength={1000}
              sx={{ flex: 1, minWidth: 0, p: 0, border: 0, outline: 0, bgcolor: 'transparent', color: ds.board.letter, caretColor: ds.brand.orange, font: 'inherit' }}
            />
          )}
        </Box>
      </Box>
    </Panneau>
  );
}
