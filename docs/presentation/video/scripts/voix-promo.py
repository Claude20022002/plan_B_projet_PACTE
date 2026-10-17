"""Voix de la vidéo PactePromo : une voix neuronale par personnage (edge-tts), puis l'enveloppe
de chaque réplique (ouverture de la bouche des avatars, image par image), les sous-titres et la
piste complète public/audio/promo/voix.mp3, calée sur les débuts écrits dans src/promo/script.json.

Usage (depuis video/) : python scripts/voix-promo.py
Le texte du script part chez Microsoft pour la synthèse : n'y mettre aucune donnée personnelle.
"""
import asyncio
import json
import re
import subprocess
import sys
from pathlib import Path

import edge_tts
import numpy as np
from scipy.io import wavfile

ICI = Path(__file__).resolve().parent.parent
SCRIPT = ICI / "src" / "promo" / "script.json"
SORTIE_JSON = ICI / "src" / "promo" / "voix.json"
AUDIO = ICI / "public" / "audio" / "promo"
FFMPEG = ICI / "node_modules" / "@remotion" / "compositor-win32-x64-msvc" / "ffmpeg.exe"
TAUX = 48000
MOTS_PAR_SOUS_TITRE = 7


def ffmpeg(*args):
    subprocess.run([str(FFMPEG), "-loglevel", "error", "-y", *args], check=True)


async def synthetiser(texte, voix, debit, mp3):
    """Écrit le MP3 et rend les mots prononcés avec leur début et leur fin, en secondes."""
    com = edge_tts.Communicate(texte, voix, rate=debit, boundary="WordBoundary")
    mots = []
    with open(mp3, "wb") as f:
        async for morceau in com.stream():
            if morceau["type"] == "audio":
                f.write(morceau["data"])
            elif morceau["type"] == "WordBoundary":
                debut = morceau["offset"] / 1e7
                mots.append((debut, debut + morceau["duration"] / 1e7))
    return mots


def lire_wav(chemin):
    taux, donnees = wavfile.read(chemin)
    donnees = donnees.astype(np.float32) / 32768.0
    return donnees if donnees.ndim == 1 else donnees.mean(axis=1)


def enveloppe(son, fps):
    """Ouverture de la bouche (0 à 1) pour chaque image : RMS lissé, normalisé sur la réplique."""
    pas = TAUX // fps
    n = int(np.ceil(len(son) / pas))
    rms = np.array([np.sqrt(np.mean(son[i * pas:(i + 1) * pas] ** 2) + 1e-12) for i in range(n)])
    rms = np.convolve(rms, np.ones(2) / 2, mode="same")
    haut = np.percentile(rms, 95) or 1
    ouverture = np.clip((rms / haut - 0.08) / 0.92, 0, 1)
    return [round(float(v), 2) for v in ouverture]


def sous_titres(texte, debut, fin, fps):
    """Coupe le texte affiché en morceaux de 7 mots au plus, aux signes de ponctuation d'abord,
    et répartit la durée parlée au prorata des caractères."""
    mots = texte.split()
    morceaux, courant = [], []
    for mot in mots:
        courant.append(mot)
        if len(courant) >= MOTS_PAR_SOUS_TITRE or (re.search(r"[.?!:…]$", mot) and len(courant) >= 3):
            morceaux.append(" ".join(courant))
            courant = []
    if courant:
        if morceaux and len(courant) < 3 and len(morceaux[-1].split()) + len(courant) <= MOTS_PAR_SOUS_TITRE + 2:
            morceaux[-1] += " " + " ".join(courant)
        else:
            morceaux.append(" ".join(courant))
    total = sum(len(m) for m in morceaux)
    t, rendu = debut, []
    for m in morceaux:
        d = (fin - debut) * len(m) / total
        rendu.append({"texte": m, "de": round(t * fps), "a": round((t + d) * fps)})
        t += d
    return rendu


async def main():
    script = json.loads(SCRIPT.read_text(encoding="utf-8"))
    fps, duree = script["fps"], script["dureeSecondes"]
    AUDIO.mkdir(parents=True, exist_ok=True)
    piste = np.zeros(int(duree * TAUX), dtype=np.float32)
    rendu, fin_precedente = [], 0.0

    for r in script["repliques"]:
        v = script["voix"][r["qui"]]
        mp3, wav = AUDIO / f"{r['id']}.mp3", AUDIO / f"{r['id']}.wav"
        mots = await synthetiser(r["dit"], v["voix"], v["debit"], mp3)
        ffmpeg("-i", str(mp3), "-ac", "1", "-ar", str(TAUX), str(wav))
        son = lire_wav(wav)
        duree_r = len(son) / TAUX
        parle_de, parle_a = (mots[0][0], mots[-1][1]) if mots else (0, duree_r)

        if r["debut"] < fin_precedente:
            print(f"  ATTENTION {r['id']} commence à {r['debut']} s, la réplique précédente finit à {fin_precedente:.2f} s")
        if r["debut"] + duree_r > duree:
            print(f"  ATTENTION {r['id']} dépasse la fin de la vidéo ({r['debut'] + duree_r:.2f} s)")
        fin_precedente = r["debut"] + parle_a

        i = int(r["debut"] * TAUX)
        piste[i:i + len(son)] += son[: max(0, len(piste) - i)]

        rendu.append({
            "id": r["id"],
            "qui": r["qui"],
            "nom": v["nom"],
            "debut": round(r["debut"] * fps),
            "duree": int(np.ceil(duree_r * fps)),
            "parleDe": round((r["debut"] + parle_de) * fps),
            "parleA": round((r["debut"] + parle_a) * fps),
            "bouche": enveloppe(son, fps),
            "sousTitres": sous_titres(r["texte"], r["debut"] + parle_de, r["debut"] + parle_a, fps),
        })
        print(f"  {r['id']} {r['qui']:<9} {r['debut']:5.1f} s → {r['debut'] + parle_a:5.2f} s  « {r['texte']} »")

    crete = np.max(np.abs(piste)) or 1
    piste = piste / crete * 0.89
    wavfile.write(AUDIO / "voix.wav", TAUX, (piste * 32767).astype(np.int16))
    ffmpeg("-i", str(AUDIO / "voix.wav"), "-c:a", "libmp3lame", "-b:a", "192k", str(AUDIO / "voix.mp3"))
    SORTIE_JSON.write_text(json.dumps({"fps": fps, "repliques": rendu}, ensure_ascii=False), encoding="utf-8")
    mots = sum(len(r["dit"].split()) for r in script["repliques"])
    print(f"Voix : {len(rendu)} répliques, {mots} mots, public/audio/promo/voix.mp3 et src/promo/voix.json")


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
