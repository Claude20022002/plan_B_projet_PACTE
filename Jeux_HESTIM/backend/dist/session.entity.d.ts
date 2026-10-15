import { Classe } from './classe.entity';
import { User } from './user.entity';
export declare class SessionPedagogique {
    id: number;
    titre: string;
    dateDebut: string;
    dateFin: string;
    jeu: string;
    description: string;
    statut: string;
    duree: string;
    classe: Classe;
    enseignant: User;
    participants: User[];
}
//# sourceMappingURL=session.entity.d.ts.map