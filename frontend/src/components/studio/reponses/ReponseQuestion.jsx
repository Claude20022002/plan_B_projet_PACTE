import { ReponseChoix, ReponseVraiFaux } from './ReponsesChoix';
import { ReponseCourte, ReponseLibre, ReponseNumerique, ReponseTrous } from './ReponsesSaisie';
import { ReponseAssociation, ReponseOrdre, ReponseZone } from './ReponsesInteractives';

const WIDGETS = {
  choix_unique: ReponseChoix,
  choix_multiple: ReponseChoix,
  vrai_faux: ReponseVraiFaux,
  reponse_courte: ReponseCourte,
  numerique: ReponseNumerique,
  texte_trous: ReponseTrous,
  association: ReponseAssociation,
  ordre: ReponseOrdre,
  zone_image: ReponseZone,
  reponse_libre: ReponseLibre,
};

/**
 * Zone de réponse d'une question, quel que soit son type. Mêmes composants pendant l'épreuve
 * (`onChange`), en correction (`correction` : statut et bonne réponse) et dans l'aperçu de l'éditeur.
 */
export default function ReponseQuestion({ question, valeur = null, onChange = () => {}, desactive = false, correction = null, srcMedia = null, media = null }) {
  const Widget = WIDGETS[question.type];
  if (!Widget) return null;
  return <Widget question={question} valeur={valeur} onChange={onChange} desactive={desactive || Boolean(correction)} correction={correction} src={srcMedia} description={media?.description} />;
}
