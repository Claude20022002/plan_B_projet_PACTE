<!-- Page générée par scripts/catalogue-moteur-doc.mjs depuis backend/services/moteur/catalogue : ne pas modifier à la main. -->

# Profils pédagogiques

Un profil est un jeu de valeurs de départ pour le même moteur. **Ces valeurs sont des propositions à faire valider, pas des règles de pays.**

| Élément | Collège | École privée et centre de formation | Lycée | Primaire | Université et école d'ingénieurs |
|---|---|---|---|---|---|
| Unité principale | Classe et groupes de langues | Groupe de formation | Classe et groupe | Classe | UE et groupe |
| Enseignants | Spécialisés | Formateurs, souvent externes | Spécialisés | Polyvalents | Spécialisés |
| Durée des cours | Période fixe | Variable, sessions longues | Variable | Adaptable à l'âge | CM, TD, TP |
| Groupes | Langues, sciences | Effectifs variables, parcours | Options, spécialités | Peu nombreux | Multiples |
| Salles | Spécialisées pour quelques matières | Louées ou partagées | Spécialisées | Classes fixes | Multiples |
| Organisation | Hebdomadaire | Par sessions datées | Hebdomadaire | Journalière | Semestrielle |
| Priorité | Équilibre entre disciplines | Disponibilité des formateurs et coût | Équilibre pédagogique | Rythme des enfants | Compatibilité des ressources |

## Réglages

« — » : la valeur par défaut du catalogue s'applique.

| Paramètre | Collège | École privée et centre de formation | Lycée | Primaire | Université et école d'ingénieurs |
|---|---|---|---|---|---|
| `CAL.ANNEE.SEMAINES_ALTERNEES` | `2` | — | `2` | — | — |
| `ENS.CHARGE.MAX_H_JOUR` | `420` | — | `420` | `360` | — |
| `ENS.PRO.STATUT` | — | `externe` | — | — | — |
| `ETA.ORGA.COURS_SOIR` | — | `true` | — | — | — |
| `ETA.ORGA.COURS_WEEKEND` | — | `true` | — | — | — |
| `FIN.REGLE.MINIMISER_COUT` | — | `true`, poids 5 | — | — | — |
| `GRP.REGLE.EFFECTIFS_BORNES` | — | `true`, poids 10 | — | — | — |
| `GRP.REGLE.OPTIONS_INCOMPATIBLES` | — | — | `0`, poids 80 | — | — |
| `HOR.GRILLE.PAUSE_APRES_MIDI` | — | — | — | `15` | — |
| `HOR.GRILLE.PAUSE_MATIN` | — | — | — | `15` | — |
| `HOR.GRILLE.PAUSE_MIDI` | — | — | — | `90` | — |
| `HOR.GRILLE.TRANSITION_AGE` | — | — | — | `5` | — |
| `HOR.REGLE.COURS_TARDIFS` | — | `21:30`, poids 4 | — | `16:30`, poids 40 | — |
| `HOR.REGLE.MAX_CONSECUTIVES` | `180` | `240` | `240` | `90`, strict | `240` |
| `HOR.REGLE.MAX_H_JOUR_GROUPE` | `420` | — | `480` | `360` | — |
| `HOR.REGLE.REPAS` | strict | — | — | strict | — |
| `HOR.REGLE.TROUS` | poids 30 | poids 3 | poids 15 | strict | — |
| `HOR.REGLE.UN_CAMPUS_PAR_JOUR` | — | — | — | — | poids 10 |
| `HOR.TYPE.FIXE` | — | `flexible` | — | — | — |
| `HUM.BESOIN.MINEURS` | `true` | — | `true` | `true` | — |
| `HUM.REGLE.ENCADREMENT` | `true`, strict | — | `true` | `true`, strict | — |
| `MAT.REGLE.ALIGNEMENT` | `true` | — | `true` | — | — |
| `MAT.VOL.CRENEAUX_PAR_SEANCE` | `1` | — | — | `1` | — |
| `MAT.VOL.DUREE_MAX` | `110` | `240` | `120` | `60` | `210` |
| `MAT.VOL.DUREE_MIN` | `55` | `60` | `55` | `30` | `60` |
| `MAT.VOL.DUREE_REC` | `55` | `180` | `55` | `45` | `90` |
| `OPT.CALCUL.CHOIX_ENSEIGNANT` | — | `true` | — | `true` | — |
| `OPT.CALCUL.CHOIX_GROUPE` | — | `true` | — | — | — |
| `OPT.PORTEE.DECOUPAGE` | — | — | — | — | `globale` |
| `OPT.PORTEE.HORIZON` | `semaine` | `semestre` | `semaine` | `jour` | `semestre` |
| `OPT.PORTEE.MODELE_TEMPS` | `cycle_semaines` | `dates` | `cycle_semaines` | — | `semaine_type` |
| `PED.COGN.ALTERNANCE_DOMAINES` | `true`, poids 10 | — | `true`, poids 5 | — | — |
| `PED.COGN.ALTERNANCE_THEO_PRAT` | — | — | — | `true`, poids 30 | — |
| `PED.COGN.CHARGE_QUOTIDIENNE` | `18`, poids 20 | — | — | `12`, poids 30 | — |
| `PED.COGN.CONCENTRATION` | — | — | — | `true`, poids 40 | — |
| `PED.COGN.DIFFICILES_REPARTIES` | `true`, poids 20 | — | `true`, poids 15 | — | — |
| `PED.COGN.DIFFICILES_SUIVIES` | `true`, poids 20 | — | `true`, poids 15 | — | — |
| `PED.COGN.EVEIL` | — | — | — | `true`, poids 20 | — |
| `PED.COGN.FONDAMENTAUX_MATIN` | — | — | — | `true`, poids 50 | — |
| `PED.COGN.PAUSES_AGE` | — | — | — | `60`, poids 60 | — |
| `PED.ORG.ACCOMPAGNEMENT` | — | — | `60`, poids 5 | — | — |
| `PED.ORG.ENSEIGNANT_REFERENT` | — | — | — | `true`, poids 80 | — |
| `PED.ORG.EXAMENS_NATIONAUX` | — | — | `true`, poids 15 | — | — |
| `PED.ORG.HEURE_VIE_CLASSE` | `55`, poids 5 | — | — | — | — |
| `PED.ORG.LABO` | — | — | — | — | `true`, poids 4 |
| `PED.ORG.MATIERES_PAR_JOUR` | — | — | — | `5`, poids 25 | — |
| `PED.ORG.ROTATION_ENSEIGNANTS` | `5`, poids 5 | — | — | — | — |
| `PED.ORG.SALLE_FIXE` | — | — | — | `true`, poids 60 | — |
| `PED.PERIODE.CARTE` | — | `true` | — | — | — |
| `PED.PERIODE.INTENSIF` | — | `true` | — | — | — |
| `PED.PROG.CM_AVANT_TD` | — | — | — | — | poids 5 |
| `PRF.APP.REPARTITION_MATIERES` | `true`, poids 15 | — | `true`, poids 12 | — | — |
| `PRF.ENS.CRENEAUX_EVITER` | — | — | — | — | poids 3 |
| `PRF.ENS.CRENEAUX_PREFERES` | — | — | — | — | poids 1 |
| `SAL.REGLE.TAILLE_ADAPTEE` | — | — | — | poids 1 | poids 1 |
