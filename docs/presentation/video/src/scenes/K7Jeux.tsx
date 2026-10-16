import React from "react";
import { AbsoluteFill } from "remotion";
import { FlapText } from "../components/Flap";
import { Line } from "../components/Frames";
import { fadeUp, useEnter } from "../components/motion";
import { C } from "../theme";

// Des jeux qui existent dans le code : Terminal Linux (main) et cinq des neuf simulations d'Alexis
// (branche jeux-pedagogique, docs/plans/jeux-pedagogiques.md). Ne montrer ce plan qu'une fois la
// branche fusionnée et déployée.
const JEUX: [string, string][] = [
  ["TERMINAL LINUX", "Informatique"],
  ["TRI CYBER", "Cybersécurité"],
  ["ROBOT ROUTE", "Robotique"],
  ["LABO DES SEUILS", "Intelligence artificielle"],
  ["PILOTE DES STOCKS", "Logistique"],
  ["BUDGET ERP", "Gestion"],
];

/**
 * Keynote · 8 · la bibliothèque de jeux : le titre, puis les noms des jeux qui tombent en volets,
 * chacun avec sa discipline, comme les destinations d'un panneau. Aucune fausse capture.
 */
export const K7Jeux: React.FC = () => {
  const titre = useEnter(2);
  const pied = useEnter(84);
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Line size={104} style={{ ...fadeUp(titre, 26), position: "absolute", left: 0, right: 0, top: 90, textAlign: "center" }}>
        Réviser en jouant.
      </Line>
      {JEUX.map(([nom, discipline], i) => (
        <Jeu key={nom} nom={nom} discipline={discipline} debut={14 + i * 7} left={i % 2 === 0 ? 170 : 1010} top={290 + Math.floor(i / 2) * 190} />
      ))}
      <Line size={56} weight={400} color={C.inkSoft} style={{ ...fadeUp(pied), position: "absolute", left: 0, right: 0, top: 900, textAlign: "center" }}>
        Rangés par module, choisis par l'enseignant.
      </Line>
    </AbsoluteFill>
  );
};

/** Un jeu du panneau : sa discipline au-dessus, son nom en volets. */
const Jeu: React.FC<{ nom: string; discipline: string; debut: number; left: number; top: number }> = ({ nom, discipline, debut, left, top }) => {
  const etiquette = useEnter(debut + 10);
  return (
    <div style={{ position: "absolute", left, top }}>
      <Line size={34} weight={400} color={C.inkSoft} style={{ ...fadeUp(etiquette, 10), marginBottom: 10 }}>
        {discipline}
      </Line>
      <FlapText text={nom} start={debut} fontSize={64} stagger={1} flip={4} hiddenBefore />
    </div>
  );
};
