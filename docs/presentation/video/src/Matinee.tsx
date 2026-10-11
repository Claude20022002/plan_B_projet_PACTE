import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { Progression, Repere } from "./components/Habillage";
import { M3Etudiante } from "./scenes/M3Etudiante";
import { M4Site } from "./scenes/M4Site";
import { M5Appel } from "./scenes/M5Appel";
import { M6Quiz } from "./scenes/M6Quiz";
import { M7Bientot } from "./scenes/M7Bientot";
import { S1Intro } from "./scenes/S1Intro";
import { S2Outils } from "./scenes/S2Outils";
import { S5Alerte } from "./scenes/S5Alerte";
import { S9Fin } from "./scenes/S9Fin";
import { BEAT, C } from "./theme";

/**
 * « Une journée à l'école » : la vidéo du lot V-1 (../script-video-motion-design.md). Une seule
 * histoire, de l'étudiante à l'administration, sans les devoirs. Second montage, du 11 octobre
 * 2026 : il utilise les captures du jour (app-*, prof-*, admin-*), prises un lundi à 13 h 40 sur la
 * plateforme de démonstration, d'où les heures de l'après-midi. Le quiz reste sur maquettes.
 * Les anciennes compositions de Root.tsx ne changent pas.
 */

// La promesse ouvre et ferme la vidéo (proposition du plan, à écrire avec les mots de l'école)
const PROMESSE = "L'emploi du temps, l'appel et les quiz d'une école, au même endroit.";

type Scene = { rendu: (duree: number) => React.ReactNode; repere?: string };
const SCENES: Record<string, Scene> = {
  title: { rendu: () => <S1Intro phrase={PROMESSE} /> },
  outils: { rendu: () => <S2Outils />, repere: "Aujourd'hui" },
  etudiante: { rendu: (duree) => <M3Etudiante duree={duree} />, repere: "13 h 20 · L'étudiante" },
  alerte: { rendu: () => <S5Alerte capture="captures/app-01-tableau.png" />, repere: "13 h 20 · L'étudiante" },
  prof: {
    rendu: () => (
      <M4Site capture="captures/prof-01-tableau.png" titre="Le professeur" suite="retrouve sa séance." lignes={["La salle, l'heure, la classe : tout est là.", "L'appel est à un geste."]} origine="40% 30%" />
    ),
    repere: "13 h 30 · Le professeur",
  },
  appel: { rendu: (duree) => <M5Appel duree={duree} />, repere: "13 h 35 · La salle" },
  quiz: { rendu: (duree) => <M6Quiz duree={duree} />, repere: "14 h 10 · Le quiz" },
  bientot: { rendu: (duree) => <M7Bientot duree={duree} />, repere: "À venir" },
  admin: {
    rendu: () => (
      <M4Site capture="captures/admin-01-tableau.png" titre="L'administration" suite="voit tout le campus." lignes={["Chaque séance, sa salle, son enseignant.", "Aucun conflit dans l'emploi du temps."]} origine="50% 35%" />
    ),
    repere: "Toute la journée · L'administration",
  },
  fin: { rendu: () => <S9Fin phrase={PROMESSE} /> },
};

// ─── Durées, en temps à 120 BPM (1 temps = 0,5 s). La bande-son les lit (scripts/composer-musique.py).
// Les résultats d'un quiz et les supports de la Bibliothèque n'ont pas de scène : ni le quiz ni la
// bibliothèque n'étaient branchés sur la plateforme des captures du 11 octobre.
export const TEMPS_SALLE = {
  title: 12 * BEAT, //       0:00  l'emblème, le nom, la promesse
  outils: 16 * BEAT, //      0:06  six outils éparpillés
  etudiante: 18 * BEAT, //   0:14  le tableau du jour, le mois, le détail d'un cours
  alerte: 14 * BEAT, //      0:23  cours reporté
  prof: 14 * BEAT, //        0:30  le tableau de l'enseignant
  appel: 22 * BEAT, //       0:37  l'appel projeté et le scanner
  quiz: 40 * BEAT, //        0:48  le quiz : la salle et le téléphone
  bientot: 24 * BEAT, //     1:08  maquettes : le schéma et l'extrait vidéo sur le téléphone
  admin: 18 * BEAT, //       1:20  le tableau de bord de l'administration
  fin: 12 * BEAT, //         1:29  la promesse, web · iPhone · Android
} as const;

// Montage pour les réseaux (9:16) : l'accroche d'abord
export const TEMPS_RESEAUX = {
  appel: 18 * BEAT, //       0:00
  quiz: 24 * BEAT, //        0:09
  bientot: 16 * BEAT, //     0:21
  alerte: 12 * BEAT, //      0:29
  etudiante: 12 * BEAT, //   0:35
  fin: 10 * BEAT, //         0:41
} as const;

export const dureeTotale = (temps: Record<string, number>) => Object.values(temps).reduce((s, d) => s + d, 0);

const Montage: React.FC<{ temps: Record<string, number>; son: string }> = ({ temps, son }) => {
  let debut = 0;
  return (
    <>
      <AbsoluteFill style={{ background: C.bg }}>
        {Object.entries(temps).map(([id, duree]) => {
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
      <Audio src={staticFile(son)} />
    </>
  );
};

export const Matinee: React.FC = () => <Montage temps={TEMPS_SALLE} son="audio/matinee.wav" />;
export const MatineeReseaux: React.FC = () => <Montage temps={TEMPS_RESEAUX} son="audio/matinee-9x16.wav" />;
