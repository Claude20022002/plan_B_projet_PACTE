import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Classe } from './classe.entity';

@Entity()
export class Matiere {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  nom!: string;

  @ManyToOne(() => Classe, (classe) => classe.id)
  classe!: Classe;
}
