import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { Progression, Repere } from "./components/Habillage";
import { M3Etudiante } from "./scenes/M3Etudiante";
import { M5Appel } from "./scenes/M5Appel";
import { M6Quiz } from "./scenes/M6Quiz";
import { M7Formes } from "./scenes/M7Formes";
import { M7Jeux } from "./scenes/M7Jeux";
import { M8Resultats } from "./scenes/M8Resultats";
import { M9Bibliotheque } from "./scenes/M9Bibliotheque";
import { M10Admin } from "./scenes/M10Admin";
import { S1Intro } from "./scenes/S1Intro";
import { S2Outils } from "./scenes/S2Outils";
import { S5Alerte } from "./scenes/S5Alerte";
import { S9Fin } from "./scenes/S9Fin";
import { BEAT, C } from "./theme";

/**
 * « Une journée à l'école » : la vidéo du lot V-1 (../script-video-motion-design.md). Une seule
 * histoire, de l'étudiante à l'administration, sans les devoirs. Cinquième montage, du 12 octobre
 * 2026 : douze scènes en 1 min 15 (la durée décidée pour la salle) ; la scène « Bientôt » est devenue
 * « les formes d'un quiz », et la bibliothèque de jeux pédagogiques a sa scène. Les captures app-*, prof-* et admin-* datent du
 * 11 octobre (un lundi à 13 h 40, d'où les heures de l'après-midi). Le quiz reste sur maquettes.
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
  appel: { rendu: (duree) => <M5Appel duree={duree} />, repere: "13 h 35 · La salle" },
  quiz: { rendu: (duree) => <M6Quiz duree={duree} />, repere: "14 h 10 · Le quiz" },
  formes: { rendu: (duree) => <M7Formes duree={duree} />, repere: "14 h 10 · Le quiz" },
  jeux: { rendu: (duree) => <M7Jeux duree={duree} />, repere: "Entre les cours · Les jeux" },
  resultats: { rendu: (duree) => <M8Resultats duree={duree} />, repere: "14 h 30 · Les résultats" },
  supports: { rendu: (duree) => <M9Bibliotheque duree={duree} />, repere: "Le soir · La Bibliothèque" },
  admin: { rendu: (duree) => <M10Admin duree={duree} />, repere: "Toute la journée · L'administration" },
  fin: { rendu: () => <S9Fin phrase={PROMESSE} /> },
};

// ─── Durées, en temps à 120 BPM (1 temps = 0,5 s). La bande-son les lit (scripts/composer-musique.py).
export const TEMPS_SALLE = {
  title: 10 * BEAT, //       0:00  l'emblème, le nom, la promesse
  outils: 12 * BEAT, //      0:05  six outils éparpillés
  etudiante: 14 * BEAT, //   0:11  le tableau du jour, le mois, le détail d'un cours
  alerte: 10 * BEAT, //      0:18  cours reporté
  appel: 18 * BEAT, //       0:23  l'appel projeté et le scanner
  quiz: 22 * BEAT, //        0:32  le quiz en direct : la salle et le téléphone
  formes: 10 * BEAT, //      0:43  les formes d'un quiz : en direct, avec un schéma, avec une vidéo
  jeux: 10 * BEAT, //        0:48  la bibliothèque de jeux pédagogiques
  resultats: 10 * BEAT, //   0:53  le classement de la classe, le résultat de l'étudiante
  supports: 12 * BEAT, //    0:58  la Bibliothèque, une seule connexion
  admin: 12 * BEAT, //       1:04  l'emploi du temps du mois, les heures faites
  fin: 10 * BEAT, //         1:10  la promesse, web · iPhone · Android
} as const;

// Montage pour les réseaux (9:16, 40 s) : l'accroche d'abord
export const TEMPS_RESEAUX = {
  appel: 12 * BEAT, //       0:00
  quiz: 18 * BEAT, //        0:06
  formes: 10 * BEAT, //      0:15
  jeux: 10 * BEAT, //        0:20
  alerte: 10 * BEAT, //      0:25
  etudiante: 10 * BEAT, //   0:30
  fin: 10 * BEAT, //         0:35
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
