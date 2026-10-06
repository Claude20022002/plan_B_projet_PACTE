"""
Bande-son originale de la vidéo HESTIM Planner, synthétisée ici (aucun échantillon externe,
donc aucun problème de licence). 120 BPM : un temps = 0,5 s, une mesure = 2 s.

Musique calée sur le storyboard (src/Root.tsx) :
- intro douce ;
- pulsation tendue sur les outils éparpillés ;
- montée jusqu'au « drop » au début de l'agenda ;
- boucle C – G – Am – F ;
- allègement sur les chiffres ;
- accord final tenu.

Bruitages sur les animations : cascade de 12 notes pour les triangles du logo, cliquetis des
volets, « zips » quand les outils sont barrés, souffle de convergence, toucher, carillon de
notification, impacts.

Usage : python scripts/composer-musique.py   → public/audio/hestim-planner.wav et hestim-planner-9x16.wav
"""
import os
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, fftconvolve, lfilter

SR = 44100
RNG = np.random.default_rng(2026)
ICI = os.path.dirname(os.path.abspath(__file__))
SORTIE = os.path.join(ICI, "..", "public", "audio")


def hz(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


def t_(duree):
    return np.arange(int(duree * SR)) / SR


def filtre(sig, kind, f, ordre=2):
    if isinstance(f, (list, tuple)):
        b, a = butter(ordre, [x / (SR / 2) for x in f], btype=kind)
    else:
        b, a = butter(ordre, f / (SR / 2), btype=kind)
    return lfilter(b, a, sig)


def scie(f, duree, harmoniques=24):
    t = t_(duree)
    k_max = max(1, min(harmoniques, int((SR / 2) / f)))
    return sum(np.sin(2 * np.pi * k * f * t) / k for k in range(1, k_max + 1)) * (2 / np.pi)


def enveloppe(n, attaque, chute):
    t = np.arange(n) / SR
    env = np.minimum(1, t / max(attaque, 1e-4))
    return env * np.exp(-np.maximum(0, t - attaque) / max(chute, 1e-4))


class Piste:
    def __init__(self, duree):
        self.n = int(duree * SR)
        self.g = np.zeros(self.n)
        self.d = np.zeros(self.n)

    def ajouter(self, debut, sig, gain=1.0, pan=0.0):
        i = int(debut * SR)
        if i >= self.n:
            return
        sig = sig[: self.n - i] * gain
        self.g[i : i + len(sig)] += sig * np.sqrt((1 - pan) / 2)
        self.d[i : i + len(sig)] += sig * np.sqrt((1 + pan) / 2)

    def stereo(self):
        return np.stack([self.g, self.d], axis=1)


# ── Instruments ──────────────────────────────────────────────────────────────────────────
def nappe(notes, duree):
    """Accord tenu : trois scies légèrement désaccordées par note, adoucies."""
    sig = sum(scie(hz(m) * 2 ** (c / 1200), duree, 12) for m in notes for c in (-7, 0, 7))
    sig = filtre(sig, "low", 1500)
    n = len(sig)
    env = np.minimum(1, np.arange(n) / (0.35 * SR)) * np.minimum(1, (n - np.arange(n)) / (0.4 * SR))
    return sig * env / (len(notes) * 3)


def pince(midi, duree=0.5, chute=0.22):
    t = t_(duree)
    f = hz(midi)
    sig = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * 2 * f * t) + 0.15 * np.sin(2 * np.pi * 3 * f * t)
    return sig * enveloppe(len(t), 0.003, chute)


def basse(midi, duree=0.25):
    t = t_(duree)
    sig = filtre(scie(hz(midi), duree, 8), "low", 420) + 0.6 * np.sin(2 * np.pi * hz(midi) * t)
    return sig * enveloppe(len(t), 0.004, 0.16)


def grosse_caisse(profond=False):
    duree = 0.5
    t = t_(duree)
    f0, f1 = (110, 32) if profond else (150, 46)
    freq = f1 + (f0 - f1) * np.exp(-t / 0.045)
    sig = np.sin(2 * np.pi * np.cumsum(freq) / SR) * np.exp(-t / (0.32 if profond else 0.22))
    clic = RNG.standard_normal(len(t)) * np.exp(-t / 0.003) * 0.3
    return sig + clic


def claquement():
    t = t_(0.25)
    bruit = filtre(RNG.standard_normal(len(t)), "band", [900, 3200])
    env = np.zeros(len(t))
    for k in range(3):
        i = int(k * 0.011 * SR)
        env[i:] += np.exp(-(np.arange(len(t) - i)) / SR / (0.012 if k < 2 else 0.11))
    return bruit * env * 0.6


def charleston(ouvert=False):
    t = t_(0.2)
    return filtre(RNG.standard_normal(len(t)), "high", 7000) * np.exp(-t / (0.09 if ouvert else 0.03)) * 0.5


def volet():
    """Cliquetis d'une tuile qui bascule : petit claquement sec et brillant."""
    t = t_(0.03)
    sig = filtre(RNG.standard_normal(len(t)), "band", [1800, 6000]) * np.exp(-t / 0.004)
    sig += np.sin(2 * np.pi * 2400 * t) * np.exp(-t / 0.002) * 0.4
    return sig


def souffle(duree=0.9, haut=False):
    """Souffle filtré qui gonfle puis retombe (convergence, entrée d'un écran)."""
    t = t_(duree)
    bruit = RNG.standard_normal(len(t))
    bas = filtre(bruit, "band", [300, 1500]) * np.sin(np.pi * np.clip(t / duree * 1.6, 0, 1)) ** 2
    hautf = filtre(bruit, "band", [1500, 6000] if not haut else [2500, 9000]) * np.sin(np.pi * np.clip((t / duree - 0.25) * 1.6, 0, 1)) ** 2
    return (bas * 0.7 + hautf * 0.5) * 0.6


def montee(duree=2.0):
    t = t_(duree)
    freq = 180 * (1200 / 180) ** (t / duree)
    sine = np.sin(2 * np.pi * np.cumsum(freq) / SR) * 0.25
    bruit = filtre(RNG.standard_normal(len(t)), "high", 2000) * 0.35
    return (sine + bruit) * (t / duree) ** 2


def zip_(duree=0.13):
    t = t_(duree)
    freq = 1400 * (280 / 1400) ** (t / duree)
    sig = np.sin(2 * np.pi * np.cumsum(freq) / SR) * 0.5 + filtre(RNG.standard_normal(len(t)), "band", [1500, 5000]) * 0.3
    return sig * enveloppe(len(t), 0.004, 0.06)


def impact(profond=True):
    t = t_(1.6)
    boum = grosse_caisse(profond)
    queue = filtre(RNG.standard_normal(len(t)), "low", 900) * np.exp(-t / 0.5) * 0.35
    sig = queue.copy()
    sig[: len(boum)] += boum
    return sig


def carillon():
    sig = np.zeros(int(1.3 * SR))
    for k, (m, d) in enumerate(((88, 0.0), (93, 0.12))):  # E6 puis A6
        t = t_(1.1)
        f = hz(m)
        note = (np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * 2.01 * f * t)) * np.exp(-t / 0.45)
        i = int(d * SR)
        sig[i : i + len(note)] += note * (0.8 if k == 0 else 1.0)
    return sig


def toucher():
    t = t_(0.06)
    return np.sin(2 * np.pi * 320 * t) * np.exp(-t / 0.012) + filtre(RNG.standard_normal(len(t)), "band", [800, 3000]) * np.exp(-t / 0.006) * 0.4


# ── Réverbération (bus) ──────────────────────────────────────────────────────────────────
def reverb(stereo, duree=1.4, mix=0.22):
    t = t_(duree)
    sortie = np.zeros_like(stereo)
    for c in range(2):
        ir = RNG.standard_normal(len(t)) * np.exp(-t / (duree / 5))
        ir = filtre(ir, "low", 5000)
        ir /= np.sqrt(np.sum(ir**2))
        humide = fftconvolve(stereo[:, c], ir)[: len(stereo)]
        sortie[:, c] = stereo[:, c] + humide * mix
    return sortie


# ── Accords et motifs ────────────────────────────────────────────────────────────────────
GRILLE = {  # nappe, basse, arpège
    "C": ([60, 64, 67, 71], 36, [60, 64, 67, 72]),
    "G": ([55, 59, 62, 67], 43, [62, 67, 71, 74]),
    "Am": ([57, 60, 64, 69], 45, [64, 69, 72, 76]),
    "F": ([53, 57, 60, 64], 41, [60, 65, 69, 72]),
}
PROGRESSION = ["C", "G", "Am", "F"]
TEMPS = 0.5
MESURE = 2.0


def section_groove(sec, musique, debut, fin, *, legere=False, origine=None):
    """Boucle C – G – Am – F de `debut` à `fin` ; l'accord suit les mesures comptées depuis `origine`."""
    origine = debut if origine is None else origine
    m = int(round((debut - origine) / MESURE))
    t0 = debut
    while t0 < fin - 1e-6:
        accord = PROGRESSION[m % 4]
        notes, racine, arpege = GRILLE[accord]
        longueur = min(MESURE, fin - t0)
        musique.ajouter(t0, nappe(notes, longueur + 0.3), 0.95)
        for b in range(int(round(longueur / TEMPS))):
            tb = t0 + b * TEMPS
            sec.ajouter(tb, grosse_caisse(), 0.7 if (not legere or b == 0) else 0.0)
            if not legere and b in (1, 3):
                sec.ajouter(tb, claquement(), 0.55, 0.1)
            sec.ajouter(tb + TEMPS / 2, charleston(ouvert=(b == 3)), 0.0 if legere else 0.32, 0.3)
            for h in range(2):  # basse en croches
                sec.ajouter(tb + h * TEMPS / 2, basse(racine + (12 if h == 1 and b == 3 else 0)), 0.42 if not legere else 0.3)
            for h in range(2):  # arpège en croches, discret
                musique.ajouter(tb + h * TEMPS / 2, pince(arpege[(2 * b + h) % 4], 0.4, 0.16), 0.26 if not legere else 0.2, -0.35 + 0.7 * ((2 * b + h) % 2))
        t0 += MESURE
        m += 1


def section_intro(musique, debut, fin):
    musique.ajouter(debut, nappe([48, 60, 64, 67, 74], fin - debut + 0.6), 0.85)


def section_tension(sec, musique, debut, fin):
    """Pulsation sourde sur chaque temps, nappe en suspens (Am add9)."""
    musique.ajouter(debut, nappe([45, 57, 60, 64, 71], fin - debut + 0.4), 0.4)
    t0 = debut
    while t0 < fin - 1e-6:
        sec.ajouter(t0, basse(33, 0.4), 0.7)
        sec.ajouter(t0 + 0.25, charleston(), 0.12, -0.3)
        t0 += TEMPS


def roulement(sec, debut, fin):
    """Roulement de claquements qui accélère jusqu'au drop."""
    t = debut
    pas = 0.25
    while t < fin - 0.02:
        prog = (t - debut) / (fin - debut)
        sec.ajouter(t, claquement(), 0.15 + 0.4 * prog, 0.0)
        pas = 0.25 if prog < 0.5 else 0.125
        t += pas


def final(musique, sec, debut, fin):
    sec.ajouter(debut, impact(), 0.9)
    musique.ajouter(debut, nappe([48, 55, 60, 64, 67, 72], fin - debut), 0.65)
    for i, m in enumerate([60, 64, 67, 72, 76, 79]):
        musique.ajouter(debut + 0.25 + i * 0.125, pince(m, 0.9, 0.35), 0.18, -0.4 + 0.16 * i)


def volets(sfx, debut, fin, gain=0.22):
    """Cliquetis serrés pendant qu'une rangée de tuiles bascule."""
    t = debut
    while t < fin:
        sfx.ajouter(t, volet(), gain * RNG.uniform(0.6, 1.0), RNG.uniform(-0.5, 0.5))
        t += RNG.uniform(0.028, 0.05)


def cascade(sfx, debut):
    """Une note par triangle du logo (12 notes, 50 ms d'écart), pentatonique ascendante."""
    gamme = [72, 74, 76, 79, 81, 84, 86, 88, 91, 93, 96, 98]
    for i, m in enumerate(gamme):
        sfx.ajouter(debut + i * 0.05, pince(m, 0.5, 0.18), 0.16, -0.6 + 1.2 * (i % 2))


def maitriser(piste_list, duree, fondu_fin=1.0):
    total = sum(p.stereo() for p in piste_list)
    total = reverb(total)
    n = len(total)
    env = np.ones(n)
    env[: int(0.02 * SR)] = np.linspace(0, 1, int(0.02 * SR))
    k = int(fondu_fin * SR)
    env[n - k :] = np.linspace(1, 0, k) ** 1.5
    total *= env[:, None]
    total = np.tanh(total * 1.2) / np.tanh(1.2)  # saturation douce
    total *= 0.89 / max(1e-9, np.max(np.abs(total)))
    return (total * 32767).astype(np.int16)


# ── Bandes-son par scène, calées sur src/Root.tsx ────────────────────────────────────────
import re


def lire_storyboard():
    """Durées des scènes (TIMINGS, en temps) et scènes du teaser vertical (VERTICAL), lues dans Root.tsx."""
    racine = open(os.path.join(ICI, "..", "src", "Root.tsx"), encoding="utf-8").read()
    bloc = racine[racine.index("export const TIMINGS") : racine.index("} as const;")]
    durees = {nom: int(n) * TEMPS for nom, n in re.findall(r"(\w+): (\d+) \* BEAT", bloc)}
    vertical = re.findall(r'"(\w+)"', racine[racine.index("const VERTICAL") :].split("\n")[0])
    return durees, vertical


GROOVE = {"agenda", "alerte", "supports", "resultats"}


def composer(ids, durees):
    debuts = {}
    t = 0.0
    for i in ids:
        debuts[i] = t
        t += durees[i]
    D = t
    musique, sec, sfx = Piste(D), Piste(D), Piste(D)
    origine_groove = min((debuts[i] for i in ids if i in GROOVE), default=0.0)

    for i in ids:
        s, d = debuts[i], durees[i]
        if i == "title":
            section_intro(musique, s, s + d)
            cascade(sfx, s + 0.3)
            volets(sfx, s + 1.6, s + 3.2)
        elif i == "outils":
            section_tension(sec, musique, s, s + d)
            for k in range(6):  # un outil par temps, puis barrés à 4 s
                volets(sfx, s + k * 0.5, s + k * 0.5 + 0.55, 0.16)
                sfx.ajouter(s + 4.0 + k * 0.2, zip_(), 0.28, -0.5 + 0.2 * k)
        elif i == "convergence":
            sfx.ajouter(s, souffle(0.9), 0.8)
            tension = nappe([43, 55, 59, 62, 67], d + 0.2) * np.linspace(0.3, 1.0, int((d + 0.2) * SR))
            musique.ajouter(s, tension, 0.8)
            sfx.ajouter(s + d - 2.0, montee(2.0), 0.9)
            roulement(sec, s + d - 1.0, s + d)
            sec.ajouter(s + d, impact(profond=False), 0.6)  # le « drop » au début de la scène suivante
        elif i in GROOVE:
            section_groove(sec, musique, s, s + d, origine=origine_groove)
            if i == "agenda":
                sfx.ajouter(s + 3.5, toucher(), 0.5)
                sfx.ajouter(s + 3.85, souffle(0.35, haut=True), 0.35)
            elif i == "alerte":
                sfx.ajouter(s + 1.5, carillon(), 0.42)
                sfx.ajouter(s + 4.5, souffle(0.35, haut=True), 0.25)
            elif i == "supports":
                sfx.ajouter(s + 3.4, souffle(0.7), 0.5)
            elif i == "resultats":
                sfx.ajouter(s + 5.0, souffle(0.3, haut=True), 0.3)
        elif i == "chiffres":
            section_groove(sec, musique, s, s + d, legere=True, origine=s)
            volets(sfx, s, s + 0.6)
            volets(sfx, s + 2.0, s + 2.8)
            volets(sfx, s + 4.0, s + 5.0)
            roulement(sec, s + d - 0.75, s + d)
        elif i == "fin":
            final(musique, sec, s, s + d)
            volets(sfx, s + 0.73, s + 1.5)
            volets(sfx, s + 1.8, s + 2.6, 0.16)
    return maitriser([musique, sec, sfx], D, 1.2)


if __name__ == "__main__":
    os.makedirs(SORTIE, exist_ok=True)
    durees, vertical = lire_storyboard()
    for nom, ids in (("hestim-planner.wav", list(durees)), ("hestim-planner-9x16.wav", vertical)):
        donnees = composer(ids, durees)
        wavfile.write(os.path.join(SORTIE, nom), SR, donnees)
        print(f"{nom} : {len(donnees) / SR:.2f} s ({', '.join(ids)})")
