import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Embleme } from "../components/Embleme";
import { Line, PhoneFrame, Screen } from "../components/Frames";
import { fadeUp, ramp, useEnter } from "../components/motion";
import { C, FONT_TEXT, FONT_TITLE } from "../theme";
import { PHONE_LEFT, PHONE_SCREEN_H, PHONE_TOP, phoneGeometry } from "./S3Convergence";

const ENTREE = 30; // 18,0 s du film
const SORTIE = 90; // 20,0 s
const LOUPE = 1.5;

/**
 * Bannière de notification, seule incrustation dessinée de la vidéo : style d'une notification
 * de téléphone, pastille orange du statut « reporté ».
 */
const Notification: React.FC<{ w: number }> = ({ w }) => {
  const k = w / 400;
  return (
    <div
      style={{
        margin: `0 ${12 * k}px`,
        padding: `${12 * k}px ${14 * k}px`,
        borderRadius: 18 * k,
        background: "#212124",
        boxShadow: `0 ${10 * k}px ${30 * k}px rgba(0,0,0,0.45), 0 0 0 1px ${C.rule}`,
        display: "flex",
        gap: 12 * k,
        alignItems: "center",
        fontFamily: FONT_TEXT,
      }}
    >
      <Embleme start={-100} size={30 * k} tile style={{ flex: "none", borderRadius: 9 * k }} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13 * k, color: C.inkSoft, letterSpacing: "0.02em" }}>HESTIM Planner · maintenant</div>
        <div style={{ display: "flex", alignItems: "center", gap: 7 * k, marginTop: 2 * k }}>
          <div style={{ width: 8 * k, height: 8 * k, borderRadius: 4 * k, background: C.delayed }} />
          <div style={{ fontFamily: FONT_TITLE, fontSize: 18 * k, fontWeight: 700, letterSpacing: "0.06em", color: C.ink }}>COURS REPORTÉ</div>
        </div>
        <div style={{ fontSize: 14 * k, color: C.ink, marginTop: 2 * k, lineHeight: 1.25 }}>Big Data · jeudi 13:30 · salle ST-S02</div>
      </div>
    </div>
  );
};

/** 5 · 17–22 s : l'accueil de l'app ; une alerte de report descend, reste 2 s, puis remonte. */
export const S5Alerte: React.FC = () => {
  const frame = useCurrentFrame();
  const l1 = useEnter(6);
  const l2 = useEnter(ENTREE);
  const entre = useEnter(ENTREE, 18);
  const sort = ramp(frame, SORTIE, SORTIE + 10);
  const { screenW, phoneW } = phoneGeometry();

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div style={{ position: "absolute", left: 140, top: 380, width: 900 }}>
        <Line size={88} style={fadeUp(l1)}>Prévenu à la seconde,</Line>
        <Line size={88} color={C.inkSoft} style={{ ...fadeUp(l2), marginTop: 12 }}>
          sur son téléphone.
        </Line>
      </div>
      <PhoneFrame screenHeight={PHONE_SCREEN_H} style={{ left: PHONE_LEFT, top: PHONE_TOP }}>
        <Screen src="captures/mobile-38-tableau.png" srcW={1080} srcH={2400} width={screenW} zoom={[1, 1.04]} origin="50% 30%" />
      </PhoneFrame>
      {/* Bannière agrandie (1,5 × l'écran) et centrée sur le téléphone : lisible au fond d'une salle */}
      <div
        style={{
          position: "absolute",
          left: PHONE_LEFT + phoneW / 2 - (screenW * LOUPE) / 2,
          top: PHONE_TOP + PHONE_SCREEN_H * 0.06,
          width: screenW * LOUPE,
          transform: `translateY(${(1 - entre) * -260 - sort * 260}px)`,
          opacity: frame < ENTREE ? 0 : Math.min(entre * 2, 1) * (1 - sort),
        }}
      >
        <Notification w={screenW * LOUPE} />
      </div>
    </AbsoluteFill>
  );
};
