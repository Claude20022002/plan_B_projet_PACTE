// Les quatre fonctionnalités de la vidéo Lancement, chacune sur une couleur de l'emblème HESTIM :
// planification (marine), changement et alerte (orange), l'étudiant (vert), l'appel (rouge).
// Toutes les images sont de vraies captures (../../captures), posées en perspective.
import React from "react";
import { interpolate, Sequence, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Halo, Navigateur, Telephone } from "../../promo/components/Cadre";
import { Curseur } from "../../promo/components/Elements";
import { Personnage } from "../../promo/components/Personnage";
import { BORNES, POLICE } from "../../promo/theme";
import { COULEURS as K, Carte3D, Coche, Fond, Mots, Noeud } from "../elements";
import { repere } from "../voix";

const BLANC = "#FFFFFF";

export const Planification: React.FC<{ duree: number }> = ({ duree }) => {
  const f = useCurrentFrame();
  const b = repere("l06", 0) - 3;
  const c = repere("l06", 0.52);
  const regles = ["Salle", "Enseignant", "Groupe"];
  return (
    <Fond couleur={K.marine}>
      <Sequence durationInFrames={b}>
        <Mots texte="Préparé, étape par étape." de={2} taille={84} couleur={BLANC} centre={false} accent={[0]} style={{ left: 110, top: 110, width: 560 }} />
        <Carte3D de={6} x={640} y={170} rotY={-22}>
          <Navigateur src="captures/admin-02-preparation.png" x={0} y={0} largeur={1180} zoom={interpolate(f, [0, b], [1, 1.07], BORNES)} origine={[1000, 470]}>
            <Halo x={388} y={494} l={1392} h={36} image={f} de={40} a={b + 20} />
          </Navigateur>
        </Carte3D>
      </Sequence>
      <Sequence from={b} durationInFrames={c - b}>
        <Mots texte="Jamais en double." de={0} taille={150} couleur={BLANC} accent={[2]} style={{ left: 80, right: 80, top: 250 }} />
        {regles.map((r, i) => (
          <Noeud key={r} x={960 + (i - 1) * 470} y={680} de={14 + i * 10} taille={52} couleur={K.marine}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 20 }}>
              <Coche taille={52} couleur={K.vert} de={22 + i * 10} />
              {r}
            </span>
          </Noeud>
        ))}
      </Sequence>
      <Sequence from={c} durationInFrames={duree - c}>
        <Mots texte="Au format officiel." de={0} taille={84} couleur={BLANC} centre={false} accent={[2]} style={{ left: 110, top: 110, width: 520 }} />
        <Carte3D de={4} x={600} y={150} rotY={20}>
          <Navigateur src="captures/admin-04b-edt-mensuel-classe.png" x={0} y={0} largeur={1220} zoom={interpolate(f, [c, duree], [1.05, 1.12], BORNES)} origine={[1100, 600]} />
        </Carte3D>
      </Sequence>
    </Fond>
  );
};

/** Le statut de la ligne « Introduction à la cybersécurité… 4A IIIA » repeint en « Reportée ». */
const Reportee: React.FC<{ clic: number }> = ({ clic }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: f - clic - 3, fps, config: { damping: 200, stiffness: 160 } });
  return (
    <>
      <div style={{ position: "absolute", left: 376, top: 474, width: 924, height: 62, border: `4px solid ${K.orange}`, borderRadius: 6, opacity: p }} />
      <div style={{ position: "absolute", left: 1170, top: 488, width: 124, height: 34, background: "#0B0B0D", opacity: p }} />
      <div style={{ position: "absolute", left: 1176, top: 490, fontFamily: "Barlow Condensed, Arial Narrow, sans-serif", fontWeight: 700, fontSize: 26, letterSpacing: "0.04em", color: K.orange, opacity: p }}>REPORTÉE</div>
    </>
  );
};

/** La notification « Cours reporté », dessinée d'après celle de l'application, agrandie. */
const Alerte: React.FC<{ x: number; y: number; de: number }> = ({ x, y, de }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: f - de, fps, config: { damping: 16, stiffness: 160 } });
  return (
    <div style={{ position: "absolute", left: x, top: y, width: 660, transform: `translateY(${(1 - p) * -140}px) scale(${0.9 + 0.1 * p})`, opacity: Math.min(1, p * 2), background: BLANC, borderRadius: 34, padding: "26px 34px", boxShadow: "0 30px 70px rgba(0,0,0,0.3)", fontFamily: POLICE }}>
      <div style={{ fontSize: 22, color: "#5F6778", fontWeight: 500 }}>HESTIM Planner · maintenant</div>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 6 }}>
        <div style={{ width: 20, height: 20, borderRadius: 99, background: K.orange }} />
        <div style={{ fontSize: 40, fontWeight: 800, color: K.encre }}>Cours reporté</div>
      </div>
      <div style={{ fontSize: 27, color: K.encre, fontWeight: 500, marginTop: 4 }}>Cybersécurité et NIS2 · jeudi 15:30 · G-S05</div>
    </div>
  );
};

export const Changement: React.FC<{ duree: number }> = ({ duree }) => {
  const f = useCurrentFrame();
  const b = repere("l08", 0) - 3;
  return (
    <Fond couleur={K.orange}>
      <Sequence durationInFrames={b}>
        <Mots texte="Un cours bouge ?" de={2} taille={96} couleur={BLANC} centre={false} style={{ left: 110, top: 110, width: 520 }} />
        <Carte3D de={4} x={620} y={190} rotY={-20}>
          <Navigateur src="captures/admin-01-tableau.png" x={0} y={0} largeur={1200} zoom={interpolate(f, [0, b], [1.02, 1.1], BORNES)} origine={[1000, 500]}>
            <Reportee clic={40} />
            <Curseur de={[1600, 950]} vers={[1236, 512]} depart={10} arrivee={34} clic={40} taille={56} />
          </Navigateur>
        </Carte3D>
      </Sequence>
      <Sequence from={b} durationInFrames={duree - b}>
        <Mots texte="Prévenus à la seconde." de={0} taille={96} couleur={BLANC} centre={false} accent={[2]} couleurAccent={K.marine} style={{ left: 110, top: 110, width: 600 }} />
        <Carte3D de={0} x={1000} y={170} rotY={16} rotZ={-3}>
          <Telephone src="captures/app-01-tableau.png" x={0} y={0} hauteur={800} />
        </Carte3D>
        <Alerte x={880} y={230} de={16} />
        <Personnage qui="salma" muet x={420} sol={1000} hauteur={460} pose="telephone" etiquette={false} imageLocale={f - b} entree={6} />
        <Personnage qui="amine" muet x={620} sol={1000} hauteur={490} pose="telephone" etiquette={false} imageLocale={f - b} entree={12} />
      </Sequence>
    </Fond>
  );
};

export const Etudiant: React.FC<{ duree: number }> = () => {
  const telephones = [
    { src: "captures/app-01-tableau.png", part: 0.18, x: 430, rot: -7 },
    { src: "captures/app-03b-semaine-grille.png", part: 0.36, x: 800, rot: 0 },
    { src: "captures/app-03c-mois.png", part: 0.52, x: 1170, rot: 7 },
  ];
  return (
    <Fond couleur={K.vert}>
      <Mots texte="Sa salle. Sa semaine. Son mois." de={repere("l09", 0.12)} taille={76} couleur={BLANC} pas={5} style={{ left: 80, right: 80, top: 70 }} />
      {telephones.map((t) => (
        <Carte3D key={t.src} de={repere("l09", t.part)} x={t.x} y={250} rotY={t.rot * 2} rotZ={t.rot}>
          <Telephone src={t.src} x={0} y={0} hauteur={720} />
        </Carte3D>
      ))}
    </Fond>
  );
};

export const Appel: React.FC<{ duree: number }> = ({ duree }) => {
  const f = useCurrentFrame();
  const b = repere("l10", 0.5);
  return (
    <Fond couleur={K.rouge}>
      <Sequence durationInFrames={b}>
        <Mots texte="L'appel, d'un scan." de={2} taille={96} couleur={BLANC} centre={false} style={{ left: 110, top: 110, width: 540 }} />
        <Carte3D de={4} x={600} y={190} rotY={-18}>
          <Navigateur src="captures/prof-05-appel-projection.png" x={0} y={0} largeur={1220} zoom={interpolate(f, [0, b], [1, 1.1], BORNES)} origine={[460, 560]} />
        </Carte3D>
      </Sequence>
      <Sequence from={b} durationInFrames={duree - b}>
        <Carte3D de={0} x={330} y={150} rotY={14} rotZ={-3}>
          <Telephone src="captures/prof-09-appel-telephone.png" x={0} y={0} hauteur={820} />
        </Carte3D>
        <Mots texte="Un nouveau code toutes les 30 secondes." de={6} taille={84} couleur={BLANC} centre={false} accent={[5, 6]} couleurAccent={K.encre} style={{ left: 850, top: 330, width: 920 }} />
      </Sequence>
    </Fond>
  );
};
