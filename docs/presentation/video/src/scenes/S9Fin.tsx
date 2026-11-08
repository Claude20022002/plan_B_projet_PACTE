import React from "react";
import { AbsoluteFill } from "remotion";
import { Embleme } from "../components/Embleme";
import { FlapText } from "../components/Flap";
import { Line } from "../components/Frames";
import { fadeUp, useEnter, usePortrait } from "../components/motion";
import { C, FONT_TITLE } from "../theme";

/**
 * 9 · 38–42 s : l'emblème se réassemble en accéléré, le nom et les supports (web, iPhone, Android)
 * basculent en volets ;
 * dernière seconde immobile pour enchaîner sur la première slide.
 */
// `supports` remplace la ligne des plateformes (la vidéo Keynote dit « Déjà en ligne » : l'application
// n'est pas encore sur les stores)
export const S9Fin: React.FC<{ phrase?: string; action?: string; adresse?: string; supports?: string }> = ({ phrase: texte = "L'école, à l'heure.", action, adresse, supports }) => {
  const portrait = usePortrait();
  const cadre = useEnter(0, 12);
  const phrase = useEnter(46);
  // L'action arrive quand les volets ont fini de tourner
  const appel = useEnter(104);

  return (
    <AbsoluteFill style={{ background: C.bg, alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: 40, border: `3px solid ${C.navy}`, borderRadius: 18, opacity: cadre }} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: portrait ? 56 : 44 }}>
        <Embleme start={2} size={portrait ? 260 : 190} stagger={1} stiffness={300} />
        {portrait ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <FlapText text="HESTIM" start={22} fontSize={120} stagger={2} flip={4} hiddenBefore />
            <FlapText text="PLANNER" start={30} fontSize={120} stagger={2} flip={4} hiddenBefore />
          </div>
        ) : (
          <FlapText text="HESTIM PLANNER" start={22} fontSize={96} stagger={2} flip={4} hiddenBefore />
        )}
        <Line size={portrait ? 60 : 54} style={{ ...fadeUp(phrase), maxWidth: portrait ? 940 : 1700, textAlign: "center" }}>
          {texte}
        </Line>
        {supports ? (
          <FlapText text={supports} start={54} fontSize={portrait ? 62 : 56} stagger={1} flip={4} hiddenBefore />
        ) : portrait ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <FlapText text="WEB · IPHONE" start={54} fontSize={62} stagger={1} flip={4} hiddenBefore />
            <FlapText text="ANDROID" start={62} fontSize={62} stagger={1} flip={4} hiddenBefore />
          </div>
        ) : (
          <FlapText text="WEB · IPHONE · ANDROID" start={54} fontSize={50} stagger={1} flip={4} hiddenBefore />
        )}
        {action ? (
          <div style={{ ...fadeUp(appel), padding: portrait ? "16px 34px" : "12px 30px", borderRadius: 6, background: C.navy, color: "#FFFFFF", fontFamily: FONT_TITLE, fontWeight: 700, fontSize: portrait ? 46 : 42, letterSpacing: "0.06em", textTransform: "uppercase", textAlign: "center", maxWidth: portrait ? 900 : 1500 }}>
            {action}
            {adresse ? <div style={{ marginTop: 4, fontSize: portrait ? 54 : 50, letterSpacing: "0.02em", textTransform: "none" }}>{adresse}</div> : null}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
