/**
 * Personnages des joueurs (Kenney Mini Characters, CC0, repris de CatéGO) : mêmes identifiants
 * sur le serveur, le web (frontend/public/img/jeux/personnages) et le mobile (assets/jeux).
 */
export const AVATARS = [
  'female-a', 'male-a', 'female-b', 'male-b', 'female-c', 'male-c',
  'female-d', 'male-d', 'female-e', 'male-e', 'female-f', 'male-f',
];

export const avatarValide = (avatar) => AVATARS.includes(avatar);

/** Personnage d'un joueur : celui qu'il a choisi, sinon un personnage tiré de son numéro */
export const avatarDe = (idUser, choisi) => (avatarValide(choisi) ? choisi : AVATARS[Math.abs(Number(idUser) || 0) % AVATARS.length]);
