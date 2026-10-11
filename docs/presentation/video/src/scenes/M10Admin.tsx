import React from "react";
import { AbsoluteFill } from "remotion";
import { BrowserFrame, BROWSER_BAR, Line, Screen } from "../components/Frames";
import { fadeUp, useEnter } from "../components/motion";
import { BEAT, C } from "../theme";

const BW = 1060;

/**
 * 10 · l'administration : l'emploi du temps du mois, au format officiel de l'école (capture
 * réelle). Les phrases disent ce que l'école y gagne ; la séance du matin « faite » dans les
 * heures du mois attend son écran (lot R-11, côté écran) et n'est donc pas montrée.
 */
export const M10Admin: React.FC = () => {
  const cadre = useEnter(6, 28);
  const l1 = useEnter(4);
  const l2 = useEnter(3 * BEAT);
  const l3 = useEnter(7 * BEAT);
  const hauteur = (BW * 9) / 16 + BROWSER_BAR;

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div style={{ position: "absolute", left: 120, top: 330, width: 640 }}>
        <Line size={66} style={fadeUp(l1)}>Un emploi du temps</Line>
        <Line size={66} color={C.inkSoft} style={{ ...fadeUp(l1), marginTop: 10 }}>généré sans conflit.</Line>
        <Line size={42} weight={400} color={C.inkSoft} style={{ ...fadeUp(l2), marginTop: 40 }}>
          Salles, enseignants, groupes : chaque séance est vérifiée.
        </Line>
        <Line size={42} weight={400} color={C.inkSoft} style={{ ...fadeUp(l3), marginTop: 22 }}>
          Le PDF officiel reste disponible.
        </Line>
      </div>
      <BrowserFrame width={BW} style={{ left: 800, top: (1080 - hauteur) / 2, opacity: cadre, transform: `translateX(${(1 - cadre) * 300}px)` }}>
        <Screen src="captures/web-09-edt-mensuel.png" srcW={1920} srcH={1080} width={BW} origin="55% 40%" zoom={[1, 1.08]} duration={240} />
      </BrowserFrame>
    </AbsoluteFill>
  );
};
