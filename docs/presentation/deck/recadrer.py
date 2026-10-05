"""Recadrages des captures pour le deck (zones utiles, sans barre latérale ni vide)."""
from pathlib import Path
from PIL import Image

SRC = Path(r"C:\Users\clusa\Desktop\Github Project\plan_B_projet_PACTE\docs\presentation\captures")
OUT = Path(__file__).parent / "img"
OUT.mkdir(exist_ok=True)

RECADRAGES = {
    # nom de sortie : (fichier source, (gauche, haut, droite, bas))
    "tableau-enseignant": ("web-04-tableau-enseignant.png", (368, 88, 1308, 700)),
    "edt-mensuel": ("web-09-edt-mensuel.png", (368, 205, 1800, 1080)),
    "generation-chiffres": ("web-08-generation.png", (370, 340, 1260, 770)),
    "bibliotheque": ("web-13-bibliotheque.png", (780, 276, 1672, 960)),
}

for nom, (fichier, zone) in RECADRAGES.items():
    image = Image.open(SRC / fichier).convert("RGB").crop(zone)
    image.save(OUT / f"{nom}.png", optimize=True)
    print(nom, image.size)

# Écrans mobiles : copiés tels quels (1080×2400)
for fichier in ["mobile-01-tableau.png", "mobile-04-jeux.png", "mobile-03-bibliotheque.png"]:
    image = Image.open(SRC / fichier).convert("RGB")
    image.save(OUT / fichier.replace("mobile-", "m-"), optimize=True)
    print(fichier, image.size)
