import { OnApplicationBootstrap } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Classe } from './classe.entity';
import { Matiere } from './matiere.entity';
import { Groupe } from './groupe.entity';
import { User } from './user.entity';
export declare class SeedService implements OnApplicationBootstrap {
    private classesRepo;
    private matieresRepo;
    private groupesRepo;
    private usersRepo;
    constructor(classesRepo: Repository<Classe>, matieresRepo: Repository<Matiere>, groupesRepo: Repository<Groupe>, usersRepo: Repository<User>);
    onApplicationBootstrap(): Promise<void>;
    run(): Promise<void>;
    generateLargeDataset(): Promise<void>;
}
//# sourceMappingURL=seed.service.d.ts.map