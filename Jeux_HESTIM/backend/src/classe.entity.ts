import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { User } from './user.entity';

@Entity()
export class Classe {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  nom!: string;

  @OneToMany(() => User, (user) => user.classe)
  participants!: User[];
}
