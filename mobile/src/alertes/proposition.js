import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Proposition des alertes au premier lancement (recette du 20 octobre, M-11 ; lot R-11) : une
 * seule fois par téléphone, et seulement si le système peut encore poser la question.
 */

const CLE = 'hestim.alertes.proposees';

/** true s'il faut proposer les alertes : autorisation encore à demander, jamais proposée ici */
export const doitProposer = (autorisation, dejaProposee) => autorisation === 'a_demander' && !dejaProposee;

/** true si la proposition a déjà été faite sur ce téléphone (acceptée ou remise à plus tard) */
export const propositionFaite = async () => (await AsyncStorage.getItem(CLE).catch(() => null)) === 'oui';

/** Retient que la proposition a été faite : elle ne revient plus, le choix reste dans Compte */
export const retenirProposition = () => AsyncStorage.setItem(CLE, 'oui').catch(() => {});
