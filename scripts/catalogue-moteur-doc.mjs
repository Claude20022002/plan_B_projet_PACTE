#!/usr/bin/env node
/**
* Génère les pages lisibles du catalogue du moteur (docs/plans/moteur-planification/catalogue) depuis
* les fichiers JSON de backend/services/moteur/catalogue. Les JSON font foi : ne pas modifier ces pages
* à la main. Un test échoue si elles ne sont plus à jour.
*
* Lancement : node scripts/catalogue-moteur-doc.mjs
*/
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chargerDependances, chargerFamilles, chargerParametres, chargerProfils } from '../backend/services/moteur/catalogue/charger.js';
import { rangsDeCalcul } from '../backend/services/moteur/catalogue/verifier.js';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DOSSIER = path.join(RACINE, 'docs/plans/moteur-planification/catalogue');

const AVERTISSEMENT = '<!-- Page générée par scripts/catalogue-moteur-doc.mjs depuis backend/services/moteur/catalogue : ne pas modifier à la main. -->\n\n';
const NIVEAUX = { G: 'global', P: 'pédagogique', I: 'individuel' };
const FORCES = { strict: 'strict', souple: 'souple', sans_objet: '—' };

// Une cellule de tableau ne supporte ni barre verticale ni retour à la ligne
const cellule = (v) => String(v ?? '—').replace(/\|/g, '\\|').replace(/\n/g, ' ');
const valeur = (v) => (v === null || v === undefined ? '—' : `\`${typeof v === 'object' ? JSON.stringify(v) : v}\``);
const niveaux = (p) => [...p.niveaux].map((n) => NIVEAUX[n]).join(', ') + (p.cible && /I/.test(p.niveaux) ? ` (${p.cible})` : '');
const typeDe = (p) => (p.type === 'enum' ? `enum : ${p.valeurs.join(', ')}` : p.type);
const force = (p) => FORCES[p.force] + (p.force_reglable ? ' *' : '');

const ligne = (p) =>
  `| \`${p.id}\` | ${cellule(p.nom)} | ${cellule(p.description)} | ${p.role} | ${cellule(typeDe(p))} | ${cellule(valeur(p.defaut))} | ${niveaux(p)} | ${p.obligatoire ? 'oui' : 'non'} | ${force(p)} | ${p.priorite} | ${p.poids ?? '—'} | ${p.modifiable} | ${p.validite} | ${p.etat}${p.ref ? ` (${cellule(p.ref)})` : ''} | ${p.sources.join(' ') || 'ajout'} |`;

const pageFamille = (f) => {
  const titre = `# ${f.code} · ${f.nom}\n\n${f.role ? `${f.role}\n\n` : ''}`;
  const tete = '| Identifiant | Nom | Description | Rôle | Type | Valeur par défaut | Niveau | Obligatoire | Force | Priorité | Poids | Modifiable par | Validité | État aujourd\'hui | Source |\n|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|\n';
  const groupes = f.groupes.map((g) => `## ${g.nom}\n\n${tete}${g.parametres.map(ligne).join('\n')}\n`).join('\n');
  return `${AVERTISSEMENT}${titre}${groupes}`;
};

const bilan = (parametres) => {
  const compte = (filtre) => parametres.filter(filtre).length;
  const regles = parametres.filter((p) => p.role === 'regle');
  const lignes = [
    ['Paramètres', parametres.length],
    ['Règles', regles.length],
    ['dont strictes', regles.filter((p) => p.force === 'strict').length],
    ['dont souples', regles.filter((p) => p.force === 'souple').length],
    ['dont tenues par le solveur aujourd\'hui', regles.filter((p) => p.regle_solveur).length],
    ['Données', compte((p) => p.role === 'donnee')],
    ['Pilotage du moteur', compte((p) => p.role === 'pilotage')],
    ['Indicateurs', compte((p) => p.role === 'indicateur')],
    ['Gestion après publication', compte((p) => p.role === 'gestion')],
    ['Contexte (hors calcul)', compte((p) => p.role === 'contexte')],
  ];
  return `| Mesure | Nombre |\n|---|---|\n${lignes.map(([a, b]) => `| ${a} | ${b} |`).join('\n')}\n`;
};

const pageIndex = (familles, parametres) => {
  const lignes = familles.map((f) => {
    const ps = f.groupes.flatMap((g) => g.parametres);
    const regles = ps.filter((p) => p.role === 'regle').length;
    const nouveaux = ps.filter((p) => p.etat === 'absent').length;
    return `| [${f.code}](${f.code}.md) | ${f.nom} | ${ps.length} | ${regles} | ${nouveaux} |`;
  });
  return `${AVERTISSEMENT}# Catalogue des paramètres\n\n${bilan(parametres)}\n| Famille | Nom | Paramètres | Règles | Absents du code |\n|---|---|---|---|---|\n${lignes.join('\n')}\n\nVoir aussi [les dépendances](dependances.md) et [les profils](profils.md). Une force suivie de « * » peut être changée par un profil.\n`;
};

const pageDependances = (parametres, dependances) => {
  const { rangs } = rangsDeCalcul(parametres, dependances);
  const parRang = new Map();
  for (const [id, r] of rangs) parRang.set(r, [...(parRang.get(r) ?? []), id]);
  const ordre = [...parRang.keys()].sort((a, b) => a - b).map((r) => `| ${r} | ${parRang.get(r).length} | ${parRang.get(r).map((i) => `\`${i}\``).join(' ')} |`);
  const par = (type) => dependances.filter((d) => d.type === type);
  const tableau = (type, tete, rendu) => `| ${tete.join(' | ')} |\n|${tete.map(() => '---').join('|')}|\n${par(type).map((d) => `| ${rendu(d).join(' | ')} |`).join('\n')}\n`;
  return `${AVERTISSEMENT}# Dépendances entre paramètres\n\n${dependances.length} liens. L'explication des types est dans [le README](../README.md).\n\n## Ordre de calcul\n\nUn paramètre d'un rang ne dépend que de rangs inférieurs : c'est l'ordre de saisie et de validation.\n\n| Rang | Nombre | Paramètres |\n|---|---|---|\n${ordre.join('\n')}\n\n## Activations\n\n${tableau('active_si', ['Paramètre', 'Ne compte que si', 'Condition', 'Pourquoi'], (d) => [`\`${d.de}\``, `\`${d.vers}\``, `${cellule(d.op)} ${valeur(d.val)}`, cellule(d.pourquoi)])}\n## Bornes\n\n${tableau('borne', ['Paramètre', 'Relation', 'Paramètre', 'Pourquoi'], (d) => [`\`${d.de}\``, cellule(d.op), `\`${d.vers}\``, cellule(d.pourquoi)])}\n## Exclusions\n\n${tableau('exclut', ['Paramètre', 'Exclut'], (d) => [`\`${d.de}\``, `\`${d.vers}\``])}\n## Tensions entre objectifs\n\n${tableau('tension', ['Objectif', 'Contre', 'Pourquoi'], (d) => [`\`${d.de}\``, `\`${d.vers}\``, cellule(d.pourquoi)])}\n## Ce que lit chaque paramètre\n\n${tableau('requiert', ['Paramètre', 'Lit'], (d) => [`\`${d.de}\``, `\`${d.vers}\``])}\n## Valeurs calculées\n\n${tableau('derive_de', ['Paramètre', 'Se déduit de'], (d) => [`\`${d.de}\``, `\`${d.vers}\``])}`;
};

const pageProfils = (profils) => {
  const TRAITS = [['unite', 'Unité principale'], ['enseignants', 'Enseignants'], ['duree', 'Durée des cours'], ['groupes', 'Groupes'], ['salles', 'Salles'], ['organisation', 'Organisation'], ['priorite', 'Priorité']];
  const tete = `| Élément | ${profils.map((p) => p.nom).join(' | ')} |\n|---|${profils.map(() => '---').join('|')}|\n`;
  const traits = TRAITS.map(([k, n]) => `| ${n} | ${profils.map((p) => p.traits[k]).join(' | ')} |`).join('\n');
  const ids = [...new Set(profils.flatMap((p) => Object.keys(p.reglages)))].sort();
  const reglage = (r) => (!r ? '—' : [r.valeur !== undefined ? valeur(r.valeur) : null, r.force ?? null, r.poids ? `poids ${r.poids}` : null].filter(Boolean).join(', '));
  const reglages = ids.map((id) => `| \`${id}\` | ${profils.map((p) => cellule(reglage(p.reglages[id]))).join(' | ')} |`).join('\n');
  return `${AVERTISSEMENT}# Profils pédagogiques\n\nUn profil est un jeu de valeurs de départ pour le même moteur. **Ces valeurs sont des propositions à faire valider, pas des règles de pays.**\n\n${tete}${traits}\n\n## Réglages\n\n« — » : la valeur par défaut du catalogue s'applique.\n\n| Paramètre | ${profils.map((p) => p.nom).join(' | ')} |\n|---|${profils.map(() => '---').join('|')}|\n${reglages}\n`;
};

/** Les pages à écrire, par nom de fichier. */
export const pagesDuCatalogue = () => {
  const familles = chargerFamilles();
  const parametres = chargerParametres();
  return {
    'README.md': pageIndex(familles, parametres),
    'dependances.md': pageDependances(parametres, chargerDependances()),
    'profils.md': pageProfils(chargerProfils()),
    ...Object.fromEntries(familles.map((f) => [`${f.code}.md`, pageFamille(f)])),
  };
};

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  rmSync(DOSSIER, { recursive: true, force: true });
  mkdirSync(DOSSIER, { recursive: true });
  for (const [nom, contenu] of Object.entries(pagesDuCatalogue())) writeFileSync(path.join(DOSSIER, nom), contenu);
  console.log(`${Object.keys(pagesDuCatalogue()).length} pages écrites dans ${path.relative(RACINE, DOSSIER)}`);
}
