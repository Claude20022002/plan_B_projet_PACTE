import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Line, PhoneFrame } from "../components/Frames";
import { fadeUp, ramp, useEnter, usePortrait } from "../components/motion";
import { BEAT, C, FONT_TEXT } from "../theme";

const SCREENS = [
  "captures/mobile-21-tableau-planner-sombre.png",
  "captures/mobile-21-tableau-studylib-clair.png",
  "captures/mobile-26-terminal-reussite.png",
];
const THEME_SWITCH = BEAT * 3; // changement de thème sur un temps
const NOTIF_IN = BEAT * 5;
const TO_TERMINAL = BEAT * 7;
const XFADE = 6;

/** Notification « Quiz en cours » (texte repris de l'application). */
const Notification: React.FC<{ w: number }> = ({ w }) => {
  const k = w / 400;
  return (
    <div
      style={{
        margin: `0 ${12 * k}px`,
        padding: `${12 * k}px ${14 * k}px`,
        borderRadius: 18 * k,
        background: "rgba(33,33,36,0.97)",
        boxShadow: `0 ${10 * k}px ${30 * k}px rgba(0,0,0,0.45), 0 0 0 1px ${C.rule}`,
        display: "flex",
        gap: 12 * k,
        alignItems: "center",
        fontFamily: FONT_TEXT,
      }}
    >
      {/* Marque HESTIM (partie gauche du logo) sur pastille claire */}
      <div
        style={{
          width: 44 * k,
          height: 44 * k,
          borderRadius: 10 * k,
          background: C.ink,
          flex: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ width: 30 * k, height: 30 * k, overflow: "hidden" }}>
          <Img src={staticFile("logos/HESTIM.png")} style={{ height: 30 * k, width: "auto", display: "block" }} />
        </div>
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13 * k, color: C.inkSoft, letterSpacing: "0.02em" }}>HESTIM Planner · maintenant</div>
        <div style={{ display: "flex", alignItems: "center", gap: 7 * k, marginTop: 2 * k }}>
          <div style={{ width: 8 * k, height: 8 * k, borderRadius: 4 * k, background: C.onTime }} />
          <div style={{ fontSize: 18 * k, fontWeight: 600, color: C.ink }}>Quiz en cours</div>
        </div>
        <div style={{ fontSize: 14 * k, color: C.inkSoft, marginTop: 2 * k, lineHeight: 1.25 }}>
          Rejoignez la partie depuis l'application.
        </div>
      </div>
    </div>
  );
};

/** 5 · 17–22 s : le téléphone entre par la droite ; changement de thème, notification, terminal réussi. */
export const S5Mobile: React.FC = () => {
  const frame = useCurrentFrame();
  const portrait = usePortrait();
  const enter = useEnter(0, 24);
  const l1 = useEnter(6);
  const l2 = useEnter(THEME_SWITCH);
  const notif = useEnter(NOTIF_IN, 18);
  const notifOut = ramp(frame, TO_TERMINAL + XFADE, TO_TERMINAL + XFADE + 10);

  const screenH = portrait ? 1240 : 900;
  const screenW = (screenH * 1080) / 2400;
  const phoneW = screenW + Math.round(screenH * 0.014) * 2;

  const op = (i: number) => {
    if (i === 0) return 1;
    const at = i === 1 ? THEME_SWITCH : TO_TERMINAL;
    return ramp(frame, at, at + XFADE);
  };

  const phoneLeft = portrait ? (1080 - phoneW) / 2 : 1150;
  const phoneTop = portrait ? 560 : (1080 - screenH * 1.028) / 2;
  const slide = interpolate(enter, [0, 1], [portrait ? 1080 - phoneLeft + 40 : 1920 - phoneLeft + 40, 0]);

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div
        style={
          portrait
            ? { position: "absolute", left: 80, right: 80, top: 170, textAlign: "center" }
            : { position: "absolute", left: 140, top: 400, width: 820 }
        }
      >
        <Line size={portrait ? 84 : 88} style={fadeUp(l1)}>Dans la poche.</Line>
        <Line size={portrait ? 84 : 88} color={C.inkSoft} style={{ ...fadeUp(l2), marginTop: 12 }}>
          À votre style.
        </Line>
      </div>

      <PhoneFrame screenHeight={screenH} style={{ left: phoneLeft, top: phoneTop, transform: `translateX(${slide}px)` }}>
        {SCREENS.map((s, i) => (
          <Img
            key={s}
            src={staticFile(s)}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: op(i) }}
          />
        ))}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: screenH * 0.045,
            transform: `translateY(${(1 - notif) * -160 - notifOut * 160}px)`,
            opacity: frame < NOTIF_IN ? 0 : 1 - notifOut,
          }}
        >
          <Notification w={screenW} />
        </div>
      </PhoneFrame>
    </AbsoluteFill>
  );
};
