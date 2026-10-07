// Renomme les enseignants d'une base déjà remplie par le seed avec les noms marocains de
// backend/seed.js (listes NOMS_ENS et PRENOMS_ENS recopiées ci-dessous, mêmes rangs).
// Seuls les comptes du seed sont touchés : rôle enseignant et e-mail « prenom.nom<rang>@hestim.ma ».
// Le rang conservé dans l'e-mail donne le nouveau nom ; l'e-mail suit (adil.benkirane0@hestim.ma…).
// StudyLib et ClassQuiz retrouvent l'utilisateur par son identifiant Planner : rien à faire chez eux.
// Les mots de passe ne changent pas. Sans risque à relancer.
// Exécution : docker compose exec -T backend node --input-type=module - < deploy/vps/noms-marocains.mjs
import sequelize from "/app/config/db.js";
import { Users } from "/app/models/index.js";

const NOMS_ENS = [
    "BENKIRANE", "OUAZZANI", "SQUALLI", "LAZRAK", "BOUHLAL", "TOUIMI", "ZNIBER", "GUESSOUS", "SLAOUI", "BELKHAYAT",
    "SENHAJI", "BENNIS", "TOUZANI", "JAZOULI", "RAMI", "ZIANI", "OUAHBI", "BENABDALLAH", "ELOUAFI", "LAMRANI",
    "BOUZOUBAA", "CHAMI", "HAKIMI", "NAJI", "ELMALKI", "BENSOUDA", "RIFFI", "SAADI", "KADIRI", "OUARDI",
    "GHAZI", "MANSOURI", "BENCHEKROUN", "ELKHATIB", "AZZOUZI", "BOUAZZA", "BENMOUSSA", "TALBI", "BELMAHI", "HAMDOUCHI",
    "ESSAIDI", "BOUCHTA", "MOUFID", "ELYOUSFI", "BENHIMA", "SOUSSI", "RHAZI", "JABRI", "AMMOR", "BELGHITI",
    "ELGHAZOUANI", "BOUJEMAA", "ZEROUALI", "CHAOUI", "ELHARTI", "TAOUFIK", "MESBAHI", "RAISSOUNI", "ELOMARI", "BENZAKOUR",
    "ALLOUCH", "HADDAOUI", "NEJJARI", "BOUSSETTA", "KHATTABI", "OUMLIL", "SABRI", "MAAROUFI", "DAOUDI", "ZAKI",
    "BENNOUNA", "ERRAJI", "MOKHTARI", "HILALI", "BENAISSA", "SBAI", "MOUNIR", "CHAFIK", "LAHRICHI", "ELBAZ",
    "BOUABID", "GUERRAOUI", "ZAIDI", "RAHMOUNI", "OUAKRIM", "AFILAL", "BELAHCEN", "SKALLI", "DOUKKALI", "MEZIANE",
];
const PRENOMS_ENS = [
    "Adil", "Nadia", "Samira", "Houda", "Mohamed", "Fatima", "Mehdi", "Leila", "Younes", "Omar",
    "Rachida", "Abdelkader", "Khadija", "Hicham", "Naima", "Mustapha", "Latifa", "Driss", "Souad", "Abdellah",
    "Btissam", "Said", "Malika", "Jamal", "Wafae", "Hassan", "Siham", "Noureddine", "Karima", "Abdelaziz",
];

// Même règle que slug() dans backend/seed.js
const slug = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, "");
const EMAIL_SEED = /^[a-z-]+\.[a-z-]+(\d+)@hestim\.ma$/;

const enseignants = await Users.findAll({ where: { role: "enseignant" } });
let renommes = 0;
await sequelize.transaction(async (transaction) => {
    for (const user of enseignants) {
        const rang = user.email.match(EMAIL_SEED)?.[1];
        if (rang === undefined) continue;
        const i = Number(rang);
        const nom = NOMS_ENS[i % NOMS_ENS.length];
        const prenom = PRENOMS_ENS[i % PRENOMS_ENS.length];
        const email = `${slug(prenom)}.${slug(nom)}${i}@hestim.ma`;
        if (user.nom === nom && user.prenom === prenom && user.email === email) continue;
        await user.update({ nom, prenom, email }, { transaction });
        renommes += 1;
    }
});

process.stdout.write(`${renommes} enseignant(s) renommé(s) sur ${enseignants.length}.\n`);
await sequelize.close();
