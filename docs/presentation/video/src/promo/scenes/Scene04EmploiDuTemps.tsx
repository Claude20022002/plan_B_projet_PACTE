// Scène 4 (18 – 30 s), fonctionnalité 1 : l'emploi du temps du semestre généré sans conflit.
// Le curseur lance la génération, un halo montre « 2620 séance(s) créée(s) », puis l'emploi du temps
// du mois d'une classe, au format officiel, glisse à sa place. Nadia présente.
import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { Halo, Navigateur } from "../components/Cadre";
import { Curseur, Plan, Titre } from "../components/Elements";
import { Personnage } from "../components/Personnage";
import { selon, useFormat } from "../format";
import { BORNES, DOUX } from "../theme";

/** Image (locale) où la seconde capture remplace la première. */
const BASCULE = 190;

export const Scene04EmploiDuTemps: React.FC<{ duree: number }> = ({ duree }) => {
  const f = useCurrentFrame();
  const fmt = useFormat();
  const cadre = selon(fmt, { x: 600, y: 230, l: 1220 }, { x: 50, y: 400, l: 980 }, { x: 310, y: 210, l: 740 });
  const nadia = selon(fmt, { x: 290, sol: 975, h: 700 }, { x: 250, sol: 1700, h: 640 }, { x: 160, sol: 1010, h: 560 });
  const sortie = interpolate(f, [BASCULE - 10, BASCULE + 10], [0, 1], { ...BORNES, easing: DOUX });
  const entree = interpolate(f, [BASCULE, BASCULE + 22], [0, 1], { ...BORNES, easing: DOUX });

  return (
    <Plan duree={duree}>
      <Titre de={6} taille={selon(fmt, 76, 84, 64)} style={selon(fmt, { left: cadre.x, top: 96 } as React.CSSProperties, { left: 60, right: 60, top: 170, textAlign: "center" }, { left: cadre.x, right: 40, top: 70 })}>
        Le semestre se planifie seul.
      </Titre>
      <Navigateur
        src="captures/web-08-generation.png"
        x={cadre.x}
        y={cadre.y}
        largeur={cadre.l}
        zoom={interpolate(f, [0, BASCULE], [1, 1.06], BORNES)}
        origine={[760, 360]}
        style={{ opacity: 1 - sortie, transform: `translateX(${-40 * sortie}px)` }}
      >
        <Halo x={372} y={366} l={400} h={42} image={f} de={78} a={BASCULE - 6} />
        <Curseur de={[1560, 760]} vers={[1150, 268]} depart={18} arrivee={52} clic={58} taille={52} />
      </Navigateur>
      <Navigateur
        src="captures/admin-04b-edt-mensuel-classe.png"
        x={cadre.x}
        y={cadre.y}
        largeur={cadre.l}
        zoom={interpolate(f, [BASCULE, duree], [1, 1.06], BORNES)}
        origine={[900, 520]}
        style={{ opacity: entree, transform: `translateX(${40 * (1 - entree)}px)` }}
      />
      <Personnage qui="nadia" x={nadia.x} sol={nadia.sol} hauteur={nadia.h} pose="tablettePresente" imageLocale={f} />
    </Plan>
  );
};
