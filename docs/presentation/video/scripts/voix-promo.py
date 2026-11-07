"""Voix de la vidéo PactePromo : une voix neuronale par personnage (edge-tts), puis l'enveloppe
de chaque réplique (ouverture de la bouche des avatars, image par image), les sous-titres et la
piste complète public/audio/promo/voix.mp3, calée sur les débuts écrits dans src/promo/script.json.

Usage (depuis video/) : python scripts/voix-promo.py [src/<dossier>/script.json]
Sans argument : PactePromo (src/promo). Avec src/lancement/script.json : la vidéo Lancement, dont
les répliques s'enchaînent (« debut »: "suite", avec « pause » en secondes avant la réplique) et
dont la durée suit la voix (« dureeSecondes »: "auto", plus « finSecondes » après la dernière phrase).
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
SCRIPT = ICI / (sys.argv[1] if len(sys.argv) > 1 else "src/promo/script.json")
SORTIE_JSON = SCRIPT.parent / "voix.json"
AUDIO = ICI / "public" / "audio" / SCRIPT.parent.name
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
        fin_phrase = re.search(r"[.?!:…]$", mot) and len(courant) >= 2
        virgule = mot.endswith(",") and len(courant) >= 4
        if len(courant) >= MOTS_PAR_SOUS_TITRE or fin_phrase or virgule:
            morceaux.append(" ".join(courant))
            courant = []
    if courant:
        if morceaux and len(courant) < 3 and len(morceaux[-1].split()) + len(courant) <= MOTS_PAR_SOUS_TITRE + 2:
            morceaux[-1] += " " + " ".join(courant)
        else:
            morceaux.append(" ".join(courant))
    if len(morceaux) >= 2 and len(morceaux[-1].split()) < 3 and len((morceaux[-2] + " " + morceaux[-1]).split()) <= MOTS_PAR_SOUS_TITRE + 2:
        morceaux[-2:] = [morceaux[-2] + " " + morceaux[-1]]
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
    # 1. Synthèse de chaque réplique, et son début (écrit, ou à la suite de la précédente)
    clips, fin_precedente = [], 0.0
    for r in script["repliques"]:
        v = script["voix"][r["qui"]]
        mp3, wav = AUDIO / f"{r['id']}.mp3", AUDIO / f"{r['id']}.wav"
        mots = await synthetiser(r["dit"], v["voix"], v["debit"], mp3)
        ffmpeg("-i", str(mp3), "-ac", "1", "-ar", str(TAUX), str(wav))
        son = lire_wav(wav)
        parle_de, parle_a = (mots[0][0], mots[-1][1]) if mots else (0, len(son) / TAUX)
        if r["debut"] == "suite":
            debut_r = max(0.0, fin_precedente + r.get("pause", 0.25) - parle_de)
        else:
            debut_r = float(r["debut"])
            if debut_r + parle_de < fin_precedente:
                print(f"  ATTENTION {r['id']} commence à {debut_r} s, la réplique précédente finit à {fin_precedente:.2f} s")
        fin_precedente = debut_r + parle_a
        clips.append((r, v, son, debut_r, parle_de, parle_a))

    if duree == "auto":
        duree = round(fin_precedente + script.get("finSecondes", 3.0), 1)
    piste = np.zeros(int(duree * TAUX), dtype=np.float32)

    # 2. Piste complète, bouches et sous-titres
    rendu = []
    for r, v, son, debut_r, parle_de, parle_a in clips:
        if debut_r + len(son) / TAUX > duree:
            print(f"  ATTENTION {r['id']} dépasse la fin de la vidéo ({debut_r + len(son) / TAUX:.2f} s)")
        i = int(debut_r * TAUX)
        piste[i:i + len(son)] += son[: max(0, len(piste) - i)]
        rendu.append({
            "id": r["id"],
            "qui": r["qui"],
            "nom": v["nom"],
            "scene": r.get("scene"),
            "debut": round(debut_r * fps),
            "duree": int(np.ceil(len(son) / TAUX * fps)),
            "parleDe": round((debut_r + parle_de) * fps),
            "parleA": round((debut_r + parle_a) * fps),
            "bouche": enveloppe(son, fps),
            "sousTitres": sous_titres(r["texte"], debut_r + parle_de, debut_r + parle_a, fps),
        })
        print(f"  {r['id']} {r['qui']:<9} {debut_r:5.1f} s → {debut_r + parle_a:5.2f} s  « {r['texte']} »")

    crete = np.max(np.abs(piste)) or 1
    piste = piste / crete * 0.89
    wavfile.write(AUDIO / "voix.wav", TAUX, (piste * 32767).astype(np.int16))
    ffmpeg("-i", str(AUDIO / "voix.wav"), "-c:a", "libmp3lame", "-b:a", "192k", str(AUDIO / "voix.mp3"))
    SORTIE_JSON.write_text(json.dumps({"fps": fps, "dureeImages": round(duree * fps), "repliques": rendu}, ensure_ascii=False), encoding="utf-8")
    mots = sum(len(r["dit"].split()) for r in script["repliques"])
    print(f"Voix : {len(rendu)} répliques, {mots} mots, {duree} s, {AUDIO.relative_to(ICI)}/voix.mp3 et {SORTIE_JSON.relative_to(ICI)}")


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
