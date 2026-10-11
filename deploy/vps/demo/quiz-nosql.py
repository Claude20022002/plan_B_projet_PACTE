# Démonstration (demo-enseignant.mjs) : crée, ou met à jour, le quiz « Bases de données NoSQL :
# les fondamentaux » dans le compte ClassQuiz d'un enseignant, pour le donner en devoir ou le
# jouer en direct pendant une séance. L'enseignant doit s'être connecté une fois à
# quiz.finadmintech.fr avec son compte HESTIM (le compte ClassQuiz naît à ce moment).
# 8 questions : QCM (réponses mélangées par téléphone en mode « normal »), cases à cocher, ordre,
# curseur et réponse libre.
# Exécution (dans /opt/hestim) :
#   docker compose --env-file .env.docker -f docker-compose.yml -f deploy/vps/docker-compose.vps.yml \
#     exec -T -e ENSEIGNANT_EMAIL=haidrar.demo@hestim.ma quiz-api python - < deploy/vps/demo/quiz-nosql.py
import asyncio
import os
import uuid
from datetime import datetime

from classquiz.db import database
from classquiz.db.models import Quiz, QuizQuestion, User

TITRE = "Bases de données NoSQL : les fondamentaux"


def qcm(question, bonne, *fausses, temps="25"):
    reponses = [{"answer": bonne, "right": True}] + [{"answer": f, "right": False} for f in fausses]
    return {"question": question, "time": temps, "type": "ABCD", "answers": reponses}


QUESTIONS = [
    qcm(
        "Selon le théorème CAP, un système distribué ne peut garantir à la fois que deux propriétés parmi…",
        "Cohérence, disponibilité, tolérance au partitionnement",
        "Cohérence, atomicité, persistance",
        "Capacité, disponibilité, performance",
        "Concurrence, atomicité, partitionnement",
    ),
    qcm("Quel type de base NoSQL est MongoDB ?", "Orientée documents", "Clé-valeur", "Orientée colonnes", "Orientée graphes"),
    {
        "question": "Lesquelles sont des bases orientées graphes ?",
        "time": "25",
        "type": "CHECK",
        "answers": [
            {"answer": "Neo4j", "right": True},
            {"answer": "Amazon Neptune", "right": True},
            {"answer": "Redis", "right": False},
            {"answer": "Cassandra", "right": False},
        ],
    },
    qcm(
        "Que signifie BASE, l'alternative NoSQL à ACID ?",
        "Basically Available, Soft state, Eventually consistent",
        "Binary Atomic Storage Engine",
        "Balanced And Scalable Execution",
        "Basic Access, Secure Encryption",
    ),
    qcm(
        "Dans MongoDB, quelle commande renvoie les étudiants de 4e année ?",
        'db.etudiants.find({ niveau: "4A" })',
        'db.etudiants.select({ niveau: "4A" })',
        'SELECT * FROM etudiants WHERE niveau = "4A"',
        'db.etudiants.get("4A")',
        temps="30",
    ),
    {
        "question": "Rangez ces étapes d'un pipeline d'agrégation MongoDB dans l'ordre habituel",
        "time": "35",
        "type": "ORDER",
        "answers": [{"answer": "$match"}, {"answer": "$group"}, {"answer": "$sort"}, {"answer": "$limit"}],
    },
    {
        "question": "Facteur de réplication courant (en nombre de copies) dans un cluster Cassandra de production",
        "time": "25",
        "type": "RANGE",
        "answers": {"min": 1, "max": 10, "min_correct": 3, "max_correct": 3},
    },
    {
        "question": "Quelle base clé-valeur en mémoire sert souvent de cache devant une base principale ?",
        "time": "25",
        "type": "TEXT",
        "answers": [{"answer": "Redis", "case_sensitive": False}],
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
                description="Démonstration : CAP, familles NoSQL, MongoDB, Cassandra et Redis.",
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
