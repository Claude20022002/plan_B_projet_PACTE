import React from "react";
import { AbsoluteFill } from "remotion";
import { BrowserFrame, BROWSER_BAR, Line, Screen } from "../components/Frames";
import { fadeUp, useEnter } from "../components/motion";
import { C } from "../theme";

const BW = 1280;

/**
 * Un plan de la vidéo « Direction » : un écran du site en grand (les deux tiers de l'image), qui se
 * resserre lentement sur le détail qui prouve, et un seul titre dessous, le bénéfice en six mots.
 * `zoom` : de l'échelle de départ à celle d'arrivée ; `origine` : le point de la capture qui reste
 * fixe, en % (là où l'œil doit finir).
 */
export const D1PlanSite: React.FC<{ capture: string; titre: string; zoom: [number, number]; origine: string; duree: number }> = ({ capture, titre, zoom, origine, duree }) => {
  const cadre = useEnter(2, 22);
  const texte = useEnter(8);
  const hauteur = (BW * 9) / 16 + BROWSER_BAR;

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <BrowserFrame width={BW} style={{ left: (1920 - BW) / 2, top: 44, opacity: cadre, transform: `translateY(${(1 - cadre) * 60}px) scale(${0.96 + 0.04 * cadre})` }}>
        <Screen src={capture} srcW={1920} srcH={1080} width={BW} origin={origine} zoom={zoom} duration={duree} />
      </BrowserFrame>
      <Line size={104} style={{ ...fadeUp(texte, 26), position: "absolute", left: 60, right: 60, top: 44 + hauteur + 38, textAlign: "center" }}>
        {titre}
      </Line>
    </AbsoluteFill>
  );
};
