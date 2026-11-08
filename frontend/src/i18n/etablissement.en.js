/** Texts of the "Identity and brand" panel (English), merged under the "etablissement" key by i18n/index.js. */
const etablissement = {
  intro: 'The school name, logo and colours appear on every page, in emails, PDFs and the app. After saving, the page reloads to apply them; other users see them on their next visit.',
  sections: { identite: 'Identity', couleurs: 'Colours', logo: 'Logo', courriels: 'Emails' },
  champs: {
    nom: 'Full school name',
    nomAide: 'Page footers, PDFs, sign-in page, email sender name.',
    nomCourt: 'Short name',
    nomCourtAide: 'Home board, tab title, email subjects. The product is then called "{{exemple}}".',
    principale: 'Main colour',
    principaleAide: 'Menu, buttons, board frame. White text must be readable on it: contrast of at least 4.5:1.',
    accent: 'Accent colour',
    accentAide: 'The word "PLANNER", call-to-action buttons, rules. Contrast of at least 3:1 on white.',
    expediteur: 'Email sender name',
    expediteurAide: 'Left empty: "{{produit}}".',
    reponse: 'Reply-to address',
    reponseAide: 'Replies to Planner emails arrive here (for instance the registrar). Left empty: no reply possible.',
  },
  contraste: 'Contrast {{valeur}}:1 (at least {{seuil}}:1)',
  apercu: 'Preview',
  apercuBouton: 'Button',
  logo: {
    actuel: 'Current logo',
    aucun: 'No logo: the short name is shown instead.',
    choisir: 'Choose an image',
    retirer: 'Remove the logo',
    regles: 'PNG, JPEG or WebP, 512 KB at most, preferably on a transparent or white background. SVG is refused (it can contain scripts).',
    tropLourd: 'Image too large: 512 KB at most.',
    format: 'Format refused: PNG, JPEG or WebP only.',
    confirmerRetrait: 'Remove the logo? The school short name will be shown instead.',
  },
  enregistrer: 'Save',
  enregistre: 'Saved: the page reloads.',
  corriger: 'Fix the highlighted fields before saving.',
};

export default etablissement;
