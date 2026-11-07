// Direction artistique de PactePromo (DA.md) : fond clair cassé, encre, une couleur d'accent
// (le marine HESTIM), une seule famille de caractères en deux graisses, des ressorts doux.
import { loadFont } from "@remotion/google-fonts/Manrope";
import { Easing } from "remotion";

const manrope = loadFont("normal", { weights: ["500", "800"], subsets: ["latin", "latin-ext"] });

/** Manrope, 500 pour les phrases, 800 pour les titres. */
export const POLICE = manrope.fontFamily;

/** Les trois couleurs de la vidéo. Les avatars et les captures gardent leurs propres teintes. */
export const P = {
  fond: "#F7F7F5",
  encre: "#0E0F12",
  accent: "#001861",
  encreDouce: "rgba(14,15,18,0.6)",
  accentPale: "rgba(0,24,97,0.08)",
} as const;

/** Statut « reporté » de l'application : seule couleur d'état utilisée, et seulement pour ce statut. */
export const ORANGE_STATUT = "#F26322";

/** Courbe de toutes les entrées et sorties. */
export const DOUX = Easing.bezier(0.22, 1, 0.36, 1);

/** Ressort amorti, sans rebond. */
export const RESSORT = { damping: 200, stiffness: 90, mass: 1 } as const;

export const OMBRE = "0 30px 80px rgba(14,15,18,0.14), 0 6px 18px rgba(14,15,18,0.08)";

export const BORNES = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
