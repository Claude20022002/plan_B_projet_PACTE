import { AdsClick, CheckBox, CompareArrows, FormatListNumbered, Notes, Numbers, RadioButtonChecked, ShortText, TextFields, ToggleOn } from '@mui/icons-material';

/** Icône de chaque type de question du Studio quiz (libellés : studio.types.<type>.nom). */
const ICONES_TYPES = {
  choix_unique: RadioButtonChecked,
  choix_multiple: CheckBox,
  vrai_faux: ToggleOn,
  reponse_courte: ShortText,
  numerique: Numbers,
  texte_trous: TextFields,
  association: CompareArrows,
  ordre: FormatListNumbered,
  zone_image: AdsClick,
  reponse_libre: Notes,
};

export function IconeType({ type, ...props }) {
  const Icone = ICONES_TYPES[type] ?? Notes;
  return <Icone aria-hidden {...props} />;
}

