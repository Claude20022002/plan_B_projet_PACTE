import React from "react";
import { AbsoluteFill } from "remotion";
import { FlapCounter, FlapText } from "../components/Flap";
import { Line } from "../components/Frames";
import { fadeUp, useEnter } from "../components/motion";
import { C } from "../theme";

const TAILLE = 170;
// Les trois rangées tombent sur les temps (0,2 s, 2 s, 4 s) : la bande-son y place ses volets
const RANGEES = [
  { debut: 6, label: "séances placées", chiffre: "2620", compteur: true },
  { debut: 60, label: "pour un semestre entier", chiffre: "90 S", compteur: false },
  { debut: 120, label: "conflit de salle, d'enseignant ou de groupe", chiffre: "0", compteur: false },
];

/**
 * Keynote · 9 · le grand chiffre : l'emploi du temps d'un semestre, généré. Chiffres mesurés sur les
 * données de démonstration aux dimensions de HESTIM (docs/presentation/discours-3-minutes.md) ;
 * la note du bas le dit, à l'écran comme à l'oral.
 */
export const K8Chiffres: React.FC = () => {
  const note = useEnter(140);
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      {RANGEES.map((r, i) => (
        <Rangee key={i} {...r} top={110 + i * 270} />
      ))}
      <Line size={30} weight={400} color={C.inkSoft} style={{ ...fadeUp(note), position: "absolute", left: 0, right: 0, bottom: 44, textAlign: "center" }}>
        Semestre de démonstration aux dimensions de HESTIM : 11 filières, 76 enseignants, 41 salles.
      </Line>
    </AbsoluteFill>
  );
};

const Rangee: React.FC<{ debut: number; label: string; chiffre: string; compteur: boolean; top: number }> = ({ debut, label, chiffre, compteur, top }) => {
  const texte = useEnter(debut + 14);
  return (
    <div style={{ position: "absolute", left: 200, top, display: "flex", alignItems: "center", gap: 70 }}>
      <div style={{ width: 760, display: "flex", justifyContent: "flex-end" }}>
        {compteur ? (
          <FlapCounter value={chiffre} start={debut} fontSize={TAILLE} />
        ) : (
          <FlapText text={chiffre} start={debut} fontSize={TAILLE} stagger={2} flip={4} hiddenBefore />
        )}
      </div>
      <Line size={64} weight={400} style={{ ...fadeUp(texte), maxWidth: 780 }}>
        {label}
      </Line>
    </div>
  );
};
