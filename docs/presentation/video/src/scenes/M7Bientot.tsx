import React from "react";
import { AbsoluteFill } from "remotion";
import { FlapText } from "../components/Flap";
import { Line, PhoneFrame, Screen } from "../components/Frames";
import { fadeUp, useEnter, usePortrait } from "../components/motion";
import { C } from "../theme";
import { phoneGeometry } from "./S3Convergence";

/**
 * 7 · « Bientôt » : deux fonctions à venir, sur le téléphone de l'étudiant. Les deux écrans sont
 * des MAQUETTES (captures/maquette-quiz-mobile-*.png), pas des captures de l'application : le mot
 * « BIENTÔT » reste donc à l'écran pendant toute la scène.
 * `duree` (en images) cale l'entrée du second téléphone.
 */
export const M7Bientot: React.FC<{ duree: number }> = ({ duree }) => {
  const portrait = usePortrait();
  const second = Math.round(duree * 0.4);
  const t1 = useEnter(18, 26);
  const t2 = useEnter(second, 26);
  const c1 = useEnter(28);
  const c2 = useEnter(second + 10);

  const screenH = portrait ? 880 : 770;
  const { screenW, phoneW, phoneH } = phoneGeometry(screenH);
  const telephone = (src: string, entree: number, left: number, top: number) => (
    <PhoneFrame screenHeight={screenH} style={{ left, top, opacity: entree, transform: `translateY(${(1 - entree) * 90}px)` }}>
      {/* Maquettes de 780 × 1688 : un peu moins hautes que l'écran, la marge du bas reste noire */}
      <Screen src={src} srcW={780} srcH={1688} width={screenW} zoom={[1, 1]} />
    </PhoneFrame>
  );

  if (portrait) {
    const ecart = 50;
    const gauche = (1080 - 2 * phoneW - ecart) / 2;
    const haut = 520;
    return (
      <AbsoluteFill style={{ background: C.bg }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 190, display: "flex", flexDirection: "column", alignItems: "center", gap: 30 }}>
          <FlapText text="BIENTÔT" start={0} fontSize={120} stagger={2} flip={5} hiddenBefore />
          <Line size={48} weight={400} color={C.inkSoft}>sur le téléphone de chacun</Line>
        </div>
        {telephone("captures/maquette-quiz-mobile-illustration.png", t1, gauche, haut)}
        {telephone("captures/maquette-quiz-mobile-video.png", t2, gauche + phoneW + ecart, haut)}
        <Line size={44} style={{ ...fadeUp(c1), position: "absolute", left: gauche, width: phoneW, top: haut + phoneH + 30, textAlign: "center" }}>
          Le schéma de la question
        </Line>
        <Line size={44} style={{ ...fadeUp(c2), position: "absolute", left: gauche + phoneW + ecart, width: phoneW, top: haut + phoneH + 30, textAlign: "center" }}>
          Un extrait vidéo, avec le son
        </Line>
      </AbsoluteFill>
    );
  }

  const haut = 96;
  const gauche = 250;
  const droite = 1920 - gauche - phoneW;
  const milieu = gauche + phoneW;
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      {telephone("captures/maquette-quiz-mobile-illustration.png", t1, gauche, haut)}
      {telephone("captures/maquette-quiz-mobile-video.png", t2, droite, haut)}
      <div style={{ position: "absolute", left: milieu, width: droite - milieu, top: 250, display: "flex", flexDirection: "column", alignItems: "center", gap: 34, textAlign: "center" }}>
        <FlapText text="BIENTÔT" start={0} fontSize={104} stagger={2} flip={5} hiddenBefore />
        <Line size={42} weight={400} color={C.inkSoft}>sur le téléphone de chacun</Line>
        <Line size={46} style={{ ...fadeUp(c1), marginTop: 70, width: 560 }}>← Le schéma de la question, avec ses réponses.</Line>
        <Line size={46} style={{ ...fadeUp(c2), marginTop: 26, width: 560 }}>Un extrait vidéo, avec le son, puis sa question. →</Line>
      </div>
    </AbsoluteFill>
  );
};
