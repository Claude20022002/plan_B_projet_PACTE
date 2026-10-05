#!/usr/bin/env node
/**
 * Génère les quiz HESTIM au format d'archive de ClassQuiz (.cqa), importables par un enseignant
 * dans l'espace Quiz : Tableau de bord → Importer → fichier .cqa.
 *
 * Format (ClassQuiz, classquiz/routers/cqa-file-format.md) : JSON du quiz compressé en gzip,
 * suivi du séparateur C7 C7 C7 00 (aucune image ici).
 *
 * Usage : node deploy/quiz/generer-cqa.mjs   (écrit deploy/quiz/*.cqa à côté des .json)
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ici = dirname(fileURLToPath(import.meta.url));
const SEPARATEUR_QUIZ = Buffer.from([0xc7, 0xc7, 0xc7, 0x00]);
const DUREE_QUESTION_S = '20';

/** Place de la bonne réponse, stable d'une génération à l'autre (pas toujours la première). */
const place = (texte, n) => [...texte].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % n;

const versClassQuiz = (source) => {
  const maintenant = new Date().toISOString();
  return {
    public: false,
    title: source.title,
    description: source.description,
    created_at: maintenant,
    updated_at: maintenant,
    imported_from_kahoot: false,
    cover_image: null,
    background_color: null,
    background_image: null,
    kahoot_id: null,
    likes: 0,
    dislikes: 0,
    plays: 0,
    views: 0,
    mod_rating: null,
    questions: source.questions.map((q) => {
      if (!q.question || !q.bonne || q.fausses?.length !== 3) throw new Error(`Question incomplète : ${q.question}`);
      const reponses = q.fausses.map((answer) => ({ right: false, answer, color: null }));
      reponses.splice(place(q.question, 4), 0, { right: true, answer: q.bonne, color: null });
      return { question: q.question, time: DUREE_QUESTION_S, type: 'ABCD', answers: reponses, image: null, hide_results: false };
    }),
  };
};

for (const fichier of readdirSync(ici).filter((f) => f.endsWith('.json'))) {
  const source = JSON.parse(readFileSync(join(ici, fichier), 'utf8'));
  const quiz = versClassQuiz(source);
  const archive = Buffer.concat([gzipSync(Buffer.from(JSON.stringify(quiz), 'utf8'), { level: 9 }), SEPARATEUR_QUIZ]);
  const sortie = join(ici, fichier.replace(/\.json$/, '.cqa'));
  writeFileSync(sortie, archive);
  console.log(`${sortie} : ${quiz.questions.length} questions (${source.source.nom}, ${source.source.licence})`);
}
