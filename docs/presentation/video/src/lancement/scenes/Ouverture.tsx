// Ouverture de la vidéo Lancement : l'accroche (un cours change de salle, et personne ne le sait),
// les outils éparpillés qui ne se parlent pas, puis la révélation du nom.
import React from "react";
import { interpolate, Sequence, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Embleme } from "../../components/Embleme";
import { ObjetDessine, type Objet } from "../../promo/components/Objets";
import { Personnage } from "../../promo/components/Personnage";
import { BORNES, DOUX, POLICE } from "../../promo/theme";
import { COULEURS as K, Fond, Mots, Noeud } from "../elements";
import { repere } from "../voix";

/** Le badge de la salle : G-S05 est barré, G-S03 tombe dessous. */
const Salle: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const barre = interpolate(f, [16, 26], [0, 1], { ...BORNES, easing: DOUX });
  const nouvelle = spring({ frame: f - 26, fps, config: { damping: 14, stiffness: 170 } });
  const style: React.CSSProperties = { fontFamily: POLICE, fontWeight: 800, fontSize: 120, letterSpacing: "0.02em", padding: "14px 44px", borderRadius: 24, background: "#FFFFFF", boxShadow: "0 24px 60px rgba(14,15,18,0.12)" };
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 470, display: "flex", justifyContent: "center", gap: 60, alignItems: "center" }}>
      <div style={{ ...style, position: "relative", color: K.encre, opacity: 1 - barre * 0.45 }}>
        G-S05
        <div style={{ position: "absolute", left: 30, top: "52%", height: 12, width: `calc((100% - 60px) * ${barre})`, background: K.orange, borderRadius: 6 }} />
      </div>
      <div style={{ ...style, color: K.marine, opacity: nouvelle, transform: `translateY(${(1 - nouvelle) * -80}px)` }}>G-S03</div>
    </div>
  );
};

const NOTIFS: { type: Objet; x: number; y: number; r: number }[] = [
  { type: "courriel", x: 300, y: 220, r: -8 }, { type: "pdf", x: 1380, y: 160, r: 9 }, { type: "message", x: 820, y: 380, r: -3 },
  { type: "courriel", x: 1180, y: 560, r: 6 }, { type: "message", x: 420, y: 640, r: 8 }, { type: "pdf", x: 980, y: 120, r: -12 },
  { type: "edt", x: 120, y: 470, r: -14 }, { type: "message", x: 1500, y: 470, r: -7 }, { type: "courriel", x: 700, y: 700, r: 11 },
];

/** Les messages, PDF et courriels qui pleuvent, un toutes les 5 images. */
const Pluie: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <>
      {NOTIFS.map((n, i) => {
        const p = spring({ frame: f - i * 5, fps, config: { damping: 12, stiffness: 200, mass: 0.6 } });
        return <ObjetDessine key={i} type={n.type} largeur={240} style={{ left: n.x, top: n.y, opacity: Math.min(1, p * 2), transform: `scale(${0.3 + 0.7 * p}) rotate(${n.r * p}deg)` }} />;
      })}
    </>
  );
};

/** La porte de la salle, et la classe qui attend devant. */
const Porte: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <>
      <div style={{ position: "absolute", left: 1180, top: 300, width: 300, height: 620, borderRadius: "18px 18px 0 0", background: "#FFFFFF", border: `10px solid ${K.marine}`, boxSizing: "border-box" }}>
        <div style={{ position: "absolute", left: 60, right: 60, top: 60, padding: "10px 0", textAlign: "center", background: K.marine, color: "#FFFFFF", fontFamily: POLICE, fontWeight: 800, fontSize: 40, borderRadius: 10 }}>G-S05</div>
        <div style={{ position: "absolute", left: 30, top: 330, width: 26, height: 26, borderRadius: 99, background: K.marine }} />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 918, height: 6, background: "rgba(14,15,18,0.12)" }} />
      <Personnage qui="salma" muet x={720} sol={920} hauteur={430} pose="telephone" etiquette={false} imageLocale={f} />
      <Personnage qui="amine" muet x={900} sol={920} hauteur={460} pose="repos" etiquette={false} imageLocale={f} entree={4} />
      <Personnage qui="ines" muet x={1060} sol={920} hauteur={420} pose="perplexe" etiquette={false} imageLocale={f} entree={8} />
    </>
  );
};

export const Accroche: React.FC<{ duree: number }> = ({ duree }) => {
  const b = repere("l01", 0.45);
  const c = repere("l02", 0) - 4;
  const d = repere("l02", 0.62);
  return (
    <Fond couleur={K.fond}>
      <Sequence durationInFrames={b}>
        <Mots texte="Lundi, 8 h 02." de={4} taille={210} pas={4} style={{ left: 0, right: 0, top: 380 }} />
      </Sequence>
      <Sequence from={b} durationInFrames={c - b}>
        <Mots texte="Un cours change de salle." de={0} taille={104} style={{ left: 120, right: 120, top: 250 }} />
        <Salle />
      </Sequence>
      <Sequence from={c} durationInFrames={d - c}>
        <Pluie />
      </Sequence>
      <Sequence from={d} durationInFrames={duree - d}>
        <Mots texte="Mauvaise porte." de={2} taille={110} accent={[1]} style={{ left: 120, top: 140 }} centre={false} />
        <Porte />
      </Sequence>
    </Fond>
  );
};

const OUTILS = [
  { nom: "Emploi du temps", objet: "edt" as Objet, x: 500, y: 300 },
  { nom: "Appel", objet: "appel" as Objet, x: 1420, y: 300 },
  { nom: "Quiz", objet: "message" as Objet, x: 500, y: 760 },
  { nom: "Supports", objet: "pdf" as Objet, x: 1420, y: 760 },
];
const LIENS: [number, number][] = [[0, 1], [0, 2], [1, 3], [2, 3], [0, 3], [1, 2]];

/** Les outils d'aujourd'hui : reliés un instant, puis les liens cassent. */
export const Eparpille: React.FC<{ duree: number }> = ({ duree }) => {
  const f = useCurrentFrame();
  const b = repere("l03", 0.58);
  const c = repere("l03", 1) + 4;
  const casse = interpolate(f, [b - 40, b - 10], [0, 1], BORNES);
  return (
    <Fond couleur={K.fond}>
      <Sequence durationInFrames={b}>
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          {LIENS.map(([a, z], i) => {
            const pa = OUTILS[a], pz = OUTILS[z];
            const trace = interpolate(f, [18 + i * 3, 34 + i * 3], [0, 1], BORNES);
            const mx = (pa.x + pz.x) / 2, my = (pa.y + pz.y) / 2;
            const ecart = casse * 60;
            const ux = (pz.x - pa.x) / Math.hypot(pz.x - pa.x, pz.y - pa.y), uy = (pz.y - pa.y) / Math.hypot(pz.x - pa.x, pz.y - pa.y);
            return (
              <g key={i} stroke={casse > 0.5 ? K.rouge : K.marine} strokeWidth={5} strokeDasharray="14 12" opacity={trace * (1 - casse * 0.5)}>
                <line x1={pa.x} y1={pa.y} x2={pa.x + (mx - ecart * ux - pa.x) * trace} y2={pa.y + (my - ecart * uy - pa.y) * trace} />
                <line x1={pz.x} y1={pz.y} x2={pz.x + (mx + ecart * ux - pz.x) * trace} y2={pz.y + (my + ecart * uy - pz.y) * trace} />
              </g>
            );
          })}
        </svg>
        {OUTILS.map((o, i) => (
          <React.Fragment key={o.nom}>
            <ObjetDessine type={o.objet} largeur={230} style={{ left: o.x - 115, top: o.y - 235, transform: `rotate(${(i % 2 ? 1 : -1) * (4 + casse * 8)}deg)` }} />
            <Noeud x={o.x} y={o.y + 40} de={i * 4} taille={48}>{o.nom}</Noeud>
          </React.Fragment>
        ))}
      </Sequence>
      <Sequence from={b} durationInFrames={c - b}>
        <Mots texte="Aucun ne se parle." de={0} taille={170} accent={[1]} couleurAccent={K.rouge} style={{ left: 80, right: 80, top: 360 }} />
      </Sequence>
      <Sequence from={c} durationInFrames={duree - c}>
        <div style={{ position: "absolute", left: 960 - 14, top: 540 - 14, width: 28, height: 28, borderRadius: 99, background: K.marine }} />
      </Sequence>
    </Fond>
  );
};

/** L'emblème s'assemble, le nom, la phrase. */
export const Revelation: React.FC<{ duree: number }> = ({ duree }) => {
  const f = useCurrentFrame();
  const zoom = interpolate(f, [0, duree], [1.08, 1], { ...BORNES, easing: DOUX });
  return (
    <Fond couleur={K.fond}>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", transform: `scale(${zoom})` }}>
        <Embleme start={0} size={230} tile={false} stagger={1.6} stiffness={140} />
        <div style={{ position: "relative", width: "100%", height: 150 }}>
          <Mots texte="HESTIM Planner" de={22} taille={120} accent={[1]} couleurAccent={K.marine} pas={5} style={{ left: 0, right: 0, top: 30 }} />
        </div>
        <div style={{ position: "relative", width: "100%", height: 80 }}>
          <Mots texte="Toute la vie de l'école, une seule application." de={44} taille={50} couleur="rgba(14,15,18,0.62)" pas={2} style={{ left: 0, right: 0, top: 10 }} />
        </div>
      </div>
    </Fond>
  );
};
