## Fonction

<!-- Identifiant et nom, avec le lien vers le module, ex. : MOT-03 · Validation avant le calcul (docs/plan/modules/MOT-moteur.md) -->

**Plan de conception validé** : <!-- lien vers docs/conception/…, ou « plan court » pour un correctif --> 
**Fiche de session** : <!-- lien vers docs/sessions/… -->

## Ce qui change

<!-- En quelques lignes : ce que l'utilisateur ou l'exploitant voit de différent. -->

## Comment c'est vérifié

<!-- Tests ajoutés ou modifiés ; ce qui a été lancé en local ; ce que la CI tranche (parcours). -->

## Liste « terminé » (docs/plan/README.md, § 4)

- [ ] La CI est verte (site, serveur, mobile, solveur, parcours)
- [ ] Le critère de « terminé » de la fonction est atteint et vérifié
- [ ] Un test de régression fige chaque correctif
- [ ] Les exigences produit (EP) concernées sont tenues
- [ ] La migration, s'il y en a une, a son numéro réservé dans `docs/plan/suivi.md`
- [ ] Le module et `docs/plan/suivi.md` sont à jour (état, PR) ; la conception aussi si elle a changé
- [ ] Rien de réel dans le dépôt : ni donnée personnelle, ni secret, ni nom d'école en dur

## Règles de l'équipe (AGENTS.md)

- [ ] La fonction appartient à un chantier ouvert de `docs/plan/suivi.md` (ou c'est un correctif urgent accepté par le chef)
- [ ] La branche porte une seule tâche et suit le nommage `<type>/<identifiant>-<mot>`
- [ ] Le plan de conception a été validé par le chef de projet avant le premier commit de code
- [ ] Chaque session a sa fiche dans `docs/sessions/`, avec son prompt de reprise
