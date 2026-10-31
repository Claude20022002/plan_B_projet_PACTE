import { chargerConfigQuiz } from '../api/donnees';
import { creerSourceClassQuiz } from '../../../shared/classQuiz.js';

/**
 * État de ClassQuiz pour l'application (lot ME-0c) : la source commune de shared/classQuiz.js,
 * lue par le crochet useClassQuiz, le scanner et le lecteur. Une lecture de /quiz/config par
 * lancement de l'application ; une erreur vaut « éteint » et la lecture suivante réessaie.
 */
export const sourceClassQuiz = creerSourceClassQuiz(() => chargerConfigQuiz());
