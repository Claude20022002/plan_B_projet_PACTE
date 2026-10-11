import { Redirect } from 'expo-router';

/**
 * Route de l'onglet « Scanner ». Un onglet d'Expo Router demande une route à son nom, mais celui-ci
 * n'affiche jamais d'écran : son toucher pose /scanner par-dessus les onglets (voir _layout.jsx).
 * Si l'on arrive ici quand même (lien direct), on revient au Tableau. Surtout pas de renvoi vers
 * /scanner : il remplacerait les onglets, et le bouton Fermer ramènerait ici, en boucle.
 */
export default function OngletScanner() {
  return <Redirect href="/" />;
}
