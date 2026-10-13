import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Heure, Line, PhoneFrame, Screen } from "../components/Frames";
import { fadeUp, ramp, useEnter, usePortrait } from "../components/motion";
import { C, FONT_TEXT } from "../theme";
import { PHONE_LEFT, PHONE_SCREEN_H, PHONE_TOP, PORTRAIT_SCREEN_H, PORTRAIT_TOP, phoneGeometry, portraitLeft } from "./S3Convergence";

// Trois écrans de l'application, captures du 11 octobre 2026 (nouvelle barre du bas, avec Scanner)
const ECRANS = [
  { src: "captures/app-01-tableau.png", phrase: "La prochaine séance, sa salle en grand.", fond: "#001861", tableau: true },
  { src: "captures/app-03c-mois.png", phrase: "Le mois d'un coup d'œil.", fond: "#001861", tableau: false },
  { src: "captures/app-02-fiche-seance.png", phrase: "Chaque cours : salle, heure, enseignant.", fond: "#000b2c", tableau: false },
];

// L'heure de l'histoire : le cours de 13 h 30 vient de commencer (la capture date de 14 h 03)
export const HEURE_ETUDIANTE = "13:32";

/** Le tableau du jour (app-01-tableau.png) remis à l'heure : barre d'état et « Mis à jour à ». */
export const HeureTableau: React.FC = () => (
  <>
    <Heure texte={HEURE_ETUDIANTE} />
    <div style={{ position: "absolute", left: 40, top: 340, width: 300, height: 56, background: "#f3f4f7", display: "flex", alignItems: "center", paddingLeft: 4, fontFamily: FONT_TEXT, fontSize: 30, color: "#5f6778" }}>
      Mis à jour à {HEURE_ETUDIANTE}
    </div>
  </>
);

/**
 * 3 · l'étudiante et son emploi du temps : le tableau du jour, le mois, puis le détail d'un cours.
 * Les trois écrans se succèdent à parts égales ; `duree` (en images) est celle de la scène.
 */
export const M3Etudiante: React.FC<{ duree: number }> = ({ duree }) => {
  const frame = useCurrentFrame();
  const portrait = usePortrait();
  const titre = useEnter(6);
  const part = duree / ECRANS.length;
  const screenH = portrait ? PORTRAIT_SCREEN_H : PHONE_SCREEN_H;
  const { screenW } = phoneGeometry(screenH);
  // Opacité de l'écran i : il apparaît en fondu à son tour et reste sous le suivant
  const visible = (i: number) => (i === 0 ? 1 : ramp(frame, part * i, part * i + 10));
  // Sa phrase s'efface quand la suivante arrive
  const lisible = (i: number) => visible(i) * (i === ECRANS.length - 1 ? 1 : 1 - ramp(frame, part * (i + 1), part * (i + 1) + 6));

  const ecran = ECRANS.map((e, i) => (
    <div key={e.src} style={{ position: "absolute", inset: 0, opacity: visible(i) }}>
      <Screen src={e.src} srcW={1080} srcH={2400} width={screenW} zoom={[1, 1.03]} origin="50% 30%" duration={duree}>
        {e.tableau ? <HeureTableau /> : <Heure texte={HEURE_ETUDIANTE} fond={e.fond} />}
      </Screen>
    </div>
  ));
  const phrases = (taille: number, centre: boolean) => (
    <div style={{ position: "relative", marginTop: centre ? 18 : 40, height: taille * 1.3 }}>
      {ECRANS.map((e, i) => (
        <Line key={e.src} size={taille} weight={400} color={C.inkSoft} style={{ position: "absolute", left: 0, right: 0, top: 0, opacity: lisible(i) }}>
          {e.phrase}
        </Line>
      ))}
    </div>
  );

  if (portrait) {
    return (
      <AbsoluteFill style={{ background: C.bg }}>
        <div style={{ position: "absolute", left: 80, right: 80, top: 170, textAlign: "center" }}>
          <Line size={74} style={fadeUp(titre)}>Son emploi du temps, sur son téléphone.</Line>
          {phrases(48, true)}
        </div>
        <PhoneFrame screenHeight={screenH} style={{ left: portraitLeft(), top: PORTRAIT_TOP }}>
          {ecran}
        </PhoneFrame>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div style={{ position: "absolute", left: 140, top: 380, width: 900 }}>
        <Line size={72} style={fadeUp(titre)}>Son emploi du temps</Line>
        <Line size={72} color={C.inkSoft} style={{ ...fadeUp(titre), marginTop: 12 }}>
          arrive sur son téléphone.
        </Line>
        {phrases(46, false)}
      </div>
      <PhoneFrame screenHeight={PHONE_SCREEN_H} style={{ left: PHONE_LEFT, top: PHONE_TOP }}>
        {ecran}
      </PhoneFrame>
    </AbsoluteFill>
  );
};
