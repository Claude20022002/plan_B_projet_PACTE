import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { Embleme } from "../components/Embleme";
import { PhoneFrame, Screen } from "../components/Frames";
import { Etiquette } from "../scenes/S2Outils";
import { C, FONT_TEXT, FONT_TITLE } from "../theme";

/**
 * Carrousel LinkedIn (document PDF, 1080 × 1350, 4:5) : la même histoire que la vidéo, à lire à
 * son rythme. Une image = une page (l'image n° k de la composition est la page k). Les animations
 * des composants partagés démarrent avant 0 : chaque page est rendue dans son état final.
 * Rendu : npm run carrousel (PNG par page, puis PDF dans out/carrousel/).
 */

export const LARGEUR = 1080;
export const HAUTEUR = 1350;
const MARGE = 84;
const FINI = -400; // départ des animations partagées : déjà terminées

const Titre: React.FC<{ children: React.ReactNode; taille?: number; style?: React.CSSProperties }> = ({ children, taille = 92, style }) => (
  <div style={{ fontFamily: FONT_TITLE, fontWeight: 700, fontSize: taille, lineHeight: 1.02, letterSpacing: "0.01em", textTransform: "uppercase", color: C.ink, ...style }}>{children}</div>
);

const Texte: React.FC<{ children: React.ReactNode; taille?: number; style?: React.CSSProperties }> = ({ children, taille = 38, style }) => (
  <div style={{ fontFamily: FONT_TEXT, fontSize: taille, lineHeight: 1.32, color: C.inkSoft, ...style }}>{children}</div>
);

/** Cadre commun : marque en haut, numéro de page et invitation à glisser en bas. */
const Page: React.FC<{ n: number; total: number; children: React.ReactNode }> = ({ n, total, children }) => (
  <AbsoluteFill style={{ background: C.bg, padding: MARGE }}>
    <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
      <Embleme start={FINI} tileStart={FINI} size={40} tile />
      <div style={{ fontFamily: FONT_TITLE, fontWeight: 700, fontSize: 30, letterSpacing: "0.14em", color: C.ink }}>HESTIM PLANNER</div>
    </div>
    <div style={{ position: "relative", flex: 1, marginTop: 56 }}>{children}</div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: FONT_TITLE, fontWeight: 600, fontSize: 28, letterSpacing: "0.12em", color: C.inkSoft }}>
      <span>
        {String(n).padStart(2, "0")} / {String(total).padStart(2, "0")}
      </span>
      {n < total ? <span style={{ color: C.ink }}>GLISSEZ →</span> : null}
    </div>
  </AbsoluteFill>
);

/** Bannière de notification de téléphone (même dessin que la vidéo). */
const Notification: React.FC<{ titre: string; detail: string; pastille: string; largeur?: number; style?: React.CSSProperties }> = ({ titre, detail, pastille, largeur = 912, style }) => {
  const k = largeur / 400;
  return (
    <div
      style={{
        width: largeur,
        padding: `${12 * k}px ${14 * k}px`,
        borderRadius: 18 * k,
        background: "#212124",
        boxShadow: `0 ${10 * k}px ${30 * k}px rgba(0,0,0,0.45), 0 0 0 1px ${C.rule}`,
        display: "flex",
        gap: 12 * k,
        alignItems: "center",
        fontFamily: FONT_TEXT,
        ...style,
      }}
    >
      <Embleme start={FINI} tileStart={FINI} size={30 * k} tile style={{ flex: "none", borderRadius: 9 * k }} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13 * k, color: C.inkSoft }}>HESTIM Planner · maintenant</div>
        <div style={{ display: "flex", alignItems: "center", gap: 7 * k, marginTop: 2 * k }}>
          <div style={{ width: 8 * k, height: 8 * k, borderRadius: 4 * k, background: pastille, flex: "none" }} />
          <div style={{ fontFamily: FONT_TITLE, fontSize: 18 * k, fontWeight: 700, letterSpacing: "0.06em", color: C.ink }}>{titre}</div>
        </div>
        <div style={{ fontSize: 14 * k, color: C.ink, marginTop: 2 * k, lineHeight: 1.25 }}>{detail}</div>
      </div>
    </div>
  );
};

/** Téléphone avec une capture (1080 × 2400). */
const Telephone: React.FC<{ capture: string; hauteur?: number; style?: React.CSSProperties }> = ({ capture, hauteur = 860, style }) => {
  const largeur = Math.round((hauteur * 1080) / 2400);
  return (
    <PhoneFrame screenHeight={hauteur} style={style}>
      <Screen src={`captures/${capture}`} srcW={1080} srcH={2400} width={largeur} zoom={[1, 1]} />
    </PhoneFrame>
  );
};

/** Liste de services, puce carrée à la manière d'une lampe du panneau. */
const Liste: React.FC<{ lignes: string[]; style?: React.CSSProperties }> = ({ lignes, style }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 22, ...style }}>
    {lignes.map((l) => (
      <div key={l} style={{ display: "flex", gap: 20, alignItems: "baseline" }}>
        <div style={{ width: 14, height: 14, borderRadius: 7, background: C.ink, flex: "none", transform: "translateY(-4px)" }} />
        <Texte taille={36} style={{ color: C.ink }}>
          {l}
        </Texte>
      </div>
    ))}
  </div>
);

/** Page à deux colonnes : texte à gauche, téléphone à droite. */
const AvecTelephone: React.FC<{ titre: React.ReactNode; texte: string; lignes: string[]; capture: string }> = ({ titre, texte, lignes, capture }) => (
  <>
    <div style={{ position: "absolute", left: 0, top: 0, width: 430 }}>
      <Titre taille={78}>{titre}</Titre>
      <Texte style={{ marginTop: 28 }}>{texte}</Texte>
      <Liste lignes={lignes} style={{ marginTop: 40 }} />
    </div>
    <Telephone capture={capture} hauteur={880} style={{ right: -8, top: 20 }} />
  </>
);

const PAGES: React.FC[] = [
  // 1 · L'accroche
  () => (
    <>
      <Titre taille={124}>Ton cours est reporté.</Titre>
      <Titre taille={124} style={{ color: C.inkSoft, marginTop: 8 }}>
        Tu l'apprends comment ?
      </Titre>
      <Notification titre="COURS REPORTÉ" detail="Big Data · jeudi 13:30 · salle ST-S02" pastille={C.delayed} style={{ position: "absolute", left: 0, bottom: 120 }} />
    </>
  ),
  // 2 · Le problème
  () => (
    <>
      <Titre taille={80}>Aujourd'hui, à l'école :</Titre>
      <div style={{ display: "flex", flexDirection: "column", gap: 34, marginTop: 64 }}>
        {["GMAIL", "PDF PAR E-MAIL", "WHATSAPP", "CLASSROOM", "MOODLE", "JEUX EXTERNES"].map((mot) => (
          <Etiquette key={mot} mot={mot} start={FINI} barreA={FINI + 60} frame={1000} fs={64} />
        ))}
      </div>
      <Texte taille={40} style={{ position: "absolute", bottom: 40, left: 0, right: 0, color: C.ink }}>
        Six outils. Un report raté, une salle cherchée, un devoir oublié.
      </Texte>
    </>
  ),
  // 3 · La réponse
  () => (
    <AvecTelephone
      titre={
        <>
          Une seule
          <br />
          application
          <br />
          pour toute
          <br />
          l'école.
        </>
      }
      texte="L'emploi du temps, les cours, les devoirs, les jeux et les annonces, au même endroit."
      lignes={["Web, iPhone et Android", "Un seul compte", "Mis à jour en direct"]}
      capture="mobile-37-mois.png"
    />
  ),
  // 4 · Les alertes et l'agenda
  () => (
    <>
      <Titre taille={92}>Prévenu à la seconde.</Titre>
      <Texte style={{ marginTop: 24, maxWidth: 860 }}>Un cours bouge ? Le téléphone sonne, et l'agenda se corrige tout seul : Google Agenda, iPhone, Outlook.</Texte>
      <div style={{ display: "flex", flexDirection: "column", gap: 28, marginTop: 70 }}>
        <Notification titre="COURS REPORTÉ" detail="Big Data · jeudi 13:30 · salle ST-S02" pastille={C.delayed} />
        <Notification titre="NOUVELLE ANNONCE" detail="Réunion pédagogique des 4A · vendredi 10:00" pastille={C.ink} />
        <Notification titre="EMPLOI DU TEMPS DE NOVEMBRE" detail="IIIA 4A : 64 séances · consultable et imprimable" pastille={C.inkSoft} />
      </div>
    </>
  ),
  // 5 · Les cours et les devoirs
  () => (
    <AvecTelephone
      titre={
        <>
          Tout le
          <br />
          cours au
          <br />
          même endroit.
        </>
      }
      texte="Fini les supports perdus dans les e-mails."
      lignes={["Supports rangés par module", "Devoirs à rendre en un fichier", "Notes et commentaires du professeur"]}
      capture="mobile-39-supports-module-clair.png"
    />
  ),
  // 6 · Les retours de stage
  () => (
    <>
      <Titre taille={92}>
        Le bon stage,
        <br />
        grâce aux anciens.
      </Titre>
      <Texte style={{ marginTop: 28, maxWidth: 880 }}>
        Chaque étudiant peut partager son retour de stage. Les promotions suivantes choisissent en connaissance de cause.
      </Texte>
      <Liste
        lignes={[
          "Missions, encadrement et conseils, racontés par un étudiant",
          "Entreprise, ville, poste, stage rémunéré ou non",
          "Une note sur l'expérience",
          "Publié seulement avec l'accord de l'auteur",
          "Visible des seuls étudiants HESTIM",
        ]}
        style={{ marginTop: 64 }}
      />
    </>
  ),
  // 7 · Les jeux
  () => (
    <AvecTelephone
      titre={
        <>
          Apprendre
          <br />
          en jouant.
        </>
      }
      texte="Les quiz du cours, sans site externe ni publicité."
      lignes={["Quiz en direct pendant la séance", "Défis par équipes", "Nuage de mots de la classe"]}
      capture="mobile-13-resultats.png"
    />
  ),
  // 8 · L'appel par QR code
  () => (
    <>
      <Titre taille={92}>L'appel en 5 secondes.</Titre>
      <Texte style={{ marginTop: 24, maxWidth: 880 }}>Le professeur affiche un QR code, les étudiants le scannent. Il change toutes les 30 secondes : inutile de l'envoyer à un absent.</Texte>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 30, display: "flex", gap: 48, alignItems: "center" }}>
        <div style={{ background: "#FFFFFF", padding: 22, borderRadius: 22, boxShadow: `0 24px 60px rgba(0,0,0,0.55)` }}>
          <Img src={staticFile("carrousel/qr.png")} style={{ width: 420, height: 420, display: "block" }} />
        </div>
        <div>
          <div style={{ fontFamily: FONT_TITLE, fontWeight: 700, fontSize: 120, color: C.ink, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>28 / 30</div>
          <Texte taille={36} style={{ marginTop: 10 }}>
            présents
          </Texte>
          <Texte taille={30} style={{ marginTop: 34 }}>
            Nouveau code dans 12 s
          </Texte>
        </div>
      </div>
    </>
  ),
  // 9 · Les chiffres
  () => (
    <>
      <Titre taille={80}>En chiffres</Titre>
      <div style={{ display: "flex", flexDirection: "column", gap: 70, marginTop: 90 }}>
        {[
          { chiffre: "90 s", legende: "pour planifier tout un semestre" },
          { chiffre: "1 compte", legende: "au lieu de six outils" },
          { chiffre: "0 publicité", legende: "dans les jeux et les quiz" },
        ].map((l) => (
          <div key={l.chiffre}>
            <div style={{ fontFamily: FONT_TITLE, fontWeight: 700, fontSize: 150, lineHeight: 0.95, color: C.ink, textTransform: "uppercase" }}>{l.chiffre}</div>
            <Texte taille={40} style={{ marginTop: 8 }}>
              {l.legende}
            </Texte>
          </div>
        ))}
      </div>
    </>
  ),
  // 10 · La fin et la question
  () => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", height: "100%" }}>
      <Embleme start={FINI} tileStart={FINI} size={190} tile style={{ marginTop: 70 }} />
      <Titre taille={110} style={{ marginTop: 56, letterSpacing: "0.06em" }}>
        HESTIM Planner
      </Titre>
      <Texte taille={46} style={{ color: C.ink, marginTop: 14 }}>
        L'école, à l'heure.
      </Texte>
      <div style={{ fontFamily: FONT_TITLE, fontWeight: 600, fontSize: 34, letterSpacing: "0.18em", color: C.inkSoft, marginTop: 40 }}>WEB · IPHONE · ANDROID</div>
      <div style={{ marginTop: "auto", marginBottom: 40, padding: "34px 40px", border: `2px solid ${C.rule}`, borderRadius: 24 }}>
        <Texte taille={40} style={{ color: C.ink }}>
          Qu'est-ce qui vous fait perdre le plus de temps à l'école aujourd'hui ?
        </Texte>
        <Texte taille={32} style={{ marginTop: 12 }}>
          Dites-le en commentaire.
        </Texte>
      </div>
    </div>
  ),
];

export const NB_PAGES = PAGES.length;

export const Carrousel: React.FC = () => {
  const frame = useCurrentFrame();
  const n = Math.min(Math.max(frame, 0), PAGES.length - 1);
  const Contenu = PAGES[n];
  return (
    <Page n={n + 1} total={PAGES.length}>
      <Contenu />
    </Page>
  );
};
