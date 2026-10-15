import { Classe } from './classe.entity';
import { Matiere } from './matiere.entity';
import { Groupe } from './groupe.entity';
export declare class User {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    passwordHash: string;
    role: string;
    statut: string;
    classe: Classe;
    matiere: Matiere;
    groupe: Groupe;
}
//# sourceMappingURL=user.entity.d.ts.map