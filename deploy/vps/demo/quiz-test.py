# Recette du quiz en direct (lot anti-triche 3) : crée, ou met à jour, le quiz « Test HESTIM :
# culture numérique » dans le compte ClassQuiz d'un enseignant. L'enseignant doit s'être connecté
# une fois à quiz.finadmintech.fr avec son compte HESTIM (le compte ClassQuiz naît à ce moment).
# 7 questions de tous les types utiles au test : QCM (réponses mélangées par téléphone en mode
# « normal »), cases à cocher, ordre, curseur et réponse libre (nuage de mots dans Planner).
# Exécution (dans /opt/hestim) :
#   docker compose --env-file .env.docker -f docker-compose.yml -f deploy/vps/docker-compose.vps.yml \
#     exec -T -e ENSEIGNANT_EMAIL=prenom.nom@hestim.ma quiz-api python - < deploy/vps/demo/quiz-test.py
import asyncio
import os
import uuid
from datetime import datetime

from classquiz.db import database
from classquiz.db.models import Quiz, QuizQuestion, User

TITRE = "Test HESTIM : culture numérique"


def qcm(question, bonne, *fausses, temps="20"):
    reponses = [{"answer": bonne, "right": True}] + [{"answer": f, "right": False} for f in fausses]
    return {"question": question, "time": temps, "type": "ABCD", "answers": reponses}


QUESTIONS = [
    qcm("Que signifie HTTP ?", "HyperText Transfer Protocol", "High Transfer Text Protocol", "Hyper Terminal Transport Program", "Home Tool Transfer Protocol"),
    qcm("Quel tri a une complexité moyenne en O(n log n) ?", "Le tri rapide", "Le tri à bulles", "Le tri par sélection", "Le tri par insertion"),
    {
        "question": "Lesquels sont des langages de programmation ?",
        "time": "25",
        "type": "CHECK",
        "answers": [
            {"answer": "Python", "right": True},
            {"answer": "HTML", "right": False},
            {"answer": "C", "right": True},
            {"answer": "CSS", "right": False},
        ],
    },
    qcm(
        "En apprentissage automatique, qu'est-ce que le surapprentissage ?",
        "Un modèle trop collé aux données d'entraînement",
        "Un modèle trop simple",
        "Un manque de données",
        "Un entraînement trop rapide",
        temps="25",
    ),
    {
        "question": "Rangez du plus petit au plus grand",
        "time": "30",
        "type": "ORDER",
        "answers": [{"answer": "Octet"}, {"answer": "Kilooctet"}, {"answer": "Mégaoctet"}, {"answer": "Gigaoctet"}],
    },
    {
        "question": "En quelle année le Web a-t-il été inventé ?",
        "time": "25",
        "type": "RANGE",
        "answers": {"min": 1980, "max": 2000, "min_correct": 1989, "max_correct": 1990},
    },
    {
        "question": "Quel langage sert à interroger une base de données relationnelle ?",
        "time": "25",
        "type": "TEXT",
        "answers": [{"answer": "SQL", "case_sensitive": False}],
    },
]


async def main():
    email = os.environ.get("ENSEIGNANT_EMAIL", "").strip()
    if not email:
        raise SystemExit("ENSEIGNANT_EMAIL manquant")
    await database.connect()
    try:
        user = await User.objects.get_or_none(email=email)
        if user is None:
            raise SystemExit(f"Aucun compte ClassQuiz pour {email} : se connecter une fois à quiz.finadmintech.fr avec le compte HESTIM")
        questions = [QuizQuestion(**q) for q in QUESTIONS]
        existant = await Quiz.objects.get_or_none(user_id=user.id, title=TITRE)
        if existant:
            existant.questions = questions
            existant.updated_at = datetime.now()
            await existant.update()
            print(f"Quiz mis à jour : {TITRE} ({len(questions)} questions), id {existant.id}")
        else:
            # Identifiant et dates explicites : les valeurs par défaut du modèle sont figées au démarrage
            quiz = Quiz(
                id=uuid.uuid4(),
                public=False,
                title=TITRE,
                description="Quiz de recette : réponses mélangées par téléphone et journal des sorties.",
                questions=questions,
                user_id=user.id,
                created_at=datetime.now(),
                updated_at=datetime.now(),
            )
            await quiz.save()
            print(f"Quiz créé : {TITRE} ({len(questions)} questions), id {quiz.id}")
    finally:
        await database.disconnect()


asyncio.run(main())
