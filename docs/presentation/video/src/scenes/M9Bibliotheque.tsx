import React from "react";
import { AbsoluteFill } from "remotion";
import { Line, PhoneFrame, Screen } from "../components/Frames";
import { fadeUp, useEnter } from "../components/motion";
import { BEAT, C } from "../theme";
import { phoneGeometry } from "./S3Convergence";

const SCREEN_H = 800;
const GAP = 56;
const ESPACES = 5 * BEAT; // le second téléphone arrive à 2,5 s

/**
 * 9 · la Bibliothèque et la connexion unique. À gauche, les supports d'un cours ; à droite, le
 * panneau des espaces de l'application (capture du 11 octobre 2026), qui dit lui-même « sans vous
 * reconnecter ». Planner répond à « où et quand », la Bibliothèque à « avec quoi on travaille ».
 */
export const M9Bibliotheque: React.FC<{ duree: number }> = ({ duree }) => {
  const titre = useEnter(4);
  const supports = useEnter(6, 26);
  const espaces = useEnter(ESPACES, 26);
  const lignes = [useEnter(3 * BEAT), useEnter(ESPACES + 2 * BEAT)];
  const { screenW, phoneW, phoneH } = phoneGeometry(SCREEN_H);
  const gauche = 1920 - 110 - (phoneW * 2 + GAP);
  const top = (1080 - phoneH) / 2;

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div style={{ position: "absolute", left: 110, top: 300, width: 800 }}>
        <Line size={72} style={fadeUp(titre)}>Une seule connexion.</Line>
        <Line size={46} weight={400} color={C.inkSoft} style={{ ...fadeUp(lignes[0]), marginTop: 44 }}>
          Planner dit où et quand.
        </Line>
        <Line size={46} weight={400} color={C.inkSoft} style={{ ...fadeUp(lignes[1]), marginTop: 20 }}>
          La Bibliothèque, avec quoi on travaille : les supports de chaque cours, les stages, les projets.
        </Line>
      </div>
      <PhoneFrame screenHeight={SCREEN_H} style={{ left: gauche, top, opacity: supports, transform: `translateY(${(1 - supports) * 120}px)` }}>
        <Screen src="captures/mobile-39-supports-module.png" srcW={1080} srcH={2400} width={screenW} zoom={[1, 1.04]} origin="50% 20%" duration={duree} />
      </PhoneFrame>
      <PhoneFrame screenHeight={SCREEN_H} style={{ left: gauche + phoneW + GAP, top, opacity: espaces, transform: `translateY(${(1 - espaces) * 120}px)` }}>
        <Screen src="captures/app-07-espaces.png" srcW={1080} srcH={2400} width={screenW} zoom={[1, 1]} duration={duree} />
      </PhoneFrame>
    </AbsoluteFill>
  );
};
