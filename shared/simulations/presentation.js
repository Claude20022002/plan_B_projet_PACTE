/** Presentation helpers shared by the web and native game screens. */

/** Reads one language branch of a bilingual catalogue value; falls back to plain strings. */
const lireTexte = (u, langue) => (typeof u === 'string' ? u : u?.[langue] ?? u?.fr ?? u?.en ?? '');

/** Describes input fields without evaluating or coercing blank values. */
export function champsSimulation(jeu, defi, t, langue = 'fr', bilingue = (u) => lireTexte(u, langue)) {
    if (jeu.moteur === 'robot') return [{ cle: 'programme', label: t('programme'), texte: true }];
    if (jeu.moteur === 'seuil') return [{ cle: 'seuil', label: t('seuil') }];
    if (jeu.moteur === 'triage') return (defi?.evenements ?? []).map((evt, i) => ({
        cle: `evt${i}`, label: t('evtChamp', { n: i + 1, id: evt.id }), min: 1, max: 4, aide: t('triageAide'),
    }));
    if (jeu.moteur === 'sql') return (defi?.clauses ?? []).map((c, i) => ({
        cle: `clause${i}`, label: t('clauseChamp', { n: i + 1, frag: bilingue(c.texte) }), min: 1, max: 4, aide: t('sqlAide'),
    }));
    if (jeu.moteur === 'reseau') return (defi?.appareils ?? []).map((app, i) => ({
        cle: `device${i}`, label: t('deviceChamp', { n: i + 1, nom: app.nom }), min: 0, max: Math.max(0, (defi.switches?.length ?? 1) - 1), aide: t('reseauAide'),
    }));
    if (jeu.moteur === 'cpu') return (defi?.processus ?? []).map((p, i) => ({
        cle: `cpu${i}`, label: t('cpuChamp', { n: i + 1 }), min: 0, max: 3, aide: t('cpuAide', { ordinal: i + 1 }),
    }));
    if (jeu.moteur === 'sprint') return (defi?.backlog ?? []).map((item, i) => ({
        cle: `item${i}`, label: t('sprintChamp', { n: i + 1, nom: item.nom }), min: 0, max: 1, aide: t('sprintAide'),
    }));
    if (jeu.moteur === 'budget') return (defi?.lignes ?? []).map((l, i) => ({
        cle: `poste${i}`, label: t('budgetChamp', { n: i + 1, nom: l.nom, fixe: l.fixe, unite: l.unite }), min: 0, max: 999, aide: t('budgetAide'),
    }));
    return [0, 1, 2].map((i) => ({ cle: `jour${i}`, label: t('commande', { day: i + 1 }) }));
}

/** Gives a cell its visible symbol and a non-color-dependent accessible description. */
export function caseRobot(defi, x, y, resultat, t) {
    const ici = (p) => p[0] === x && p[1] === y;
    const type = ici(defi.depart) ? 'depart' : ici(defi.arrivee) ? 'arrivee'
        : defi.obstacles.some(ici) ? 'obstacle' : defi.passages.some(ici) ? 'passage' : 'libre';
    const visite = resultat?.trajet?.some(ici);
    const symbole = { depart: 'D', arrivee: 'A', obstacle: '#', passage: 'P', libre: visite ? '·' : '' }[type];
    return { type, symbole, visite, label: `${x + 1}, ${y + 1}: ${t(type)}${visite ? `, ${t('visite')}` : ''}` };
}

/** Returns tables shared by screen-reader-friendly web tables and native labeled rows. */
export function tableauxSimulation(jeu, defi, resultat, t, langue = 'fr', bilingue = (u) => lireTexte(u, langue)) {
    if (jeu.moteur === 'robot') return [];
    if (jeu.moteur === 'stock') return [{
        titre: t('donnees'),
        colonnes: (resultat ? ['jour', 'ouverture', 'reception', 'demande', 'fermeture', 'manque'] : ['jour', 'demande']).map((c) => t(c)),
        lignes: resultat ? resultat.jours.map((j) => [j.jour, j.ouverture, j.reception, j.demande, j.fermeture, j.manque]) : defi.demandes.map((n, i) => [i + 1, n]),
    }];
    if (jeu.moteur === 'triage') {
        const evenements = defi.evenements.map((evt, i) => [
            evt.id, bilingue(evt.titre), evt.portee, t(evt.donnees), t(evt.statut),
            ...(resultat ? [resultat.evenements[i].score, t(`niveau${resultat.evenements[i].attendu}`), resultat.evenements[i].correct ? t('oui') : t('non')] : []),
        ]);
        return [{
            titre: t('donnees'),
            colonnes: [t('evt'), t('evtTitre'), t('portee'), t('sensibilite'), t('statut'), ...(resultat ? [t('scoreLabel'), t('attendu'), t('obtenu')] : [])],
            lignes: evenements,
        }];
    }
    if (jeu.moteur === 'sql') {
        return [{
            titre: t('donnees'),
            colonnes: [t('fragment'), ...(resultat ? [t('attendu'), t('obtenu'), t('correctLabel')] : [])],
            lignes: defi.clauses.map((c, i) => [
                bilingue(c.texte),
                ...(resultat ? [resultat.fragments[i].attendu, resultat.fragments[i].position, resultat.fragments[i].correct ? t('oui') : t('non')] : []),
            ]),
        }];
    }
    if (jeu.moteur === 'reseau') {
        const tables = [{
            titre: t('donnees'),
            colonnes: [t('appareilLabel'), ...(resultat ? [t('switchAssignee')] : [])],
            lignes: defi.appareils.map((app, i) => [app.nom, ...(resultat ? [resultat.appareils[i].switchNom] : [])]),
        }, {
            titre: t('capacites'),
            colonnes: [t('switchLabel'), t('capaciteMax'), ...(resultat ? [t('occup')] : [])],
            lignes: defi.switches.map((sw, j) => [sw.nom, sw.capacite, ...(resultat ? [resultat.countByPort[j]] : [])]),
        }];
        return tables;
    }
    if (jeu.moteur === 'cpu') {
        return [{
            titre: t('processeurOrdonnancement'),
            colonnes: [t('cpuRendu'), t('cpuArrivee'), t('cpuDuree'), t('cpuEcheance'), ...(resultat ? [t('cpuDebut'), t('cpuFin'), t('cpuRotation'), t('cpuAttente')] : [])],
            lignes: resultat ? resultat.rendu.map((r) => [r.nom, r.arrivee, r.duree, r.echeance, r.debut, r.fin, r.rotation, r.attente])
                : defi.processus.map((p) => [p.nom, p.arrivee, p.duree, p.echeance]),
        }];
    }
    if (jeu.moteur === 'sprint') {
        return [{
            titre: t('sprintBacklog'),
            colonnes: [t('sprintNom'), t('sprintCharges'), t('sprintValeur'), t('sprintObligatoire'), ...(resultat ? [t('sprintPris')] : [])],
            lignes: resultat ? resultat.lignes.map((l) => [l.nom, l.charges, l.valeur, l.obligatoire ? t('oui') : t('non'), l.pris ? t('oui') : t('non')])
                : defi.backlog.map((it) => [it.nom, it.charges, it.valeur, it.obligatoire ? t('oui') : t('non')]),
        }];
    }
    if (jeu.moteur === 'budget') {
        return [{
            titre: t('budgetLignes'),
            colonnes: [t('budgetNom'), t('budgetFixe'), t('budgetUnite'), ...(resultat ? [t('budgetQuantite'), t('budgetCout')] : [])],
            lignes: resultat ? resultat.lignes.map((l) => [l.nom, l.fixe, l.unite, l.quantite, l.cout])
                : defi.lignes.map((l) => [l.nom, l.fixe, l.unite]),
        }];
    }
    const tables = [{
        titre: t('donnees'), colonnes: [t('piece'), t('score'), t('reel'), ...(resultat ? [t('prediction')] : [])],
        lignes: defi.observations.map(([score, vrai], i) => [i + 1, score, t(vrai ? 'defaut' : 'conforme'), ...(resultat ? [t(resultat.observations[i].predit ? 'alerte' : 'aucune')] : [])]),
    }];
    if (resultat) tables.push({
        titre: t('matrice'), colonnes: [t('vp'), t('fp'), t('vn'), t('fn')], lignes: [[resultat.vp, resultat.fp, resultat.vn, resultat.fn]],
    });
    return tables;
}

/** Explains measured outcomes; a missing prediction denominator never displays false precision. */
export function resumeSimulation(jeu, defi, resultat, t) {
    if (!resultat) return '';
    if (jeu.moteur === 'robot') return `${t('trajet')}: ${resultat.trajet.map(([x, y]) => `(${x + 1}, ${y + 1})`).join(' → ')}`;
    if (jeu.moteur === 'stock') return t('bilanStock', resultat);
    if (jeu.moteur === 'triage') return t('bilanTriage', {
        correct: resultat.evenements.filter((e) => e.correct).length, total: resultat.evenements.length,
    });
    if (jeu.moteur === 'sql') return t('bilanSql', {
        correct: resultat.fragments.filter((f) => f.correct).length, total: resultat.fragments.length,
    });
    if (jeu.moteur === 'reseau') return t('bilanReseau', {
        occupations: resultat.appareils.map((a) => `${a.nom}→${a.switchNom}`).join(', '),
        violation: resultat.problemes.length ? t('non') : t('oui'),
    });
    if (jeu.moteur === 'cpu') return t('cpuResume', { moyenne: resultat.moyenne, max: defi.moyenneMax, occupation: resultat.occupation });
    if (jeu.moteur === 'sprint') return t('sprintResume', { charge: resultat.charge, capacite: defi.capacite, valeur: resultat.valeur, valeurMin: defi.valeurMin, nbPris: resultat.nbPris });
    if (jeu.moteur === 'budget') return t('budgetResume', { total: resultat.total, couverture: resultat.couverture, budgetMax: defi.budget });
    const pourcent = (n) => n === null ? t('indefini') : `${Math.round(n * 10) / 10} %`;
    return `${t('precision')}: ${pourcent(resultat.precision)} · ${t('rappel')}: ${pourcent(resultat.rappel)} · ${t('cout')}: ${resultat.cout}`;
}
