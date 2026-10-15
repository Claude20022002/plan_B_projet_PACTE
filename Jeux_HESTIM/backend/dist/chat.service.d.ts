import { Repository } from 'typeorm';
import { User } from './user.entity';
import { Groupe } from './groupe.entity';
export declare class ChatService {
    private usersRepository;
    private groupesRepository;
    constructor(usersRepository: Repository<User>, groupesRepository: Repository<Groupe>);
    getContextForUser(userId: number): Promise<{
        nom: string;
        groupe: string;
        membresDuGroupe: string[];
        progression: string;
    } | null>;
    getAnimateurSummary(): Promise<{
        nom: string;
        effectif: number;
        scoreMoyen: number;
    }[]>;
    getAlertesAnimateur(): Promise<string>;
}
//# sourceMappingURL=chat.service.d.ts.map