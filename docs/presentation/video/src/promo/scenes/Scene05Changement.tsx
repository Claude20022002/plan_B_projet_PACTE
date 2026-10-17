// Scène 5 (30 – 40 s), fonctionnalité 2 : un changement, tout le monde prévenu.
// Nadia reporte un cours sur le panneau de l'administration (le statut passe à « Reportée ») ;
// la capture glisse, le téléphone de Salma arrive et l'alerte de report y descend.
import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Navigateur, Telephone } from "../components/Cadre";
import { Curseur, Plan, Titre } from "../components/Elements";
import { Personnage } from "../components/Personnage";
import { selon, useFormat } from "../format";
import { BORNES, DOUX, ORANGE_STATUT, POLICE } from "../theme";

/** Image (locale) où le téléphone remplace le panneau. */
const BASCULE = 140;
const CLIC = 62;
const ALERTE = 178;

/** Le statut de la ligne « Introduction à la cybersécurité… 4A IIIA » repeint en « Reportée ». */
const StatutReporte: React.FC<{ image: number }> = ({ image }) => {
  const { fps } = useVideoConfig();
  const p = spring({ frame: image - CLIC - 4, fps, config: { damping: 200, stiffness: 160 } });
  return (
    <>
      <div style={{ position: "absolute", left: 376, top: 474, width: 924, height: 62, border: `4px solid ${ORANGE_STATUT}`, borderRadius: 6, opacity: p }} />
      <div style={{ position: "absolute", left: 1170, top: 488, width: 124, height: 34, background: "#0B0B0D", opacity: p }} />
      <div style={{ position: "absolute", left: 1176, top: 490, fontFamily: "Barlow Condensed, Arial Narrow, sans-serif", fontWeight: 700, fontSize: 26, letterSpacing: "0.04em", color: ORANGE_STATUT, opacity: p, transform: `scale(${0.8 + 0.2 * p})`, transformOrigin: "100% 50%" }}>
        REPORTÉE
      </div>
    </>
  );
};

/** La notification de l'application, dessinée d'après son alerte « Cours reporté ». */
const Alerte: React.FC<{ image: number }> = ({ image }) => {
  const { fps } = useVideoConfig();
  const p = spring({ frame: image - ALERTE, fps, config: { damping: 200, stiffness: 120 } });
  return (
    <div style={{ position: "absolute", left: 40, right: 40, top: 70, transform: `translateY(${(1 - p) * -320}px)`, opacity: p, background: "#FFFFFF", borderRadius: 44, padding: "34px 40px", boxShadow: "0 20px 60px rgba(0,0,0,0.35)", fontFamily: POLICE }}>
      <div style={{ fontSize: 30, color: "#5F6778", fontWeight: 500 }}>HESTIM Planner · maintenant</div>
      <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 10 }}>
        <div style={{ width: 24, height: 24, borderRadius: 99, background: ORANGE_STATUT }} />
        <div style={{ fontSize: 46, fontWeight: 800, color: "#0E0F12" }}>Cours reporté</div>
      </div>
      <div style={{ fontSize: 34, color: "#0E0F12", fontWeight: 500, marginTop: 8, lineHeight: 1.3 }}>Cybersécurité et NIS2 · jeudi 15:30 · G-S05</div>
    </div>
  );
};

export const Scene05Changement: React.FC<{ duree: number }> = ({ duree }) => {
  const f = useCurrentFrame();
  const fmt = useFormat();
  const cadre = selon(fmt, { x: 600, y: 230, l: 1220 }, { x: 50, y: 400, l: 980 }, { x: 310, y: 210, l: 740 });
  const tel = selon(fmt, { x: 1080, y: 210, h: 740 }, { x: 470, y: 360, h: 1080 }, { x: 560, y: 180, h: 760 });
  const nadia = selon(fmt, { x: 290, sol: 975, h: 700 }, { x: 250, sol: 1700, h: 640 }, { x: 160, sol: 1010, h: 560 });
  const salma = selon(fmt, { x: 640, sol: 975, h: 700 }, { x: 250, sol: 1700, h: 640 }, { x: 300, sol: 1010, h: 600 });
  const part = interpolate(f, [BASCULE - 12, BASCULE + 12], [0, 1], { ...BORNES, easing: DOUX });
  const vient = interpolate(f, [BASCULE, BASCULE + 24], [0, 1], { ...BORNES, easing: DOUX });

  return (
    <Plan duree={duree}>
      <Titre de={6} taille={selon(fmt, 72, 80, 60)} style={selon(fmt, { left: 600, top: 96 } as React.CSSProperties, { left: 60, right: 60, top: 170, textAlign: "center" }, { left: 310, right: 40, top: 66 })}>
        Un changement, tout le monde prévenu.
      </Titre>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - part, transform: `translateX(${-40 * part}px)` }}>
        <Navigateur src="captures/admin-01-tableau.png" x={cadre.x} y={cadre.y} largeur={cadre.l} zoom={interpolate(f, [0, BASCULE], [1, 1.06], BORNES)} origine={[900, 500]}>
          <StatutReporte image={f} />
          <Curseur de={[1500, 900]} vers={[1236, 512]} depart={16} arrivee={54} clic={CLIC} taille={52} />
        </Navigateur>
        <Personnage qui="nadia" x={nadia.x} sol={nadia.sol} hauteur={nadia.h} pose="tablette" imageLocale={f} />
      </div>
      <div style={{ position: "absolute", inset: 0, opacity: vient, transform: `translateX(${40 * (1 - vient)}px)` }}>
        <Telephone src="captures/app-01-tableau.png" x={tel.x} y={tel.y} hauteur={tel.h} style={{ transform: `rotate(${interpolate(f, [BASCULE, duree], [2, -1], BORNES)}deg)` }}>
          <Alerte image={f} />
        </Telephone>
        <Personnage qui="salma" x={salma.x} sol={salma.sol} hauteur={salma.h} pose="telephone" entree={BASCULE} imageLocale={f} />
      </div>
    </Plan>
  );
};
