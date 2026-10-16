import React from "react";
import { AbsoluteFill } from "remotion";
import { Destination } from "../components/Destination";
import { FlapText } from "../components/Flap";
import { C } from "../theme";

/**
 * Keynote · 1 · l'ouverture « à froid », sans logo : le discours vient de dire « treize heures
 * vingt-neuf » ; le panneau l'affiche, puis cherche la salle sans la trouver. La case de la salle
 * se fixera au plan 4, quand le téléphone apparaît (même graine : mêmes lettres qui tournent).
 */
export const K1Froid: React.FC = () => (
  <AbsoluteFill style={{ background: C.bg, alignItems: "center", justifyContent: "center" }}>
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 64 }}>
      <FlapText text="13:29" start={8} fontSize={230} stagger={3} flip={5} fakes={[3, 6]} hiddenBefore />
      <div style={{ display: "flex", alignItems: "center", gap: 56 }}>
        <FlapText text="SALLE" start={34} fontSize={120} stagger={2} flip={4} hiddenBefore />
        <Destination texte="G-S05" debut={48} fontSize={120} seed="salle" />
      </div>
    </div>
  </AbsoluteFill>
);
