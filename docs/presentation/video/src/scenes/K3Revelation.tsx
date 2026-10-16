import React from "react";
import { AbsoluteFill } from "remotion";
import { Halo, Reflet } from "../components/Camera";
import { Embleme } from "../components/Embleme";
import { FlapText } from "../components/Flap";
import { C } from "../theme";

/**
 * Keynote · 3 · la révélation, après le noir : un halo s'ouvre, les douze triangles s'assemblent,
 * un reflet de lumière traverse l'image, puis le nom tombe en volets. Pas de phrase : le nom suffit.
 */
export const K3Revelation: React.FC = () => (
  <AbsoluteFill style={{ background: C.bg, alignItems: "center", justifyContent: "center" }}>
    <Halo debut={2} taille={1300} />
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 72 }}>
      <Embleme start={4} size={260} stagger={1.5} />
      <FlapText text="HESTIM PLANNER" start={48} fontSize={124} stagger={2} flip={5} hiddenBefore />
    </div>
    <Reflet debut={36} duree={26} intensite={0.16} />
  </AbsoluteFill>
);
