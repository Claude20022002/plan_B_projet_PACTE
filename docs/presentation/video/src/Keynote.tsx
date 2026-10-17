import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { Camera } from "./components/Camera";
import { D1PlanSite } from "./scenes/D1PlanSite";
import { K1Froid } from "./scenes/K1Froid";
import { K2Chaos } from "./scenes/K2Chaos";
import { K3Revelation } from "./scenes/K3Revelation";
import { K4Salle } from "./scenes/K4Salle";
import { K7Jeux } from "./scenes/K7Jeux";
import { K8Chiffres } from "./scenes/K8Chiffres";
import { M5Appel } from "./scenes/M5Appel";
import { M6Quiz } from "./scenes/M6Quiz";
import { S5Alerte } from "./scenes/S5Alerte";
import { S9Fin } from "./scenes/S9Fin";
import { BEAT, C } from "./theme";

/**
 * « Keynote » (16 octobre 2026) : la vidéo de la présentation de 3 minutes, entre deux moments du
 * discours (../discours-keynote.md). Les codes des films de lancement : ouverture à froid sans logo,
 * chaos puis noir et silence, révélation, une preuve par plan, le grand chiffre, la promesse.
 * Elle s'ouvre sur « 13:29 », l'heure que le discours vient de dire, et la salle cherchée à
 * l'ouverture se trouve au plan 4. Pas de repère ni de barre de progression : rien que l'image.
 * Les autres compositions ne changent pas.
 */

const PROMESSE = "Toute l'école à l'heure.";

type Scene = (duree: number) => React.ReactNode;
const SCENES: Record<string, Scene> = {
  froid: () => <K1Froid />,
  chaos: () => <K2Chaos />,
  revelation: () => <K3Revelation />,
  salle: () => <K4Salle />,
  alerte: (duree) => (
    <Camera duree={duree}>
      <S5Alerte capture="captures/app-01-tableau.png" aLHeure />
    </Camera>
  ),
  appel: (duree) => (
    <Camera duree={duree}>
      <M5Appel duree={duree} titre="L'appel en une minute." sous="Le code change toutes les 30 secondes." />
    </Camera>
  ),
  quiz: (duree) => (
    <Camera duree={duree}>
      <M6Quiz duree={duree} titre="Le quiz se joue dans le cours." />
    </Camera>
  ),
  classement: (duree) => (
    <Camera duree={duree} inclinaison={6}>
      <D1PlanSite capture="captures/web-21-resultats-enseignant.png" titre="Le classement, aussitôt." zoom={[1.7, 1.9]} origine="50% 47%" duree={duree} />
    </Camera>
  ),
  jeux: () => <K7Jeux />,
  chiffres: () => <K8Chiffres />,
  fin: () => <S9Fin phrase={PROMESSE} supports="DÉJÀ EN LIGNE" />,
};

// ─── Durées, en temps à 120 BPM (1 temps = 0,5 s) : 62 s. La bande-son les lit (scripts/composer-musique.py).
export const TEMPS_KEYNOTE = {
  froid: 8 * BEAT, //        0:00  13:29, la salle introuvable
  chaos: 10 * BEAT, //       0:04  les notifications s'empilent, puis le noir
  revelation: 8 * BEAT, //   0:09  l'emblème, le nom
  salle: 12 * BEAT, //       0:13  le téléphone, la salle trouvée
  alerte: 8 * BEAT, //       0:19  cours reporté
  appel: 20 * BEAT, //       0:23  l'appel projeté et le scanner
  quiz: 16 * BEAT, //        0:33  le quiz en direct
  classement: 8 * BEAT, //   0:41  le classement de la classe
  jeux: 10 * BEAT, //        0:45  la bibliothèque de jeux
  chiffres: 12 * BEAT, //    0:50  2 620 séances, 90 s, 0 conflit
  fin: 12 * BEAT, //         0:56  la promesse, déjà en ligne
} as const;

export const Keynote: React.FC = () => {
  let debut = 0;
  return (
    <>
      <AbsoluteFill style={{ background: C.bg }}>
        {Object.entries(TEMPS_KEYNOTE).map(([id, duree]) => {
          const sequence = (
            <Sequence key={id} from={debut} durationInFrames={duree} name={id}>
              {SCENES[id](duree)}
            </Sequence>
          );
          debut += duree;
          return sequence;
        })}
      </AbsoluteFill>
      <Audio src={staticFile("audio/keynote.wav")} />
    </>
  );
};
