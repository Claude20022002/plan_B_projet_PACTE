import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { espaceCoursAPI } from '../services/espaceCours';
import { useToast } from '../contexts/ToastContext';
import { useConfirmation } from '../contexts/ConfirmationContext';
import { ouvertureAVenir } from '../utils/ouverture';
import { localeEcran } from '../utils/dates';

/**
 * État et actions de l'espace de cours d'une classe : chargement, ouverture d'un support, et les
 * actions des menus (supports et sections). Chaque action recharge l'espace depuis le serveur :
 * un collègue peut avoir ajouté un support entre-temps.
 * `saisir(options)` ouvre la fenêtre de saisie de la page et rend les valeurs (ou null).
 */
export default function useEspaceCours(idCours, idGroupe, saisir) {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const confirmer = useConfirmation();
  const [espace, setEspace] = useState(null);
  const [erreur, setErreur] = useState(null);

  const charger = useCallback(
    () =>
      espaceCoursAPI
        .lire(idCours, idGroupe)
        .then((e) => {
          setEspace(e);
          setErreur(null);
        })
        .catch((e) => setErreur(e)),
    [idCours, idGroupe]
  );
  useEffect(() => {
    charger();
  }, [charger]);

  // Une action : appel, recharge, message ; l'erreur du serveur est montrée telle quelle
  const faire = async (appel, message) => {
    try {
      await appel();
      if (message) toast.success(message);
    } catch (e) {
      toast.error(e.message);
    } finally {
      await charger();
    }
  };

  const ouvrir = async (support) => {
    // Fenêtre ouverte tout de suite (sinon le navigateur la bloque), puis dirigée vers le lien.
    // « noopener » ferait rendre null à window.open : le lien avec cette page est coupé à la main.
    const fenetre = window.open('', '_blank');
    if (fenetre) fenetre.opener = null;
    try {
      const { url } = await espaceCoursAPI.ouvrir(support.id_support);
      if (fenetre) fenetre.location.href = url;
      else window.location.assign(url);
    } catch (e) {
      fenetre?.close();
      toast.error(e.message);
    }
  };

  // Dates d'ouverture et de fermeture d'une section ou d'un support (lot EC-1) : un champ vide = pas de limite
  const dateOuverture = async (element, modifier) => {
    const v = await saisir({
      titre: t('espaceCours.ouverture.titre'),
      champs: [
        { nom: 'visible_du', libelle: t('espaceCours.ouverture.du'), type: 'date', valeur: element.visible_du ?? '', max: 10 },
        { nom: 'visible_jusqu_au', libelle: t('espaceCours.ouverture.jusquAuChamp'), type: 'date', valeur: element.visible_jusqu_au ?? '', aide: t('espaceCours.ouverture.aide'), max: 10 },
      ],
    });
    if (v) await faire(() => modifier({ visible_du: v.visible_du || null, visible_jusqu_au: v.visible_jusqu_au || null }), t('espaceCours.ouverture.enregistree'));
  };

  const sections = espace?.sections ?? [];
  const voisin = (liste, element, cle, pas) => liste[liste.findIndex((x) => x[cle] === element[cle]) + pas];

  const actionSupport = async (nom, support, valeur) => {
    const section = sections.find((s) => s.supports.some((x) => x.id_support === support.id_support));
    switch (nom) {
      case 'renommer': {
        const v = await saisir({ titre: t('espaceCours.renommer'), champs: [{ nom: 'titre', libelle: t('espaceCours.titre'), valeur: support.titre, requis: true }] });
        if (v) await faire(() => espaceCoursAPI.modifierSupport(support.id_support, { titre: v.titre }));
        break;
      }
      case 'visibilite':
        await faire(() => espaceCoursAPI.modifierSupport(support.id_support, { visible: !support.visible }), t(support.visible ? 'espaceCours.messages.masque' : 'espaceCours.messages.affiche'));
        break;
      case 'ouverture':
        await dateOuverture(support, (champs) => espaceCoursAPI.modifierSupport(support.id_support, champs));
        break;
      case 'monter':
      case 'descendre': {
        const autre = voisin(section.supports, support, 'id_support', nom === 'monter' ? -1 : 1);
        if (autre) {
          await faire(() =>
            Promise.all([espaceCoursAPI.modifierSupport(support.id_support, { ordre: autre.ordre }), espaceCoursAPI.modifierSupport(autre.id_support, { ordre: support.ordre })])
          );
        }
        break;
      }
      case 'deplacer':
        await faire(() => espaceCoursAPI.modifierSupport(support.id_support, { id_section: valeur }));
        break;
      case 'publier': {
        // Pas encore ouvert à la classe : la Bibliothèque le montrera quand même à toute l'école dès
        // maintenant, quelles que soient ses dates (relecture de A, lot EC-1). On le dit avant.
        const ouvre = ouvertureAVenir(support, section);
        const date = ouvre && new Date(`${ouvre}T12:00:00`).toLocaleDateString(localeEcran(i18n.language), { day: 'numeric', month: 'long' });
        const message = ouvre ? t('espaceCours.publierAvantOuverture', { titre: support.titre, date }) : t('espaceCours.publierConfirmation', { titre: support.titre });
        if (await confirmer({ titre: t('espaceCours.publier'), message, libelle: t('espaceCours.publierBouton') })) {
          await faire(() => espaceCoursAPI.publierSupport(support.id_support), t('espaceCours.messages.publie'));
        }
        break;
      }
      case 'retirer': {
        const message = support.dans_bibliotheque ? t('espaceCours.retirerEpingle', { titre: support.titre }) : t('espaceCours.retirerConfirmation', { titre: support.titre });
        if (await confirmer({ titre: t('espaceCours.retirer'), message, libelle: t('espaceCours.retirer') })) {
          await faire(() => espaceCoursAPI.retirerSupport(support.id_support), t('espaceCours.messages.retire'));
        }
        break;
      }
      default:
    }
  };

  const actionSection = async (nom, section) => {
    switch (nom) {
      case 'renommer': {
        const v = await saisir({ titre: t('espaceCours.renommerSection'), champs: [{ nom: 'titre', libelle: t('espaceCours.titre'), valeur: section.titre, requis: true, max: 120 }] });
        if (v) await faire(() => espaceCoursAPI.modifierSection(section.id_section, { titre: v.titre }));
        break;
      }
      case 'visibilite':
        await faire(() => espaceCoursAPI.modifierSection(section.id_section, { visible: !section.visible }));
        break;
      case 'ouverture':
        await dateOuverture(section, (champs) => espaceCoursAPI.modifierSection(section.id_section, champs));
        break;
      case 'monter':
      case 'descendre': {
        const ids = sections.map((s) => s.id_section);
        const i = ids.indexOf(section.id_section);
        const j = nom === 'monter' ? i - 1 : i + 1;
        [ids[i], ids[j]] = [ids[j], ids[i]];
        await faire(() => espaceCoursAPI.ordonnerSections(idCours, idGroupe, ids));
        break;
      }
      case 'supprimer':
        if (await confirmer({ message: t('espaceCours.supprimerSectionConfirmation', { titre: section.titre }), libelle: t('common.delete') })) {
          await faire(() => espaceCoursAPI.supprimerSection(section.id_section));
        }
        break;
      case 'lien': {
        const v = await saisir({
          titre: t('espaceCours.ajouterLien'),
          libelleValider: t('espaceCours.ajouter'),
          champs: [
            { nom: 'url', libelle: t('espaceCours.adresse'), type: 'url', requis: true, aide: t('espaceCours.adresseAide'), max: 2048 },
            { nom: 'titre', libelle: t('espaceCours.titreFacultatif') },
          ],
        });
        if (v) await faire(() => espaceCoursAPI.ajouterLien(section.id_section, v), t('espaceCours.messages.lienAjoute'));
        break;
      }
      default:
    }
  };

  const nouvelleSection = async () => {
    const v = await saisir({ titre: t('espaceCours.nouvelleSection'), libelleValider: t('espaceCours.creer'), champs: [{ nom: 'titre', libelle: t('espaceCours.titre'), valeur: '', requis: true, max: 120, aide: t('espaceCours.titreSectionAide') }] });
    if (v) await faire(() => espaceCoursAPI.creerSection(idCours, idGroupe, v.titre));
  };

  return { espace, erreur, charger, ouvrir, actionSupport, actionSection, nouvelleSection };
}
