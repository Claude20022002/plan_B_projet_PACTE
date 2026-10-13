import React from "react";
import { AbsoluteFill } from "remotion";
import { Line, PhoneFrame, Screen } from "../components/Frames";
import { TelephoneFormes } from "../components/TelephoneFormes";
import { fadeUp, useEnter, usePortrait } from "../components/motion";
import { C } from "../theme";
import { phoneGeometry } from "./S3Convergence";

// Les trois formes d'un quiz, dans l'ordre où elles entrent
const FORMES = ["En direct, dans la salle.", "Avec un schéma, à son rythme.", "Avec un extrait vidéo."];

/**
 * 7 · les formes d'un quiz, sur trois téléphones : le quiz en direct (ce que l'application affiche
 * aujourd'hui, redessiné), la question avec un schéma et la question sur un extrait vidéo. Ces deux
 * dernières sont des MAQUETTES (captures/maquette-quiz-mobile-*.png) : l'application n'affiche pas
 * encore d'image ni de vidéo dans une question, et la scène ne le dit plus à l'écran.
 * `duree` (en images) cale l'entrée des téléphones.
 */
export const M7Formes: React.FC<{ duree: number }> = ({ duree }) => {
  const portrait = usePortrait();
  const titre = useEnter(4);
  const pas = Math.round(duree * 0.18);
  const entrees = [useEnter(10, 26), useEnter(10 + pas, 26), useEnter(10 + 2 * pas, 26)];
  const legendes = [useEnter(18), useEnter(18 + pas), useEnter(18 + 2 * pas)];

  const screenH = portrait ? 660 : 640;
  const ecart = portrait ? 30 : 120;
  const haut = portrait ? 700 : 236;
  const { screenW, phoneW, phoneH } = phoneGeometry(screenH);
  const gauche = ((portrait ? 1080 : 1920) - 3 * phoneW - 2 * ecart) / 2;
  const marge = portrait ? 10 : 50; // la légende dépasse un peu du téléphone

  const ecrans = [
    <TelephoneFormes key="direct" largeur={screenW} chrono={14} choisie={null} touche={0} />,
    // Maquettes de 780 × 1688 : un peu moins hautes que l'écran, la marge du bas reste noire
    <Screen key="schema" src="captures/maquette-quiz-mobile-illustration.png" srcW={780} srcH={1688} width={screenW} zoom={[1, 1]} />,
    <Screen key="video" src="captures/maquette-quiz-mobile-video.png" srcW={780} srcH={1688} width={screenW} zoom={[1, 1]} />,
  ];

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Line size={portrait ? 74 : 64} style={{ ...fadeUp(titre), position: "absolute", left: 60, right: 60, top: portrait ? 420 : 112, textAlign: "center" }}>
        Un quiz, plusieurs formes.
      </Line>
      {ecrans.map((ecran, i) => {
        const left = gauche + i * (phoneW + ecart);
        return (
          <React.Fragment key={FORMES[i]}>
            <PhoneFrame screenHeight={screenH} style={{ left, top: haut, opacity: entrees[i], transform: `translateY(${(1 - entrees[i]) * 90}px)` }}>
              {ecran}
            </PhoneFrame>
            <Line size={portrait ? 36 : 38} weight={400} color={C.inkSoft} style={{ ...fadeUp(legendes[i]), position: "absolute", left: left - marge, width: phoneW + 2 * marge, top: haut + phoneH + 22, textAlign: "center" }}>
              {FORMES[i]}
            </Line>
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  );
};
