"""Musique de la vidéo Lancement, composée par calcul : 120 BPM, plus vive que celle de PactePromo.
Elle lit src/lancement/voix.json pour la durée et le début des scènes :

  accroche, éparpillé   pulsation légère et notes piquées, la tension monte
  avant la révélation   silence (la pause de la voix), puis impact grave
  révélation → relié    groove complet : basse, grosse caisse, claquement, arpège, nappe
  chiffres              montée
  fin                   accord final, fondu de 2 s

Usage (depuis video/) : python scripts/musique-lancement.py
"""
import json
import subprocess
from pathlib import Path

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, fftconvolve, lfilter

ICI = Path(__file__).resolve().parent.parent
VOIX = json.loads((ICI / "src" / "lancement" / "voix.json").read_text(encoding="utf-8"))
AUDIO = ICI / "public" / "audio" / "lancement"
FFMPEG = ICI / "node_modules" / "@remotion" / "compositor-win32-x64-msvc" / "ffmpeg.exe"
TAUX = 48000
FPS = VOIX["fps"]
DUREE = VOIX["dureeImages"] / FPS
TEMPS = 0.5  # 120 BPM
rng = np.random.default_rng(11)

debuts = {}
for r in VOIX["repliques"]:
    debuts.setdefault(r["scene"], r["debut"] / FPS)
debuts["accroche"] = 0.0
fin_eparpille = max(r["parleA"] for r in VOIX["repliques"] if r["scene"] == "eparpille") / FPS
REVELATION, CHIFFRES, FIN = debuts["revelation"], debuts["chiffres"], debuts["fin"]


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def t_(d):
    return np.arange(int(d * TAUX)) / TAUX


def bas(x, f):
    b, a = butter(2, f / (TAUX / 2), "low")
    return lfilter(b, a, x)


def haut(x, f):
    b, a = butter(2, f / (TAUX / 2), "high")
    return lfilter(b, a, x)


def poser(piste, son, debut, gain=1.0):
    i = int(debut * TAUX)
    if i >= len(piste) or i < 0:
        return
    n = min(len(son), len(piste) - i)
    piste[i:i + n] += son[:n] * gain


def nappe(notes, d):
    t = t_(d)
    s = sum(np.sin(2 * np.pi * hz(m + e) * t) for m in notes for e in (-0.07, 0.07))
    return bas(s * np.minimum(1, t / 0.4) * np.minimum(1, (d - t) / 0.4), 2200) / len(notes)


def pique(m, d=0.35):
    t = t_(d)
    f = hz(m)
    return (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t)) * np.exp(-t * 9) * np.minimum(1, t / 0.003)


def basse(m, d):
    t = t_(d)
    s = np.sin(2 * np.pi * hz(m) * t) + 0.4 * np.sin(4 * np.pi * hz(m) * t)
    return bas(s, 400) * np.exp(-t * 3) * np.minimum(1, t / 0.005)


def caisse():
    t = t_(0.4)
    f = 120 * np.exp(-t * 22) + 42
    return np.sin(2 * np.pi * np.cumsum(f) / TAUX) * np.exp(-t * 9)


def claque():
    t = t_(0.18)
    return haut(rng.standard_normal(len(t)), 1500) * np.exp(-t * 28) * 0.6


def charley():
    t = t_(0.05)
    return haut(rng.standard_normal(len(t)), 8000) * np.exp(-t * 90)


def impact():
    t = t_(2.2)
    f = 70 * np.exp(-t * 3) + 30
    return np.sin(2 * np.pi * np.cumsum(f) / TAUX) * np.exp(-t * 1.8) + bas(rng.standard_normal(len(t)), 900) * np.exp(-t * 6) * 0.4


def montee(d):
    t = t_(d)
    return haut(rng.standard_normal(len(t)), 2500) * (t / d) ** 2 * 0.5


ACCORDS = [[45, 52, 57, 60], [41, 48, 53, 57], [48, 55, 60, 64], [43, 50, 55, 59]]  # la m, fa, do, sol
BASSES = [33, 29, 36, 31]
MESURE = 4 * TEMPS

L = np.zeros(int(DUREE * TAUX) + TAUX)
R = np.zeros_like(L)


def deux(son, debut, gain, pan=0.0):
    poser(L, son, debut, gain * (1 - pan) if pan > 0 else gain)
    poser(R, son, debut, gain * (1 + pan) if pan < 0 else gain)


# Accroche et éparpillé : pulsation, notes piquées qui se resserrent
t = 0.0
while t < REVELATION - 1.0:
    deux(caisse(), t, 0.22)
    t += TEMPS * 2
t, k = 0.25, 0
while t < fin_eparpille:
    pas = TEMPS if t < debuts["eparpille"] else TEMPS / 2
    deux(pique([69, 72, 76, 74][k % 4]), t, 0.12, 0.4 if k % 2 else -0.4)
    t += pas
    k += 1
deux(nappe([45, 52, 60], fin_eparpille), 0.0, 0.25)
deux(montee(1.6), fin_eparpille - 1.6, 0.5)

# Révélation : impact, puis le groove jusqu'aux chiffres
deux(impact(), REVELATION, 0.9)
n = int((FIN - REVELATION) / MESURE) + 1
for i in range(n):
    tm = REVELATION + i * MESURE
    if tm >= FIN:
        break
    a = i % 4
    plein = i >= 1
    deux(nappe(ACCORDS[a], MESURE + 0.3), tm, 0.3)
    for j in range(4):
        deux(basse(BASSES[a], TEMPS * 0.9), tm + j * TEMPS, 0.55 if plein else 0.3)
        if plein:
            deux(caisse(), tm + j * TEMPS, 0.45)
        if plein and j in (1, 3):
            deux(claque(), tm + j * TEMPS, 0.35)
    for j in range(8):
        if plein:
            deux(charley(), tm + j * TEMPS / 2 + TEMPS / 4, 0.12, 0.3)
        m = ACCORDS[a][(j * 3) % 4] + 24 + (12 if tm >= CHIFFRES and j % 2 else 0)
        deux(pique(m, 0.3), tm + j * TEMPS / 2, 0.1, -0.3 if j % 2 else 0.3)
deux(montee(2.0), FIN - 2.0, 0.6)

# Fin : impact doux, accord tenu
deux(impact(), FIN, 0.5)
for m in ACCORDS[2] + [72, 76]:
    deux(nappe([m], DUREE - FIN + 0.5), FIN, 0.22)

# Réverbération, fondus, normalisation
ir = bas(rng.standard_normal(int(1.2 * TAUX)) * np.exp(-np.arange(int(1.2 * TAUX)) / TAUX * 4), 3500)
for P in (L, R):
    humide = fftconvolve(P, ir)[: len(P)]
    P += 0.18 * humide / (np.max(np.abs(humide)) or 1) * np.max(np.abs(P))
t = np.arange(len(L)) / TAUX
gabarit = np.clip(t / 0.3, 0, 1) * np.clip((DUREE - t) / 2.0, 0, 1)
gabarit[(t >= fin_eparpille + 0.05) & (t < REVELATION)] *= 0.0
stereo = np.stack([L * gabarit, R * gabarit], axis=1)[: int(DUREE * TAUX)]
stereo = stereo / (np.max(np.abs(stereo)) or 1) * 0.89

AUDIO.mkdir(parents=True, exist_ok=True)
wavfile.write(AUDIO / "musique.wav", TAUX, (stereo * 32767).astype(np.int16))
subprocess.run([str(FFMPEG), "-loglevel", "error", "-y", "-i", str(AUDIO / "musique.wav"), "-c:a", "libmp3lame", "-b:a", "192k", str(AUDIO / "musique.mp3")], check=True)
print(f"Musique : public/audio/lancement/musique.mp3 ({DUREE:.1f} s, révélation à {REVELATION:.1f} s)")
