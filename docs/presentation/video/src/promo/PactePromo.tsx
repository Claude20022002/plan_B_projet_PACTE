// Vidéo publicitaire PactePromo (60 s) : huit scènes en <Sequence>, sous-titres, voix des avatars et
// du narrateur, musique baissée sous la voix. Même composant pour le 16:9, le 9:16 et le 1:1.
// Voir STORYBOARD.md (déroulé), DA.md (règles visuelles), QA.md (contrôles avant diffusion).
import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { SousTitres } from "./components/SousTitres";
import { Scene01Accroche } from "./scenes/Scene01Accroche";
import { Scene02Desordre } from "./scenes/Scene02Desordre";
import { Scene03Logo } from "./scenes/Scene03Logo";
import { Scene04EmploiDuTemps } from "./scenes/Scene04EmploiDuTemps";
import { Scene05Changement } from "./scenes/Scene05Changement";
import { Scene06Appel } from "./scenes/Scene06Appel";
import { Scene07Chiffres } from "./scenes/Scene07Chiffres";
import { Scene08Fin } from "./scenes/Scene08Fin";
import { P, POLICE } from "./theme";
import { Decalage, SCENES, s, type IdScene } from "./timing";
import { volumeMusique } from "./voix";

const COMPOSANTS: Record<IdScene, React.FC<{ duree: number }>> = {
  accroche: Scene01Accroche,
  desordre: Scene02Desordre,
  logo: Scene03Logo,
  emploiDuTemps: Scene04EmploiDuTemps,
  changement: Scene05Changement,
  appel: Scene06Appel,
  chiffres: Scene07Chiffres,
  fin: Scene08Fin,
};

/** La vidéo entière. */
export const PactePromo: React.FC = () => (
  <AbsoluteFill style={{ background: P.fond, fontFamily: POLICE }}>
    {SCENES.map((sc) => {
      const de = s(sc.de);
      const duree = s(sc.a) - de;
      const Scene = COMPOSANTS[sc.id];
      return (
        <Sequence key={sc.id} from={de} durationInFrames={duree} name={sc.id}>
          <Decalage.Provider value={de}>
            <Scene duree={duree} />
          </Decalage.Provider>
        </Sequence>
      );
    })}
    <SousTitres />
    <Audio src={staticFile("audio/promo/voix.mp3")} />
    <Audio src={staticFile("audio/promo/musique.mp3")} volume={(f) => volumeMusique(f)} />
  </AbsoluteFill>
);
