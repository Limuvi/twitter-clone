import { Entity, ManyToOne, PrimaryGeneratedColumn, RelationId } from 'typeorm';
import { Profile } from '../../profile/entities/profile.entity';
import { Tweet } from './tweet.entity';

@Entity()
export class Like {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Tweet, (tweet) => tweet.likes, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  tweet: Tweet;
  @RelationId('tweet')
  tweetId: string;

  @ManyToOne(() => Profile, (profile) => profile.likedRecords, {
    eager: true,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  profile: Profile;
  @RelationId('profile')
  profileId: string;
}
