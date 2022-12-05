import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  RelationId,
  Tree,
  TreeChildren,
  TreeParent,
  UpdateDateColumn,
} from 'typeorm';
import { Profile } from '../../profile/entities/profile.entity';
import { Like } from './tweet-like.entity';

@Tree('materialized-path')
@Entity()
export class Tweet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  isComment: boolean;

  @Column({ default: '' })
  text: string;

  @Column('varchar', { array: true, nullable: true })
  imageNames: string[];

  @ManyToOne(() => Profile, (profile) => profile.tweets, {
    onDelete: 'SET NULL',
    nullable: false,
  })
  author: Profile;
  @RelationId('author')
  authorId: string;

  @ManyToOne(() => Profile, (profile) => profile.parentTweets, {
    onDelete: 'SET NULL',
  })
  parentAuthor: Profile;
  @RelationId('parentAuthor')
  parentAuthorId: string;

  @OneToMany(() => Like, (like) => like.tweet, {
    // cascade: true,
    eager: true,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  likes: Like[];

  @TreeChildren()
  replies: Tweet[];

  @TreeParent({ onDelete: 'SET NULL' })
  parentRecord: Tweet;
  @RelationId('parentRecord')
  parentRecordId: string;

  @CreateDateColumn({
    type: 'timestamp',
    precision: 3,
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    precision: 3,
    default: () => 'CURRENT_TIMESTAMP(6)',
    // onUpdate: 'CURRENT_TIMESTAMP(6)',
  })
  updatedAt: Date;
}
