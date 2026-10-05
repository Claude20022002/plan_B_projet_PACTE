import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { ds } from '../../design-system/tokens';
import Panneau from './Panneau';

/**
 * Terminal d'une partie (shared/terminal/jeu.js) habillé en panneau : invite, sortie, erreurs.
 * Clavier : Entrée exécute, Tab complète, ↑ ↓ parcourent l'historique, Ctrl+L efface l'écran.
 * La sortie est un journal annoncé poliment aux lecteurs d'écran.
 *
 * `onCommande(ligne)` est appelé après chaque commande exécutée (vérification de l'objectif).
 */
const TerminalPanneau = forwardRef(function TerminalPanneau({ partie, titre, etat, onCommande, hauteur = 360 }, ref) {
  const { t } = useTranslation();
  const [lignes, setLignes] = useState([]);
  const [saisie, setSaisie] = useState('');
  const [invite, setInvite] = useState(partie?.invite ?? '');
  const [suggestions, setSuggestions] = useState([]);
  const curseurHistorique = useRef(null);
  const champ = useRef(null);
  const ecran = useRef(null);

  useImperativeHandle(ref, () => ({ focus: () => champ.current?.focus() }), []);

  // Nouvelle partie : écran vide, invite du nouveau scénario
  useEffect(() => {
    setLignes([]);
    setSaisie('');
    setSuggestions([]);
    setInvite(partie?.invite ?? '');
    curseurHistorique.current = null;
  }, [partie]);

  useEffect(() => {
    ecran.current?.scrollTo({ top: ecran.current.scrollHeight });
  }, [lignes, suggestions]);

  const ajouter = (...nouvelles) => setLignes((l) => [...l, ...nouvelles].slice(-400));

  const executer = () => {
    if (!partie) return;
    const ligne = saisie;
    setSaisie('');
    setSuggestions([]);
    curseurHistorique.current = null;
    if (!ligne.trim()) {
      ajouter({ type: 'commande', invite, texte: '' });
      return;
    }
    const r = partie.executer(ligne);
    const sorties = [];
    if (r.erreur) sorties.push({ type: 'erreur', texte: r.erreur.replace(/\n$/, '') });
    if (r.sortie) sorties.push({ type: 'sortie', texte: r.sortie.replace(/\n$/, '') });
    if (r.effacer) setLignes(sorties);
    else ajouter({ type: 'commande', invite, texte: ligne }, ...sorties);
    setInvite(partie.invite);
    onCommande?.(ligne);
  };

  const parcourirHistorique = (sens) => {
    const historique = partie?.historique ?? [];
    if (!historique.length) return;
    const actuel = curseurHistorique.current ?? historique.length;
    const suivant = Math.max(0, Math.min(historique.length, actuel + sens));
    curseurHistorique.current = suivant;
    setSaisie(historique[suivant] ?? '');
  };

  const surTouche = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      executer();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const r = partie?.completer(saisie);
      if (!r) return;
      setSaisie(r.valeur);
      setSuggestions(r.suggestions.length > 1 ? r.suggestions : []);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      parcourirHistorique(-1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      parcourirHistorique(1);
    } else if (e.key.toLowerCase() === 'l' && e.ctrlKey) {
      e.preventDefault();
      setLignes([]);
    }
  };

  const couleur = { sortie: ds.board.letter, erreur: ds.board.letterDim, commande: ds.board.letter };

  return (
    <Panneau titre={titre} droite={etat} component="div">
      <Box
        ref={ecran}
        onClick={() => champ.current?.focus()}
        sx={{
          height: { xs: 300, md: hauteur },
          overflowY: 'auto',
          px: { xs: 1.25, sm: 2 },
          py: 1.5,
          fontFamily: ds.font.mono,
          fontSize: { xs: '0.8125rem', sm: '0.875rem' },
          lineHeight: 1.6,
          cursor: 'text',
          borderRadius: `${ds.radius.md}px`,
          // Focus clavier visible (anneau orange), le champ lui-même n'a pas de contour
          '&:focus-within': { outline: `2px solid ${ds.brand.orange}`, outlineOffset: -2 },
          // Le texte du terminal se sélectionne et se copie normalement
          userSelect: 'text',
        }}
      >
        <Box role="log" aria-live="polite" aria-label={t('jeux.terminal.sortie')}>
          {lignes.map((l, i) => (
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
        {suggestions.length > 0 && (
          <Box component="pre" sx={{ m: 0, font: 'inherit', whiteSpace: 'pre-wrap', color: ds.board.letterDim }}>
            {suggestions.join('   ')}
          </Box>
        )}
        <Box component="label" sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
          <Box component="span" sx={{ color: ds.board.letterDim, flexShrink: 0, maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {invite}
          </Box>
          <Box
            component="input"
            ref={champ}
            value={saisie}
            onChange={(e) => setSaisie(e.target.value)}
            onKeyDown={surTouche}
            disabled={!partie}
            aria-label={t('jeux.terminal.saisie')}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            sx={{
              flex: 1,
              minWidth: 0,
              p: 0,
              border: 0,
              outline: 0,
              bgcolor: 'transparent',
              color: ds.board.letter,
              caretColor: ds.brand.orange,
              font: 'inherit',
            }}
          />
        </Box>
      </Box>
    </Panneau>
  );
});

export default TerminalPanneau;
