import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
} from 'typeorm';
import { Profile } from '../../profile/entities/profile.entity';
import { Tweet } from './tweet.entity';

@Entity()
@Index(['tweetId', 'profileId'], { unique: true })
export class Bookmark {
  @PrimaryGeneratedColumn()
  id: number;

  @RelationId('tweet')
  @Column()
  tweetId: string;

  @RelationId('profile')
  @Column()
  profileId: string;

  @CreateDateColumn({
    type: 'timestamp',
    // precision: 3,
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  createdAt: Date;

  @ManyToOne(() => Tweet, (tweet) => tweet.bookmarks, {
    eager: true,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  tweet: Tweet;

  @ManyToOne(() => Profile, (profile) => profile.bookmarkRecords, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  profile: Profile;
}
