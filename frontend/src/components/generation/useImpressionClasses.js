import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../contexts/ToastContext';

// Requêtes envoyées ensemble : assez pour aller vite, peu pour la limite par compte du serveur
const PAR_LOT = 4;

/**
 * PDF des emplois du temps au format de l'école (R-4) : charge le document du mois de chaque
 * classe demandée, puis ouvre la fenêtre d'impression du navigateur (« Enregistrer au format PDF »).
 * Rend { imprimer(classes, mois), aImprimer, preparation } : `aImprimer` est la liste des documents
 * à placer dans la zone d'impression, `preparation` l'avancement { fait, total } du chargement.
 * `chargerEdt(idGroupe, mois)` : voir useExploration.
 */
export default function useImpressionClasses(chargerEdt) {
    const { t } = useTranslation();
    const toast = useToast();
    const [aImprimer, setAImprimer] = useState(null);
    const [preparation, setPreparation] = useState(null);

    // Les documents sont dans la page : l'impression peut partir, puis la zone se vide
    useEffect(() => {
        if (!aImprimer) return;
        window.print();
        setAImprimer(null);
    }, [aImprimer]);

    const imprimer = async (classes, mois) => {
        const documents = [];
        setPreparation({ fait: 0, total: classes.length });
        for (let i = 0; i < classes.length; i += PAR_LOT) {
            const lot = await Promise.all(
                classes.slice(i, i + PAR_LOT).map((c) =>
                    chargerEdt(c.id_groupe, mois)
                        .then((edt) => ({ cle: c.id_groupe, edt }))
                        .catch(() => null)
                )
            );
            documents.push(...lot.filter(Boolean));
            setPreparation({ fait: Math.min(i + PAR_LOT, classes.length), total: classes.length });
        }
        setPreparation(null);
        if (documents.length < classes.length) toast.warning(t('gen.explore.pdfPartiel', { count: classes.length - documents.length }));
        if (documents.length) setAImprimer(documents);
    };

    return { imprimer, aImprimer, preparation };
}
