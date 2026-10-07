import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { FlapCounter, FlapText } from "../components/Flap";
import { Line } from "../components/Frames";
import { fadeUp, ramp, useEnter } from "../components/motion";
import { BEAT, C, SHADOW } from "../theme";

const FS_TITRE = 72;
const RENOUVELLEMENT = 6 * BEAT; // le code change à 3 s : c'est ce qui empêche la fraude
const COMPTEUR = 4 * BEAT;

/**
 * 8 · l'appel en un scan (ce que l'école y gagne) : le titre en volets, le QR projeté qui se
 * renouvelle sous les yeux, le compteur de présents. Animation typographique, comme les
 * chiffres : l'écran d'appel n'a pas encore de capture réelle, on n'en invente pas.
 */
export const S8Appel: React.FC = () => {
  const frame = useCurrentFrame();
  const qr = useEnter(BEAT);
  const benefice = useEnter(3 * BEAT);
  const fraude = useEnter(RENOUVELLEMENT + 10);
  const presents = useEnter(COMPTEUR + 12);
  // Le code suivant remplace le premier en un battement de volet
  const bascule = ramp(frame, RENOUVELLEMENT, RENOUVELLEMENT + 6);
  const compression = 1 - Math.sin(bascule * Math.PI) * 0.06;

  return (
    <AbsoluteFill style={{ background: C.bg, flexDirection: "row", alignItems: "center", paddingLeft: 170, paddingRight: 170, gap: 120 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <FlapText text="L'APPEL" start={0} fontSize={FS_TITRE} stagger={2} flip={5} hiddenBefore />
        <FlapText text="EN 5 SECONDES" start={8} fontSize={FS_TITRE} stagger={2} flip={5} hiddenBefore style={{ marginTop: 14 }} />
        <Line size={46} style={{ ...fadeUp(benefice), marginTop: 56 }}>
          Les étudiants scannent, la liste se remplit.
        </Line>
        <Line size={40} weight={400} color={C.inkSoft} style={{ ...fadeUp(fraude), marginTop: 22 }}>
          Le code change toutes les 30 secondes : impossible de le passer à un absent.
        </Line>
        <div style={{ ...fadeUp(presents), display: "flex", alignItems: "center", gap: 28, marginTop: 56 }}>
          <FlapCounter value="28" start={COMPTEUR} fontSize={96} />
          <Line size={44} weight={400} color={C.inkSoft}>
            présents sur 30
            <br />
            sans papier
          </Line>
        </div>
      </div>
      <div
        style={{
          ...fadeUp(qr, 40),
          flex: "none",
          width: 560,
          height: 560,
          padding: 28,
          borderRadius: 28,
          background: "#FFFFFF",
          boxShadow: SHADOW,
          transform: `${fadeUp(qr, 40).transform} scaleY(${compression})`,
          position: "relative",
        }}
      >
        <Img src={staticFile("carrousel/qr.png")} style={{ position: "absolute", inset: 28, width: 504, height: 504, opacity: 1 - bascule }} />
        <Img src={staticFile("carrousel/qr-2.png")} style={{ position: "absolute", inset: 28, width: 504, height: 504, opacity: bascule }} />
      </div>
    </AbsoluteFill>
  );
};
