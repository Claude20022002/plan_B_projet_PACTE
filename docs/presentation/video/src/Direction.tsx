import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { Progression, Repere } from "./components/Habillage";
import { D1PlanSite } from "./scenes/D1PlanSite";
import { D3Etudiant } from "./scenes/D3Etudiant";
import { M5Appel } from "./scenes/M5Appel";
import { M6Quiz } from "./scenes/M6Quiz";
import { S2Outils } from "./scenes/S2Outils";
import { S5Alerte } from "./scenes/S5Alerte";
import { S9Fin } from "./scenes/S9Fin";
import { BEAT, C } from "./theme";

/**
 * « Direction » : la vidéo du lot V-2 (../script-video-vendeur.md, § 5), pour ceux qui décident et
 * paient. Une promesse, trois preuves (chacun sait où aller, l'appel en une minute, le quiz dans le
 * cours), ce que l'école y gagne, une action. Le produit est à l'image dès la première seconde.
 * Les écrans du site sont cadrés sans le menu de gauche : le zoom part du bord droit.
 * Les compositions de Matinee.tsx et de Root.tsx ne changent pas.
 */

const PROMESSE = "Toute l'école à l'heure, dans une seule application.";
// L'adresse est FICTIVE, choisie pour le montage : à remplacer par la vraie avant toute diffusion
const ACTION = "Demandez une démonstration";
const ADRESSE = "planner.hestim.ma";

type Scene = { rendu: (duree: number) => React.ReactNode; repere?: string };
const SCENES: Record<string, Scene> = {
  campus: {
    rendu: (duree) => <D1PlanSite capture="captures/admin-01-tableau.png" titre="Tout le campus, sur un écran." zoom={[1.15, 1.2]} origine="100% 0%" duree={duree} />,
    repere: "Lundi, 13 h 40 · La scolarité",
  },
  outils: { rendu: () => <S2Outils />, repere: "Hier" },
  etudiante: { rendu: (duree) => <D3Etudiant titre="Chaque étudiant sait où aller." duree={duree} />, repere: "L'étudiant" },
  alerte: { rendu: () => <S5Alerte capture="captures/app-01-tableau.png" aLHeure />, repere: "L'étudiant" },
  appel: { rendu: (duree) => <M5Appel duree={duree} titre="L'appel en une minute." sous="Le code change toutes les 30 secondes." />, repere: "La salle" },
  quiz: { rendu: (duree) => <M6Quiz duree={duree} titre="Un quiz lancé depuis la séance." />, repere: "Le cours" },
  resultats: {
    rendu: (duree) => <D1PlanSite capture="captures/web-21-resultats-enseignant.png" titre="Le classement, aussitôt." zoom={[1.7, 1.86]} origine="50% 47%" duree={duree} />,
    repere: "Le cours",
  },
  mois: {
    rendu: (duree) => <D1PlanSite capture="captures/admin-04b-edt-mensuel-classe.png" titre="Un mois planifié, sans conflit." zoom={[1.3, 1.37]} origine="74% 70%" duree={duree} />,
    repere: "La scolarité",
  },
  heures: {
    rendu: (duree) => <D1PlanSite capture="captures/admin-05b-heures-du-mois.png" titre="Chaque heure faite est comptée." zoom={[1.2, 1.3]} origine="83% 0%" duree={duree} />,
    repere: "La scolarité",
  },
  fin: { rendu: () => <S9Fin phrase={PROMESSE} action={ACTION} adresse={ADRESSE} /> },
};

// ─── Durées, en temps à 120 BPM (1 temps = 0,5 s) : 60 s. La bande-son les lit (scripts/composer-musique.py).
export const TEMPS_DIRECTION = {
  campus: 8 * BEAT, //       0:00  le panneau des départs du campus
  outils: 12 * BEAT, //      0:04  six outils éparpillés
  etudiante: 10 * BEAT, //   0:10  le téléphone, la séance en cours en grand
  alerte: 10 * BEAT, //      0:15  cours reporté
  appel: 24 * BEAT, //       0:20  l'appel projeté et le scanner
  quiz: 16 * BEAT, //        0:32  le quiz en direct
  resultats: 8 * BEAT, //    0:40  le classement de la classe
  mois: 10 * BEAT, //        0:44  l'emploi du temps du mois d'une classe
  heures: 10 * BEAT, //      0:49  les heures faites par enseignant
  fin: 12 * BEAT, //         0:54  la promesse, l'action, l'adresse
} as const;

export const Direction: React.FC = () => {
  let debut = 0;
  return (
    <>
      <AbsoluteFill style={{ background: C.bg }}>
        {Object.entries(TEMPS_DIRECTION).map(([id, duree]) => {
          const scene = SCENES[id];
          const sequence = (
            <Sequence key={id} from={debut} durationInFrames={duree} name={id}>
              {scene.rendu(duree)}
              {scene.repere ? <Repere texte={scene.repere} /> : null}
            </Sequence>
          );
          debut += duree;
          return sequence;
        })}
        <Progression />
      </AbsoluteFill>
      <Audio src={staticFile("audio/direction.wav")} />
    </>
  );
};
