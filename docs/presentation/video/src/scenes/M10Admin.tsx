import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { BrowserFrame, BROWSER_BAR, Line, Screen } from "../components/Frames";
import { fadeUp, ramp, useEnter } from "../components/motion";
import { BEAT, C } from "../theme";

const BW = 1080;

/**
 * 10 · l'administration : l'emploi du temps du mois au format officiel de l'école, puis les heures
 * faites par enseignant (« Suivi du réalisé », capture du 11 octobre 2026). Deux captures réelles,
 * données fictives. Le responsable de filière, qui prépare la maquette, tient dans le sous-titre.
 */
export const M10Admin: React.FC<{ duree: number }> = ({ duree }) => {
  const frame = useCurrentFrame();
  const suivi = duree / 2; // les heures du mois remplacent l'emploi du temps à mi-scène
  const cadre = useEnter(6, 28);
  const l1 = useEnter(4);
  const l2 = useEnter(3 * BEAT);
  const l3 = useEnter(suivi + 4);
  const hauteur = (BW * 9) / 16 + BROWSER_BAR;

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div style={{ position: "absolute", left: 110, top: 290, width: 620 }}>
        <Line size={66} style={fadeUp(l1)}>Un emploi du temps</Line>
        <Line size={66} color={C.inkSoft} style={{ ...fadeUp(l1), marginTop: 10 }}>sans conflit.</Line>
        <Line size={42} weight={400} color={C.inkSoft} style={{ ...fadeUp(l2), marginTop: 40 }}>
          Préparé par les responsables de filière.
        </Line>
        <Line size={42} weight={400} color={C.inkSoft} style={{ ...fadeUp(l3), marginTop: 22 }}>
          Suivi de bout en bout : les heures faites, enseignant par enseignant.
        </Line>
      </div>
      <BrowserFrame width={BW} style={{ left: 780, top: (1080 - hauteur) / 2, opacity: cadre, transform: `translateX(${(1 - cadre) * 300}px)` }}>
        <Screen src="captures/admin-04b-edt-mensuel-classe.png" srcW={1920} srcH={1080} width={BW} origin="0% 20%" zoom={[1, 1.04]} duration={duree} />
        <Screen src="captures/admin-05b-heures-du-mois.png" srcW={1920} srcH={1080} width={BW} origin="0% 20%" zoom={[1, 1.04]} duration={duree} opacity={ramp(frame, suivi, suivi + 10)} />
      </BrowserFrame>
    </AbsoluteFill>
  );
};
