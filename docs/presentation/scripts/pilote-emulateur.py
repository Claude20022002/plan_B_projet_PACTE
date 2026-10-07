"""
Pilote l'émulateur Android (captures de l'application mobile) : toucher un élément par son texte
(uiautomator), toucher des coordonnées, capturer l'écran dans docs/presentation/captures.

Prérequis : émulateur `hestim_pixel` démarré, Expo Go ouvert sur l'app (Metro sur 8095,
`adb reverse tcp:8095 tcp:8095`, puis `adb shell am start -a android.intent.action.VIEW -d exp://127.0.0.1:8095`).
Usage : python pilote-emulateur.py textes | toucher "Semaine" | tap 540 814 | capturer mobile-37-mois | apercu | retour
"""
import os
import re
import subprocess
import sys
import time

ADB = os.path.join(os.environ["LOCALAPPDATA"], "Android", "Sdk", "platform-tools", "adb.exe")
SORTIE = r"C:\Users\clusa\Desktop\Github Project\plan_B_projet_PACTE\docs\presentation\captures"
TMP = os.environ.get("TEMP", ".")


def adb(*args, binaire=False):
    r = subprocess.run([ADB, *args], capture_output=True, timeout=60)
    return r.stdout if binaire else r.stdout.decode("utf-8", "replace")


def elements():
    adb("shell", "uiautomator", "dump", "/sdcard/ui.xml")
    xml = adb("shell", "cat", "/sdcard/ui.xml")
    noeuds = []
    for m in re.finditer(r'<node [^>]*?text="([^"]*)"[^>]*?content-desc="([^"]*)"[^>]*?bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"', xml):
        texte, desc, x1, y1, x2, y2 = m.groups()
        noeuds.append((texte, desc, (int(x1) + int(x2)) // 2, (int(y1) + int(y2)) // 2))
    return noeuds


def toucher(cible, index=0, exact=False):
    trouves = [n for n in elements() if (n[0] == cible or n[1] == cible) if exact] if exact else [n for n in elements() if cible.lower() in (n[0] + " " + n[1]).lower()]
    if len(trouves) <= index:
        print(f"introuvable : {cible}")
        return False
    _, _, x, y = trouves[index]
    adb("shell", "input", "tap", str(x), str(y))
    time.sleep(1.5)
    return True


def tap(x, y, pause=1.5):
    adb("shell", "input", "tap", str(x), str(y))
    time.sleep(pause)


def balayer(x1, y1, x2, y2, ms=300):
    adb("shell", "input", "swipe", str(x1), str(y1), str(x2), str(y2), str(ms))
    time.sleep(1.2)


def capturer(nom, dossier=SORTIE):
    png = adb("exec-out", "screencap", "-p", binaire=True)
    chemin = os.path.join(dossier, f"{nom}.png")
    open(chemin, "wb").write(png)
    print(f"capturé : {chemin}")
    return chemin


def apercu(nom="ecran-petit"):
    from PIL import Image
    chemin = capturer("_ecran", TMP)
    Image.open(chemin).convert("RGB").resize((360, 800)).save(os.path.join(TMP, f"{nom}.png"))


def textes():
    for t, d, x, y in elements():
        if t or d:
            print(f"{x},{y}  {t!r} {d!r}")


if __name__ == "__main__":
    action = sys.argv[1]
    if action == "textes":
        textes()
    elif action == "toucher":
        toucher(sys.argv[2], int(sys.argv[3]) if len(sys.argv) > 3 else 0)
    elif action == "tap":
        tap(sys.argv[2], sys.argv[3])
    elif action == "capturer":
        capturer(sys.argv[2])
    elif action == "apercu":
        apercu(sys.argv[2] if len(sys.argv) > 2 else "ecran-petit")
    elif action == "retour":
        adb("shell", "input", "keyevent", "4")
