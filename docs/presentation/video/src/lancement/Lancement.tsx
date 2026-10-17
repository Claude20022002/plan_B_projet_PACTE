// Vidéo « Lancement » (17 octobre 2026), dans le genre des films de lancement de logiciels :
// une seule voix off continue, des plans courts, la typographie qui porte les mots-clés, des cartes
// d'interface en perspective sur les couleurs de l'emblème, de petits personnages muets.
// Le minutage suit la voix (voix.json) ; voir README.md, section « Lancement ».
import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { SousTitres } from "../promo/components/SousTitres";
import { Decalage } from "../promo/timing";
import { Accroche, Eparpille, Revelation } from "./scenes/Ouverture";
import { Appel, Changement, Etudiant, Planification } from "./scenes/Fonctions";
import { Chiffres, Fin, Relie } from "./scenes/Final";
import { SCENES, sousTitreLancement, volumeMusiqueLancement, type IdScene } from "./voix";

const COMPOSANTS: Record<IdScene, React.FC<{ duree: number }>> = {
  accroche: Accroche,
  eparpille: Eparpille,
  revelation: Revelation,
  planification: Planification,
  changement: Changement,
  etudiant: Etudiant,
  appel: Appel,
  relie: Relie,
  chiffres: Chiffres,
  fin: Fin,
};

/** La vidéo entière, en 16:9. */
export const Lancement: React.FC = () => (
  <AbsoluteFill style={{ background: "#F7F7F5" }}>
    {SCENES.map((sc) => {
      const Scene = COMPOSANTS[sc.id];
      return (
        <Sequence key={sc.id} from={sc.de} durationInFrames={sc.duree} name={sc.id}>
          <Decalage.Provider value={sc.de}>
            <Scene duree={sc.duree} />
          </Decalage.Provider>
        </Sequence>
      );
    })}
    <SousTitres sousTitre={sousTitreLancement} />
    <Audio src={staticFile("audio/lancement/voix.mp3")} />
    <Audio src={staticFile("audio/lancement/musique.mp3")} volume={(f) => volumeMusiqueLancement(f)} />
  </AbsoluteFill>
);
