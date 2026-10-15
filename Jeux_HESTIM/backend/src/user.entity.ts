import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany } from 'typeorm';
import { Classe } from './classe.entity';
import { Matiere } from './matiere.entity';
import { Groupe } from './groupe.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  nom!: string;

  @Column()
  prenom!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  passwordHash!: string;

  @Column()
  role!: string;

  @Column({ default: 'En attente' })
  statut!: string;

  @ManyToOne(() => Classe, (classe) => classe.participants, { nullable: true })
  classe!: Classe;

  @ManyToOne(() => Matiere, { nullable: true })
  matiere!: Matiere;

  @ManyToOne(() => Groupe, (groupe) => groupe.participants, { nullable: true })
  groupe!: Groupe;
}
