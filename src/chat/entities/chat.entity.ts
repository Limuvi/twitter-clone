import {
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Profile } from '../../profile/entities/profile.entity';
import { Message } from './message.entity';

@Entity()
export class Chat {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToMany(() => Profile)
  @JoinTable()
  profiles: Profile[];

  @OneToMany(() => Message, (m) => m.chat)
  messages: Message[];

  @UpdateDateColumn()
  updatedAt: Date;
}
