import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { Camera } from "./components/Camera";
import { SCENES, type Scene } from "./Keynote";
import { D1PlanSite } from "./scenes/D1PlanSite";
import { BEAT, C } from "./theme";

/**
 * « Keynote » en 1 min 20 (17 octobre 2026) : la vidéo Keynote, plan pour plan, avec quatre preuves
 * de plus, prises sur de vraies captures et posées dans la même mise en scène (Camera) :
 * - le tableau de tout le campus, avant l'alerte de l'étudiante ;
 * - la préparation du semestre, en huit étapes par filière (dont « 0 conflit ouvert ») ;
 * - le mois d'une classe au format officiel ;
 * - les heures du mois par enseignant.
 * La Keynote de 62 s (Keynote.tsx, out/keynote.mp4) ne change pas.
 */

const AJOUTS: Record<string, Scene> = {
  admin: (duree) => (
    <Camera duree={duree} inclinaison={7}>
      <D1PlanSite capture="captures/admin-01-tableau.png" titre="Tout le campus, sur un écran." zoom={[1.15, 1.22]} origine="45% 30%" duree={duree} />
    </Camera>
  ),
  generation: (duree) => (
    <Camera duree={duree} inclinaison={7}>
      <D1PlanSite capture="captures/admin-02-preparation.png" titre="Le semestre, préparé en huit étapes." zoom={[1.32, 1.4]} origine="76% 32%" duree={duree} />
    </Camera>
  ),
  mois: (duree) => (
    <Camera duree={duree} inclinaison={6}>
      <D1PlanSite capture="captures/admin-04b-edt-mensuel-classe.png" titre="Au format officiel de l'école." zoom={[1.3, 1.38]} origine="74% 70%" duree={duree} />
    </Camera>
  ),
  heures: (duree) => (
    <Camera duree={duree} inclinaison={6}>
      <D1PlanSite capture="captures/admin-05b-heures-du-mois.png" titre="Chaque heure faite est comptée." zoom={[1.2, 1.3]} origine="83% 0%" duree={duree} />
    </Camera>
  ),
};

const TOUTES: Record<string, Scene> = { ...SCENES, ...AJOUTS };

// ─── Durées, en temps à 120 BPM (1 temps = 0,5 s) : 160 temps = 80 s. La bande-son les lit
// (scripts/composer-musique.py → public/audio/keynote-1m20.wav).
export const TEMPS_KEYNOTE_80 = {
  froid: 8 * BEAT, //        0:00  13:29, la salle introuvable
  chaos: 10 * BEAT, //       0:04  les notifications s'empilent, puis le noir
  revelation: 8 * BEAT, //   0:09  l'emblème, le nom
  salle: 12 * BEAT, //       0:13  le téléphone, la salle trouvée
  admin: 8 * BEAT, //        0:19  tout le campus sur un écran (ajout)
  alerte: 8 * BEAT, //       0:23  cours reporté
  appel: 20 * BEAT, //       0:27  l'appel projeté et le scanner
  quiz: 16 * BEAT, //        0:37  le quiz en direct
  classement: 8 * BEAT, //   0:45  le classement de la classe
  jeux: 10 * BEAT, //        0:49  la bibliothèque de jeux
  generation: 10 * BEAT, //  0:54  la préparation du semestre en huit étapes (ajout)
  mois: 8 * BEAT, //         0:59  le mois au format officiel (ajout)
  heures: 8 * BEAT, //       1:03  les heures du mois (ajout)
  chiffres: 12 * BEAT, //    1:07  les trois chiffres
  fin: 14 * BEAT, //         1:13  la promesse, déjà en ligne
} as const;

export const Keynote80: React.FC = () => {
  let debut = 0;
  return (
    <>
      <AbsoluteFill style={{ background: C.bg }}>
        {Object.entries(TEMPS_KEYNOTE_80).map(([id, duree]) => {
          const sequence = (
            <Sequence key={id} from={debut} durationInFrames={duree} name={id}>
              {TOUTES[id](duree)}
            </Sequence>
          );
          debut += duree;
          return sequence;
        })}
      </AbsoluteFill>
      <Audio src={staticFile("audio/keynote-1m20.wav")} />
    </>
  );
};
