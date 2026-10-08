"""Ajoute les animations à la présentation générée par construire-investisseurs.js.

pptxgenjs n'écrit ni transitions ni animations : ce script les pose dans le XML de chaque
diapositive, sans toucher au contenu.
  - transition en fondu entre les diapositives ;
  - apparition en fondu des éléments, groupe par groupe (une carte avec son icône et ses textes,
    une ligne avant / après…), à la suite et sans clic : le titre arrive avec la diapositive, le
    reste se construit pendant que l'orateur parle.

Usage : python animer.py entree.pptx [sortie.pptx]   (sans sortie : le fichier est remplacé)
"""
import re
import shutil
import sys
import tempfile
import zipfile

ECART_MS = 300       # entre deux groupes
DUREE_MS = 500       # durée d'un fondu

# Formes sans nom choisi (titre, numéro de diapositive) : elles arrivent avec la diapositive
SANS_ANIMATION = re.compile(r"^(Text|Shape|Image|Picture|Slide Number)\b|^$")


def groupe(nom):
    """Clé de groupe d'une forme d'après son nom (objectName du générateur)."""
    m = re.match(r"^(avant|fleche|apres)-(\d+)", nom)
    if m:
        return f"ligne-{m.group(2)}"           # une ligne avant / après entière
    m = re.match(r"^([a-z]+-\d+)", nom)
    if m:
        return m.group(1)                       # carte, chiffre, étape… et ses éléments
    if nom in ("tuile-logo", "embleme"):
        return "logo"
    if nom.startswith("consequences-"):
        return "consequences"
    if nom.startswith("telephone-"):
        return re.sub(r"-cadre$", "", nom)       # cadre et capture ensemble
    if nom.startswith(("disponible-titre", "suite-titre")):
        return nom
    return nom


def effet(id_ctn, spid, delai, premier):
    """Un fondu d'entrée (préréglage PowerPoint « Fondu », presetID 10)."""
    type_noeud = "afterEffect" if premier else "withEffect"
    return (
        f'<p:par><p:cTn id="{id_ctn}" presetID="10" presetClass="entr" presetSubtype="0" fill="hold" grpId="0" nodeType="{type_noeud}">'
        f'<p:stCondLst><p:cond delay="{delai}"/></p:stCondLst><p:childTnLst>'
        f'<p:set><p:cBhvr><p:cTn id="{id_ctn + 1}" dur="1" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst></p:cTn>'
        f'<p:tgtEl><p:spTgt spid="{spid}"/></p:tgtEl><p:attrNameLst><p:attrName>style.visibility</p:attrName></p:attrNameLst></p:cBhvr>'
        f'<p:to><p:strVal val="visible"/></p:to></p:set>'
        f'<p:animEffect transition="in" filter="fade"><p:cBhvr><p:cTn id="{id_ctn + 2}" dur="{DUREE_MS}"/>'
        f'<p:tgtEl><p:spTgt spid="{spid}"/></p:tgtEl></p:cBhvr></p:animEffect>'
        f'</p:childTnLst></p:cTn></p:par>'
    )


def animations(xml):
    """Bloc <p:timing> : les groupes apparaissent l'un après l'autre dès l'affichage."""
    formes = re.findall(r'<(p:sp|p:pic)>.*?<p:cNvPr id="(\d+)" name="([^"]*)"', xml, re.S)
    ordre, membres = [], {}
    for balise, spid, nom in formes:
        if SANS_ANIMATION.search(nom):
            continue
        cle = groupe(nom)
        if cle not in membres:
            ordre.append(cle)
            membres[cle] = []
        membres[cle].append((balise, spid))
    if not ordre:
        return ""
    effets, id_ctn, premier = [], 5, True
    for rang, cle in enumerate(ordre):
        for balise, spid in membres[cle]:
            effets.append(effet(id_ctn, spid, rang * ECART_MS, premier))
            id_ctn += 3
            premier = False
    # Les formes (pas les images) déclarent leur construction
    construction = "".join(f'<p:bldP spid="{spid}" grpId="0" animBg="1"/>' for cle in ordre for balise, spid in membres[cle] if balise == "p:sp")
    return (
        '<p:timing><p:tnLst><p:par><p:cTn id="1" dur="indefinite" restart="never" nodeType="tmRoot"><p:childTnLst>'
        '<p:seq concurrent="1" nextAc="seek"><p:cTn id="2" dur="indefinite" nodeType="mainSeq"><p:childTnLst>'
        '<p:par><p:cTn id="3" fill="hold"><p:stCondLst><p:cond delay="indefinite"/><p:cond evt="onBegin" delay="0"><p:tn val="2"/></p:cond></p:stCondLst><p:childTnLst>'
        '<p:par><p:cTn id="4" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst><p:childTnLst>'
        + "".join(effets)
        + '</p:childTnLst></p:cTn></p:par>'
        '</p:childTnLst></p:cTn></p:par>'
        '</p:childTnLst></p:cTn>'
        '<p:prevCondLst><p:cond evt="onPrev" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:prevCondLst>'
        '<p:nextCondLst><p:cond evt="onNext" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:nextCondLst>'
        '</p:seq></p:childTnLst></p:cTn></p:par></p:tnLst>'
        + (f"<p:bldLst>{construction}</p:bldLst>" if construction else "")
        + "</p:timing>"
    )


def animer_diapositive(xml):
    if "<p:timing" in xml or "<p:transition" in xml:
        return xml  # déjà animée
    transition = '<p:transition spd="med"><p:fade/></p:transition>'
    # Ordre imposé par le schéma : cSld, clrMapOvr, transition, timing
    return xml.replace("</p:clrMapOvr>", "</p:clrMapOvr>" + transition + animations(xml), 1)


def main():
    entree = sys.argv[1]
    sortie = sys.argv[2] if len(sys.argv) > 2 else entree
    with tempfile.NamedTemporaryFile(suffix=".pptx", delete=False) as tmp:
        temporaire = tmp.name
    with zipfile.ZipFile(entree) as zin, zipfile.ZipFile(temporaire, "w", zipfile.ZIP_DEFLATED) as zout:
        for info in zin.infolist():
            donnees = zin.read(info.filename)
            if re.fullmatch(r"ppt/slides/slide\d+\.xml", info.filename):
                donnees = animer_diapositive(donnees.decode("utf-8")).encode("utf-8")
            zout.writestr(info, donnees)
    shutil.move(temporaire, sortie)
    print(f"animé : {sortie}")


if __name__ == "__main__":
    main()
