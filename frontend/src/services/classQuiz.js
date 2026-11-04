/**
 * État de ClassQuiz pour le site (lot ME-0c) : la source commune de shared/classQuiz.js, lue par
 * le crochet useClassQuiz et par le sélecteur d'espaces. Une lecture de /quiz/config par page.
 */
import { quizAPI } from './api';
import { creerSourceClassQuiz } from '../../../shared/classQuiz.js';

export const sourceClassQuiz = creerSourceClassQuiz(() => quizAPI.getConfig());
