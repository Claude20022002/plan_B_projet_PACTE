import React from "react";
import { AbsoluteFill } from "remotion";
import { FlapText, flapWidth, tileSize } from "../components/Flap";
import { Line } from "../components/Frames";
import { fadeUp, useEnter } from "../components/motion";
import { BEAT, C } from "../theme";

const FS = 96;
const LIGNES = [
  { chiffre: "90 S", legende: "pour planifier tout un semestre" },
  { chiffre: "1 COMPTE", legende: "au lieu de six outils" },
  { chiffre: "0 PUBLICITÉ", legende: "pour les jeux et les quiz" },
];

const Ligne: React.FC<{ i: number; colonne: number }> = ({ i, colonne }) => {
  const start = i * BEAT * 4; // un chiffre toutes les 2 s
  const legende = useEnter(start + 20);
  const { height } = tileSize(FS);
  return (
    <div style={{ display: "flex", alignItems: "center", height }}>
      <div style={{ width: colonne }}>
        <FlapText text={LIGNES[i].chiffre} start={start} fontSize={FS} stagger={2} flip={5} hiddenBefore />
      </div>
      <Line size={50} weight={400} color={C.inkSoft} style={{ ...fadeUp(legende, 10), marginLeft: 64 }}>
        {LIGNES[i].legende}
      </Line>
    </div>
  );
};

/** 8 · trois chiffres en volets, un toutes les 2 s, avec leur légende ; ils restent ensemble 3 s. */
export const S8Chiffres: React.FC = () => {
  const colonne = Math.max(...LIGNES.map((l) => flapWidth(l.chiffre, FS)));
  return (
    <AbsoluteFill style={{ background: C.bg, justifyContent: "center", paddingLeft: 170 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 70 }}>
        {LIGNES.map((_, i) => (
          <Ligne key={i} i={i} colonne={colonne} />
        ))}
      </div>
    </AbsoluteFill>
  );
};
