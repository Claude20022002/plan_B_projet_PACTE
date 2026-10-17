import React from "react";
import { random } from "remotion";
import { FlapTile, tileSize } from "./Flap";

const POOL = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-";

/**
 * Case « destination » d'un panneau des départs qui cherche sa salle : les volets tournent sans
 * s'arrêter. Avec `trouve` (image locale), chaque tuile s'arrête sur `texte`, de gauche à droite.
 * Sans `trouve`, le panneau cherche jusqu'à la fin du plan : c'est l'ouverture de la vidéo Keynote,
 * et la même case se fixe sur la salle quand le téléphone apparaît.
 */
export const Destination: React.FC<{ texte: string; debut: number; trouve?: number; fontSize: number; flip?: number; seed: string }> = ({
  texte,
  debut,
  trouve,
  fontSize,
  flip = 4,
  seed,
}) => {
  const { width, height } = tileSize(fontSize);
  const gap = Math.max(4, Math.round(fontSize * 0.06));
  return (
    <div style={{ display: "flex", gap }}>
      {[...texte].map((ch, i) => {
        const depart = debut + i * 2;
        // Assez de lettres pour tourner jusqu'à l'arrêt voulu, ou au-delà de n'importe quel plan
        const tours = trouve === undefined ? 90 : Math.max(1, Math.floor((trouve + i * 3 - depart) / flip));
        const seq = [" "];
        for (let k = 0; k < tours; k++) seq.push(POOL[Math.floor(random(`${seed}-${i}-${k}`) * POOL.length)]);
        if (trouve !== undefined) seq.push(ch);
        return <FlapTile key={i} seq={seq} start={depart} flip={flip} fontSize={fontSize} width={width} height={height} hiddenBefore />;
      })}
    </div>
  );
};
