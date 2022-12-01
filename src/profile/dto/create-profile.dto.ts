import { Column } from 'typeorm';

export class CreateProfileDto {
  @Column({ unique: true })
  username: string;

  @Column()
  description: string;
}
