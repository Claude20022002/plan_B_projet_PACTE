import React from "react";
import { AbsoluteFill } from "remotion";
import { BrowserFrame, BROWSER_BAR, Line, Screen } from "../components/Frames";
import { fadeUp, useEnter } from "../components/motion";
import { BEAT, C } from "../theme";

const BW = 1100;

/**
 * Un écran du site dans son navigateur, à droite, et ce qu'il apporte, à gauche. Sert au tableau
 * de l'enseignant (scène 4) et à celui de l'administration (scène 10) : deux captures réelles du
 * 11 octobre 2026, prises sur la plateforme de démonstration.
 * `origine` : point fixe du zoom lent, en % de la capture (là où l'œil doit aller).
 */
export const M4Site: React.FC<{ capture: string; titre: string; suite: string; lignes: [string, string]; origine?: string }> = ({ capture, titre, suite, lignes, origine = "45% 30%" }) => {
  const cadre = useEnter(6, 28);
  const l1 = useEnter(4);
  const hauteur = (BW * 9) / 16 + BROWSER_BAR;
  const entrees = [useEnter(3 * BEAT), useEnter(7 * BEAT)];

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div style={{ position: "absolute", left: 110, top: 320, width: 600 }}>
        <Line size={64} style={fadeUp(l1)}>{titre}</Line>
        <Line size={64} color={C.inkSoft} style={{ ...fadeUp(l1), marginTop: 10 }}>{suite}</Line>
        {lignes.map((ligne, i) => (
          <Line key={ligne} size={40} weight={400} color={C.inkSoft} style={{ ...fadeUp(entrees[i]), marginTop: i === 0 ? 40 : 20 }}>
            {ligne}
          </Line>
        ))}
      </div>
      <BrowserFrame width={BW} style={{ left: 760, top: (1080 - hauteur) / 2, opacity: cadre, transform: `translateX(${(1 - cadre) * 300}px)` }}>
        <Screen src={capture} srcW={1920} srcH={1080} width={BW} origin={origine} zoom={[1, 1.1]} duration={240} />
      </BrowserFrame>
    </AbsoluteFill>
  );
};
