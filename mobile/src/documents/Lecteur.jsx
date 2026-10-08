import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { creerStyles, useTheme } from '../theme';

/**
 * Affichage d'un document téléchargé, dans l'application :
 *  - PDF sur iPhone : moteur natif de WebKit (net, zoom au pincement) ;
 *  - PDF sur Android : la WebView ne sait pas afficher un PDF ; pdf.js (Mozilla) dessine les pages
 *    au fil du défilement, à partir du fichier local transmis par message (rien ne part en ligne
 *    hormis le chargement de pdf.js) ;
 *  - image : centrée sur le fond de l'application, zoomable.
 */

const PDFJS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174';

const pagePdfJs = (fond, filet) => `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes">
<style>
  html, body { margin: 0; background: ${fond}; }
  #pages { padding: 10px 8px 40px; }
  .page { position: relative; margin: 0 auto 12px; background: #fff; box-shadow: 0 1px 4px ${filet}; }
  .page canvas { display: block; width: 100%; height: 100%; }
</style>
<script src="${PDFJS}/pdf.min.js"></script></head>
<body><div id="pages"></div>
<script>
  const envoyer = (message) => window.ReactNativeWebView.postMessage(JSON.stringify(message));
  pdfjsLib.GlobalWorkerOptions.workerSrc = '${PDFJS}/pdf.worker.min.js';
  const ouvrir = async (base64) => {
    try {
      const binaire = atob(base64);
      const octets = new Uint8Array(binaire.length);
      for (let i = 0; i < binaire.length; i += 1) octets[i] = binaire.charCodeAt(i);
      const pdf = await pdfjsLib.getDocument({ data: octets }).promise;
      const conteneur = document.getElementById('pages');
      const largeur = conteneur.clientWidth - 16;
      const ratio = Math.min(window.devicePixelRatio || 1, 2.5);
      // Chaque page réserve sa place, puis n'est dessinée qu'à l'approche de l'écran
      const observateur = new IntersectionObserver((entrees) => entrees.forEach(async (entree) => {
        if (!entree.isIntersecting || entree.target.dataset.dessinee) return;
        entree.target.dataset.dessinee = '1';
        const page = await pdf.getPage(Number(entree.target.dataset.numero));
        const echelle = largeur / page.getViewport({ scale: 1 }).width;
        const vue = page.getViewport({ scale: echelle * ratio });
        const toile = document.createElement('canvas');
        toile.width = vue.width;
        toile.height = vue.height;
        entree.target.appendChild(toile);
        await page.render({ canvasContext: toile.getContext('2d'), viewport: vue }).promise;
      }), { rootMargin: '800px 0px' });
      for (let n = 1; n <= pdf.numPages; n += 1) {
        const page = await pdf.getPage(n);
        const vue = page.getViewport({ scale: largeur / page.getViewport({ scale: 1 }).width });
        const bloc = document.createElement('div');
        bloc.className = 'page';
        bloc.dataset.numero = String(n);
        bloc.style.width = vue.width + 'px';
        bloc.style.height = vue.height + 'px';
        conteneur.appendChild(bloc);
        observateur.observe(bloc);
      }
      envoyer({ pret: true, pages: pdf.numPages });
    } catch (erreur) {
      envoyer({ erreur: String(erreur && erreur.message || erreur) });
    }
  };
  const recevoir = (evenement) => ouvrir(evenement.data);
  document.addEventListener('message', recevoir);
  window.addEventListener('message', recevoir);
  envoyer({ charge: true });
</script></body></html>`;

const pageImage = (fond, mime, base64) => `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=6, user-scalable=yes">
<style>html, body { margin: 0; height: 100%; background: ${fond}; } body { display: flex; align-items: center; justify-content: center; }
img { max-width: 100%; max-height: 100%; }</style></head>
<body><img src="data:${mime};base64,${base64}" alt=""></body></html>`;

export default function Lecteur({ fichier, mime, lecture, surErreur }) {
  const { couleurs } = useTheme();
  const styles = useStyles();
  const vue = useRef(null);
  const [html, setHtml] = useState(null);
  const [pret, setPret] = useState(false);
  const pdfNatif = lecture === 'pdf' && Platform.OS === 'ios';

  useEffect(() => {
    if (pdfNatif) return;
    if (lecture === 'pdf') setHtml(pagePdfJs(couleurs.fond, couleurs.filet));
    else fichier.base64().then((b64) => setHtml(pageImage(couleurs.fond, mime, b64)), surErreur);
  }, [fichier, mime, lecture, pdfNatif, couleurs, surErreur]);

  const message = async ({ nativeEvent }) => {
    let donnees;
    try {
      donnees = JSON.parse(nativeEvent.data);
    } catch {
      return;
    }
    // pdf.js est prêt : on lui transmet le fichier local
    if (donnees.charge) vue.current?.postMessage(await fichier.base64());
    if (donnees.pret) setPret(true);
    if (donnees.erreur) surErreur(new Error(donnees.erreur));
  };

  const attente = !pret && !pdfNatif && lecture === 'pdf';
  return (
    <View style={styles.cadre}>
      {pdfNatif ? (
        <WebView source={{ uri: fichier.uri }} originWhitelist={['*']} allowingReadAccessToURL={fichier.parentDirectory?.uri ?? fichier.uri} allowFileAccess style={styles.vue} onError={() => surErreur(new Error('lecture'))} />
      ) : html ? (
        <WebView ref={vue} source={{ html }} originWhitelist={['*']} onMessage={message} style={styles.vue} setBuiltInZoomControls setDisplayZoomControls={false} />
      ) : null}
      {attente || (!pdfNatif && !html) ? (
        <View style={styles.attente} pointerEvents="none">
          <ActivityIndicator color={couleurs.lettre} />
        </View>
      ) : null}
    </View>
  );
}

const useStyles = creerStyles((t) => ({
  cadre: { flex: 1, backgroundColor: t.couleurs.fond },
  vue: { flex: 1, backgroundColor: t.couleurs.fond },
  attente: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
}));
