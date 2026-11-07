# shellcheck shell=bash
# Fonctions de deployer.sh (lot ME-0b, docs/plans/planner-multi-etablissements/conception-me0b-deploiement.md),
# à part pour être essayées sur un faux Docker (deploy/vps/tests/tester-deployer.sh).
# Variables attendues : REGISTRE (ghcr.io/claude20022002), HESTIM (/opt/hestim).

# Images publiées par la CI à chaque commit de main ; les trois premières tournent sur le serveur
IMAGES=(backend frontend solver exploitation)
SERVICES_EN_LIGNE=(backend frontend solver)
# Nom local des images, celui de docker-compose.yml (inchangé : C-6)
NOM_LOCAL=claude20022002

# Commit demandé : court (7 caractères) ou complet (40), hexadécimal en minuscules : les deux
# étiquettes que la CI pose sur chaque image
commit_valide() { [[ "$1" =~ ^[0-9a-f]{7}$ || "$1" =~ ^[0-9a-f]{40}$ ]]; }

image_publiee() { echo "$REGISTRE/hestim-$1:$2"; }
image_locale() { echo "$NOM_LOCAL/hestim-$1:$2"; }

# Étiquette OCI d'une image présente sur le serveur ; vide si l'image ou l'étiquette manque
etiquette_de() {
    local valeur
    valeur="$(docker image inspect -f "{{ index .Config.Labels \"$2\" }}" "$1" 2>/dev/null)" || valeur=""
    [ "$valeur" = "<no value>" ] && valeur=""
    echo "$valeur"
}

# Tire les quatre images du commit et vérifie qu'elles portent toutes ce même commit (C-4, C-11).
# Écrit le commit complet ; échoue sans rien changer d'autre que le cache d'images de Docker.
tirer_et_verifier() {
    local commit="$1" complet="" s image revision
    for s in "${IMAGES[@]}"; do
        image="$(image_publiee "$s" "$commit")"
        if ! docker pull -q "$image" >/dev/null 2>&1; then
            echo "image absente du registre : $image (la CI de ce commit est-elle finie et verte ?)" >&2
            return 1
        fi
        revision="$(etiquette_de "$image" org.opencontainers.image.revision)"
        if [ "${#revision}" -ne 40 ] || [[ "$revision" != "$commit"* ]]; then
            echo "$image porte le commit « ${revision:-aucun} », pas $commit : arrêt" >&2
            return 1
        fi
        if [ -n "$complet" ] && [ "$revision" != "$complet" ]; then
            echo "images de deux commits différents ($complet et $revision) : arrêt" >&2
            return 1
        fi
        complet="$revision"
    done
    echo "$complet"
}

# Garde l'image en service sous :avant-<date>, puis met celle du commit à sa place (C-6). Le
# solveur n'est remplacé que si ses sources ont changé (étiquette planner.source) : le redémarrer
# couperait une génération en cours pour rien.
mettre_en_place() {
    local commit="$1" date="$2" s nouvelle
    for s in "${SERVICES_EN_LIGNE[@]}"; do
        nouvelle="$(image_publiee "$s" "$commit")"
        if [ "$s" = solver ] && [ -n "$(etiquette_de "$nouvelle" planner.source)" ] \
            && [ "$(etiquette_de "$nouvelle" planner.source)" = "$(etiquette_de "$(image_locale solver latest)" planner.source)" ]; then
            echo "solveur inchangé : gardé"
            continue
        fi
        if docker image inspect "$(image_locale "$s" latest)" >/dev/null 2>&1; then
            docker tag "$(image_locale "$s" latest)" "$(image_locale "$s" "avant-$date")"
        fi
        docker tag "$nouvelle" "$(image_locale "$s" latest)"
    done
}

# Copie les scripts d'exploitation du commit dans $HESTIM/deploy/vps (C-7). Chaque fichier est
# remplacé par un renommage (nouvel inode) : deployer.sh, en train de tourner, n'est pas réécrit
# sous lui. Écrit le dossier extrait (Caddyfile.vps y reste pour mettre_a_jour_caddy).
installer_scripts() {
    local commit="$1" dossier conteneur fichier cible
    dossier="$(mktemp -d)"
    conteneur="$(docker create "$(image_publiee exploitation "$commit")")"
    docker cp "$conteneur:/exploitation/." "$dossier" >/dev/null
    docker rm "$conteneur" >/dev/null
    for fichier in "$dossier"/*.sh "$dossier"/*.mjs; do
        cible="$HESTIM/deploy/vps/$(basename "$fichier")"
        cp "$fichier" "$cible.nouveau" && mv -f "$cible.nouveau" "$cible"
    done
    if [ -d "$dossier/demo" ]; then
        rm -rf "$HESTIM/deploy/vps/demo" && cp -r "$dossier/demo" "$HESTIM/deploy/vps/demo"
    fi
    echo "$dossier"
}

# Attend qu'un conteneur soit « healthy » (2 minutes au plus)
attendre_sain() {
    for _ in $(seq 1 40); do
        [ "$(docker inspect -f '{{.State.Health.Status}}' "$1" 2>/dev/null)" = healthy ] && return 0
        sleep 3
    done
    echo "$1 n'est pas « healthy » après 2 minutes" >&2
    return 1
}

# Commit annoncé par le serveur en marche (/health) et par le site servi (/version.txt)
version_du_serveur() {
    docker exec hestim_backend wget -qO- http://localhost:5000/health | sed -n 's/.*"version":"\([0-9a-f]*\)".*/\1/p'
}
version_du_site() { docker exec hestim_frontend cat /usr/share/nginx/html/version.txt; }

# Sauvegarde de la base avant que le serveur applique ses migrations (C-8). Écrit le fichier.
sauvegarder_base() {
    local fichier="/root/sauvegardes/hestim-$1.sql.gz"
    mkdir -p /root/sauvegardes && chmod 700 /root/sauvegardes
    # Mot de passe lu dans le conteneur : jamais affiché ni passé en argument visible de l'hôte
    docker exec hestim_mysql sh -c 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysqldump -uroot --single-transaction --routines "$MYSQL_DATABASE"' \
        | gzip > "$fichier"
    chmod 600 "$fichier"
    echo "$fichier"
}

# Nouvel aiguillage, seulement s'il a changé et si Caddy l'accepte (même règle que appliquer-maj.sh)
mettre_a_jour_caddy() {
    local nouveau="$1" date="$2" actuel="$HESTIM/deploy/vps/Caddyfile.vps"
    [ -f "$nouveau" ] && ! cmp -s "$nouveau" "$actuel" || return 0
    docker cp "$nouveau" hestim_caddy:/tmp/Caddyfile.nouveau
    if docker exec hestim_caddy caddy validate --config /tmp/Caddyfile.nouveau --adapter caddyfile >/dev/null 2>&1; then
        cp "$actuel" "$actuel.avant-$date"
        # cp (et non mv) : le conteneur monte ce fichier, il doit garder le même inode
        cp "$nouveau" "$actuel"
        docker exec hestim_caddy caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile
        echo "aiguillage rechargé (ancien : $actuel.avant-$date)"
    else
        echo "ATTENTION : nouveau Caddyfile refusé par Caddy, l'aiguillage actuel est gardé" >&2
    fi
}

# Adresse publique de l'installation (.env.docker) : la même commande sert à HESTIM et à l'école pilote
adresse_du_site() { sed -n 's/^SITE_ADDRESS=//p' "$HESTIM/.env.docker" | head -1; }

# Historique des versions mises en ligne : « <date> <commit complet> » par ligne (C-10)
historique() { echo "$HESTIM/deploy/versions.log"; }
noter_version() {
    mkdir -p "$(dirname "$(historique)")"
    echo "$2 $1" >> "$(historique)"
}
# La version en ligne avant la dernière mise en ligne ; échoue s'il n'y en a pas
version_precedente() {
    local precedente
    [ -f "$(historique)" ] || { echo "aucun historique : $(historique)" >&2; return 1; }
    precedente="$(awk '{print $2}' "$(historique)" | uniq | tail -n 2 | head -n 1)"
    if [ -z "$precedente" ] || [ "$precedente" = "$(awk '{print $2}' "$(historique)" | tail -n 1)" ]; then
        echo "pas de version précédente dans $(historique)" >&2
        return 1
    fi
    echo "$precedente"
}
