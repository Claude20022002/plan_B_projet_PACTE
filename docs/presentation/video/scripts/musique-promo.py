"""Musique de la vidéo PactePromo, composée par calcul (aucune piste sous licence fournie) :
instrumental doux à 100 BPM, 60 s, en quatre parties qui suivent le storyboard.

  0 – 4 s    une note grave et une nappe : le problème
  4 – 11 s   des notes piquées de plus en plus serrées : la tension
  11 – 12 s  silence
  12 – 55 s  la musique principale (nappe, arpège, pulsation légère), qui s'élève à 48 s
  55 – 60 s  l'accord final, fondu de 2 s

Usage (depuis video/) : python scripts/musique-promo.py
"""
import subprocess
from pathlib import Path

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, fftconvolve, lfilter

ICI = Path(__file__).resolve().parent.parent
AUDIO = ICI / "public" / "audio" / "promo"
FFMPEG = ICI / "node_modules" / "@remotion" / "compositor-win32-x64-msvc" / "ffmpeg.exe"
TAUX = 48000
DUREE = 60.0
BPM = 100
TEMPS = 60 / BPM
rng = np.random.default_rng(7)


def hz(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


def t_(duree):
    return np.arange(int(duree * TAUX)) / TAUX


def poser(piste, son, debut, gain=1.0):
    i = int(debut * TAUX)
    if i >= len(piste):
        return
    n = min(len(son), len(piste) - i)
    piste[i:i + n] += son[:n] * gain


def passe_bas(x, f):
    b, a = butter(2, f / (TAUX / 2), "low")
    return lfilter(b, a, x)


def nappe(notes, duree):
    """Accord tenu, chaud : sinus légèrement désaccordés, attaque et extinction lentes."""
    t = t_(duree)
    s = np.zeros_like(t)
    for m in notes:
        for d in (-0.06, 0.06):
            s += np.sin(2 * np.pi * hz(m + d) * t) + 0.25 * np.sin(4 * np.pi * hz(m + d) * t)
    env = np.minimum(1, t / 0.9) * np.minimum(1, (duree - t) / 0.9)
    return passe_bas(s * env, 1800) / len(notes)


def pique(m, duree=0.9):
    """Note piquée (arpège) : sinus et harmoniques, extinction exponentielle."""
    t = t_(duree)
    f = hz(m)
    s = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(4 * np.pi * f * t) + 0.12 * np.sin(6 * np.pi * f * t)
    return s * np.exp(-t * 5.5) * np.minimum(1, t / 0.004)


def grave(m, duree):
    t = t_(duree)
    return np.sin(2 * np.pi * hz(m) * t) * np.exp(-t * 0.6) * np.minimum(1, t / 0.02)


def pulsation():
    """Grosse caisse douce."""
    t = t_(0.35)
    f = 110 * np.exp(-t * 18) + 45
    return np.sin(2 * np.pi * np.cumsum(f) / TAUX) * np.exp(-t * 11)


def souffle():
    """Charleston très doux : bruit filtré, court."""
    t = t_(0.06)
    b, a = butter(2, 7000 / (TAUX / 2), "high")
    return lfilter(b, a, rng.standard_normal(len(t))) * np.exp(-t * 70)


def reverberation(x, duree=1.6, mix=0.22):
    n = int(duree * TAUX)
    ir = rng.standard_normal(n) * np.exp(-np.arange(n) / TAUX * 3.2)
    ir = passe_bas(ir, 3000)
    humide = fftconvolve(x, ir)[: len(x)]
    humide /= np.max(np.abs(humide)) or 1
    return x + mix * humide * np.max(np.abs(x))


# Grille d'accords (une mesure de 4 temps chacun) : Do maj7, La m7, Fa maj7, Sol 6
ACCORDS = [[48, 55, 59, 64], [45, 52, 55, 60], [41, 48, 52, 57], [43, 50, 55, 59]]
ARPEGES = [[60, 64, 67, 71], [57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 67]]
MESURE = 4 * TEMPS

L = np.zeros(int(DUREE * TAUX))
R = np.zeros_like(L)

# 0 – 11 s : le problème, puis la tension
poser(L, grave(36, 4.5), 0.0, 0.5)
poser(R, grave(36, 4.5), 0.0, 0.5)
poser(L, nappe([48, 55, 63], 11.0), 0.0, 0.18)
poser(R, nappe([48, 55, 63], 11.0), 0.0, 0.18)
t, pas = 4.0, 0.6
notes = [72, 75, 79, 74, 77, 80]
k = 0
while t < 10.9:
    son = pique(notes[k % len(notes)], 0.5) * 0.16
    poser(L if k % 2 else R, son, t)
    poser(R if k % 2 else L, son * 0.5, t + 0.01)
    t += pas
    pas = max(0.14, pas * 0.9)
    k += 1

# 12 – 55 s : la musique principale
debut = 12.0
n_mesures = int((55.0 - debut) / MESURE) + 1
for i in range(n_mesures):
    tm = debut + i * MESURE
    if tm >= 55.0:
        break
    a = i % 4
    eleve = tm >= 48.0
    poser(L, nappe(ACCORDS[a], MESURE + 0.4), tm, 0.22)
    poser(R, nappe(ACCORDS[a], MESURE + 0.4), tm, 0.22)
    for j in range(8):
        m = ARPEGES[a][(j * 3) % 4] + (12 if eleve and j % 2 else 0)
        son = pique(m) * (0.13 if not eleve else 0.16)
        poser(L if j % 2 else R, son, tm + j * TEMPS / 2, 1.0)
        poser(R if j % 2 else L, son, tm + j * TEMPS / 2 + 0.012, 0.45)
    if tm >= 18.0:
        for j in (0, 2):
            poser(L, pulsation(), tm + j * TEMPS, 0.32)
            poser(R, pulsation(), tm + j * TEMPS, 0.32)
        for j in range(8):
            poser(L, souffle(), tm + j * TEMPS / 2 + TEMPS / 4, 0.05)
            poser(R, souffle(), tm + j * TEMPS / 2 + TEMPS / 4, 0.04)

# 55 – 60 s : l'accord final
for m in ACCORDS[0] + [72, 76]:
    poser(L, nappe([m], 5.0), 55.0, 0.16)
    poser(R, nappe([m], 5.0), 55.0, 0.16)
poser(L, grave(36, 5.0), 55.0, 0.35)
poser(R, grave(36, 5.0), 55.0, 0.35)

# Silence de 11 à 12 s, fondu d'entrée 1 s, fondu de sortie 2 s
t = t_(DUREE)[: len(L)]
gabarit = np.ones_like(t)
gabarit[(t >= 11.0) & (t < 12.0)] = 0
gabarit *= np.clip(t / 1.0, 0, 1) * np.clip((DUREE - t) / 2.0, 0, 1)
L = reverberation(L) * gabarit
R = reverberation(R) * gabarit
crete = max(np.max(np.abs(L)), np.max(np.abs(R))) or 1
stereo = np.stack([L, R], axis=1) / crete * 0.89

AUDIO.mkdir(parents=True, exist_ok=True)
wavfile.write(AUDIO / "musique.wav", TAUX, (stereo * 32767).astype(np.int16))
subprocess.run([str(FFMPEG), "-loglevel", "error", "-y", "-i", str(AUDIO / "musique.wav"), "-c:a", "libmp3lame", "-b:a", "192k", str(AUDIO / "musique.mp3")], check=True)
print("Musique : public/audio/promo/musique.mp3 (60 s, 100 BPM)")
