/**
 * Fiches d'aide (lot B-9) : chaque fiche a ses textes dans les deux langues, son thème, et des pages
 * qui existent ; aucun texte de fiche ne reste sans fiche. Un retrait ou un renommage d'écran qui
 * oublie l'aide fait échouer ce test. Lancé par `npm run test:unit` (lanceur de Node).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fr from '../../i18n/fr.js';
import en from '../../i18n/en.js';
import { FICHES } from './fiches.js';

// Pages d'une autre application servie sur la même adresse (la bibliothèque) : pas de route ici
const AUTRES_APPLICATIONS = ['/biblio/'];

const src = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

/** Routes déclarées par le site (App.jsx et routes/), en expressions : « :id » vaut un segment. */
const routes = () => {
  const fichiers = [path.join(src, 'App.jsx'), ...readdirSync(path.join(src, 'routes')).map((f) => path.join(src, 'routes', f))];
  const chemins = fichiers.flatMap((f) => [...readFileSync(f, 'utf8').matchAll(/path="([^"*]+)"/g)].map((m) => m[1]));
  return chemins.map((c) => ({ chemin: c, motif: new RegExp(`^${c.replace(/:[^/]+/g, '[^/]+')}$`) }));
};

/** Textes d'une fiche : la variante sans devoirs l'emporte quand elle existe (CONTEXTE_DEVOIRS) */
const etapes = (fiche) => fiche.etapes_sansDevoirs ?? fiche.etapes;

test('chaque fiche a un identifiant unique', () => {
  const ids = FICHES.map((f) => f.id);
  assert.equal(new Set(ids).size, ids.length);
});

for (const [langue, dico] of [['fr', fr], ['en', en]]) {
  test(`chaque fiche a son titre, ses étapes et son thème en ${langue}`, () => {
    for (const f of FICHES) {
      const textes = dico.aide.fiches[f.id];
      assert.ok(textes, `${f.id} : aucun texte en ${langue}`);
      assert.equal(typeof textes.titre, 'string', `${f.id} : titre manquant en ${langue}`);
      assert.ok(Array.isArray(etapes(textes)) && etapes(textes).length > 0, `${f.id} : étapes manquantes en ${langue}`);
      assert.equal(typeof dico.aide.themes[f.theme], 'string', `${f.id} : thème « ${f.theme} » sans libellé en ${langue}`);
    }
  });

  test(`aucun texte de fiche sans fiche en ${langue}`, () => {
    const ids = new Set(FICHES.map((f) => f.id));
    const orphelins = Object.keys(dico.aide.fiches).filter((id) => !ids.has(id));
    assert.deepEqual(orphelins, [], `textes sans fiche en ${langue}`);
  });
}

test('le lien de chaque fiche ouvre une page qui existe, et ses pages aussi', () => {
  const liste = routes();
  const existe = (chemin) => AUTRES_APPLICATIONS.some((a) => chemin.startsWith(a)) || liste.some((r) => r.motif.test(chemin));
  // « pages » désigne le début du chemin : une route doit commencer par lui (ou lui correspondre)
  const debutExiste = (debut) => existe(debut) || liste.some((r) => r.chemin.startsWith(debut));
  for (const f of FICHES) {
    // Une fiche peut ne pas avoir de « Y aller » (lien nul)
    if (f.lien !== null) assert.ok(existe(f.lien), `${f.id} : le lien ${f.lien} ne correspond à aucune route`);
    for (const page of f.pages) assert.ok(debutExiste(page), `${f.id} : la page ${page} ne correspond à aucune route`);
  }
});
