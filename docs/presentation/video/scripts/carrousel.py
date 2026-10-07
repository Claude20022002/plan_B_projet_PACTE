"""
Carrousel LinkedIn : rend chaque page de la composition Remotion « Carrousel » (une image par
page, 1080 × 1350), puis les assemble en un PDF à publier comme document sur LinkedIn.

    npm run carrousel     (depuis docs/presentation/video)

Sortie : out/carrousel/page-01.png … et out/carrousel/hestim-planner-carrousel.pdf
"""
import os
import re
import subprocess
import sys

from PIL import Image

ICI = os.path.dirname(os.path.abspath(__file__))
RACINE = os.path.dirname(ICI)
SORTIE = os.path.join(RACINE, "out", "carrousel")


def nombre_de_pages():
    source = open(os.path.join(RACINE, "src", "carrousel", "Carrousel.tsx"), encoding="utf-8").read()
    debut = source.index("const PAGES")
    fin = source.index("export const NB_PAGES")
    return len(re.findall(r"^  // \d+ ·", source[debut:fin], flags=re.M))


def main():
    os.makedirs(SORTIE, exist_ok=True)
    pages = nombre_de_pages()
    images = []
    for i in range(pages):
        chemin = os.path.join(SORTIE, f"page-{i + 1:02d}.png")
        subprocess.run(
            ["npx", "remotion", "still", "Carrousel", chemin, f"--frame={i}", "--log=error"],
            cwd=RACINE,
            check=True,
            shell=sys.platform == "win32",
        )
        images.append(Image.open(chemin).convert("RGB"))
        print(f"page {i + 1}/{pages}")
    pdf = os.path.join(SORTIE, "hestim-planner-carrousel.pdf")
    images[0].save(pdf, save_all=True, append_images=images[1:], resolution=144)
    print(pdf)


if __name__ == "__main__":
    main()
