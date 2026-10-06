import { loadFont as loadCondensed } from "@remotion/google-fonts/BarlowCondensed";
import { loadFont as loadBarlow } from "@remotion/google-fonts/Barlow";

const condensed = loadCondensed("normal", { weights: ["600", "700"], subsets: ["latin", "latin-ext"] });
const barlow = loadBarlow("normal", { weights: ["400", "600"], subsets: ["latin", "latin-ext"] });

export const FONT_TITLE = condensed.fontFamily;
export const FONT_TEXT = barlow.fontFamily;

export const C = {
  bg: "#0B0B0D",
  tile: "#212124",
  hinge: "#000000",
  rule: "#2C2C30",
  ink: "#F2F1EC",
  inkSoft: "#A6A6AC",
  navy: "#001861",
  // Couleurs de statut : uniquement pour des statuts, jamais pour décorer.
  onTime: "#3FCB74",
  delayed: "#F26322",
  cancelled: "#FF5A5F",
  chrome: "#161618",
} as const;

export const FPS = 30;
/** 120 BPM : un temps = 15 images. */
export const BEAT = 15;
export const RADIUS = 14;
export const SHADOW = "0 24px 60px rgba(0,0,0,0.55), 0 4px 14px rgba(0,0,0,0.4)";

/** Ressort amorti, sans rebond. */
export const SPRING_SOFT = { damping: 200, stiffness: 120, mass: 1 } as const;
