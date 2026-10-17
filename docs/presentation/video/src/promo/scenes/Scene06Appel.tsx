// Scène 6 (40 – 48 s), fonctionnalité 3 : l'appel par QR code. L'écran projeté de l'appel, zoom
// lent vers le QR ; trois pastilles de bénéfice arrivent en cascade (6 images d'écart). Youssef parle.
import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { Navigateur } from "../components/Cadre";
import { Pastille, Plan, Titre } from "../components/Elements";
import { Personnage } from "../components/Personnage";
import { selon, useFormat } from "../format";
import { BORNES } from "../theme";

const BENEFICES = ["Code renouvelé toutes les 30 s", "Présents affichés en direct", "Historique par classe"];

export const Scene06Appel: React.FC<{ duree: number }> = ({ duree }) => {
  const f = useCurrentFrame();
  const fmt = useFormat();
  const cadre = selon(fmt, { x: 600, y: 230, l: 1100 }, { x: 50, y: 400, l: 980 }, { x: 330, y: 200, l: 720 });
  const youssef = selon(fmt, { x: 300, sol: 975, h: 720 }, { x: 230, sol: 1700, h: 640 }, { x: 170, sol: 1010, h: 580 });
  const pastilles = selon(
    fmt,
    { x: 1360, y: 420, pas: 104, taille: 34 },
    { x: 430, y: 1050, pas: 112, taille: 36 },
    { x: 470, y: 700, pas: 86, taille: 28 },
  );

  return (
    <Plan duree={duree}>
      <Titre de={6} taille={selon(fmt, 84, 88, 66)} style={selon(fmt, { left: cadre.x, top: 96 } as React.CSSProperties, { left: 60, right: 60, top: 170, textAlign: "center" }, { left: cadre.x, right: 40, top: 66 })}>
        L'appel en un scan.
      </Titre>
      <Navigateur src="captures/prof-05-appel-projection.png" x={cadre.x} y={cadre.y} largeur={cadre.l} zoom={interpolate(f, [0, duree], [1, 1.06], BORNES)} origine={[330, 620]} />
      {BENEFICES.map((b, i) => (
        <Pastille key={b} de={66 + i * 6} taille={pastilles.taille} style={{ left: pastilles.x, top: pastilles.y + i * pastilles.pas }}>
          {b}
        </Pastille>
      ))}
      <Personnage qui="youssef" x={youssef.x} sol={youssef.sol} hauteur={youssef.h} pose="repos" imageLocale={f} />
    </Plan>
  );
};
