import { contexteCourant } from "./etablissement.js";

/**
 * Résolveur de modèle (D-03) : un objet qui se comporte comme le modèle « nom » de l'établissement
 * courant. Les fichiers qui importent les modèles ne changent pas : Groupe.findAll(), new Groupe(),
 * include: [{ model: Groupe }] (Sequelize relie les inclusions par nom de modèle), x instanceof
 * Groupe, Groupe.rawAttributes... tout est relu, à chaque accès, sur le modèle de l'établissement.
 */
export const resolveur = (nom) => {
    const modele = () => {
        const trouve = contexteCourant().modeles[nom];
        if (!trouve) throw new Error(`Modèle inconnu dans l'établissement courant : ${nom}`);
        return trouve;
    };

    // Cible : une fonction ordinaire, pour que « new » et « instanceof » passent par le proxy.
    // Sa propriété prototype est modifiable : le proxy peut donc rendre celle du vrai modèle.
    const cible = function () {};
    const proxy = new Proxy(cible, {
        // Accès direct (Groupe.findAll) : le modèle est le « this » des accesseurs. Accès par une
        // sous-classe (Groupe.scope() crée « class extends Groupe ») : on garde la sous-classe.
        get: (_, prop, recepteur) => {
            const m = modele();
            return Reflect.get(m, prop, recepteur === proxy ? m : recepteur);
        },
        set: (_, prop, valeur, recepteur) => {
            const m = modele();
            return Reflect.set(m, prop, valeur, recepteur === proxy ? m : recepteur);
        },
        has: (_, prop) => Reflect.has(modele(), prop),
        ownKeys: () => [...new Set([...Reflect.ownKeys(modele()), "prototype"])],
        getOwnPropertyDescriptor: (_, prop) => {
            const descripteur = Reflect.getOwnPropertyDescriptor(modele(), prop);
            // Invariant des proxys : « prototype » est non configurable mais modifiable sur la cible
            return prop === "prototype" && descripteur ? { ...descripteur, writable: true } : descripteur && { ...descripteur, configurable: true };
        },
        defineProperty: (_, prop, descripteur) => Reflect.defineProperty(modele(), prop, descripteur),
        deleteProperty: (_, prop) => Reflect.deleteProperty(modele(), prop),
        getPrototypeOf: () => Reflect.getPrototypeOf(modele()),
        construct: (_, args, nouvelleCible) => {
            const m = modele();
            return Reflect.construct(m, args, nouvelleCible === proxy ? m : nouvelleCible);
        },
        apply: (_, ceci, args) => Reflect.apply(modele(), ceci, args),
    });
    return proxy;
};
