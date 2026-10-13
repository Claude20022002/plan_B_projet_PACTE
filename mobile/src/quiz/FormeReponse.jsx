import Svg, { Path } from 'react-native-svg';
import { TRACES_FORMES } from '../../../shared/quiz/formes.js';

/**
 * Forme d'une réponse de quiz (triangle, losange, cercle, carré, étoile, hexagone) : la même qu'au
 * projecteur, pour que l'étudiant retrouve d'un coup d'œil la réponse qu'il vise (DESIGN.md).
 */
export default function FormeReponse({ forme, taille = 48, couleur = '#FFFFFF' }) {
  return (
    <Svg width={taille} height={taille} viewBox="0 0 24 24" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Path d={TRACES_FORMES[forme] ?? TRACES_FORMES.cercle} fill={couleur} />
    </Svg>
  );
}
