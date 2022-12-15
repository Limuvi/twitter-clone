import {
  CacheModule,
  Logger,
  MiddlewareConsumer,
  Module,
  NestModule,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';

import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { AuthMiddleware } from './common/middlewares';
import { JwtModule } from '@nestjs/jwt';
import { RedisModule } from './redis/redis.module';
import { redisConfig } from './redis/redis.config';
import { MailModule } from './mail/mail.module';
import { TweetModule } from './tweet/tweet.module';
import { ProfileModule } from './profile/profile.module';
import { Tweet } from './tweet/entities/tweet.entity';
import { Profile } from './profile/entities/profile.entity';
import { User } from './user/entities/user.entity';
import { Like } from './tweet/entities/tweet-like.entity';
import { FileModule } from './file/file.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { Following } from './profile/entities/following.entity';
import './common/polyfills';
import { Bookmark } from './tweet/entities/tweet-bookmark.entity';
import { Message } from './chat/entities/message.entity';
import { Chat } from './chat/entities/chat.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: `.env.${process.env.NODE_ENV}.local`,
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.POSTGRES_HOST,
      port: Number(process.env.POSTGRES_PORT),
      username: process.env.POSTGRES_USERNAME,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DATABASE,
      entities: [
        Bookmark,
        Like,
        Tweet,
        Profile,
        Following,
        User,
        Message,
        Chat,
      ],
      autoLoadEntities: true,
      synchronize: true,
      logging: ['error'],
      // logging: ['query', 'error'],
    }),
    RedisModule.registerAsync(redisConfig),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_TOKEN_SECRET'),
      }),
      inject: [ConfigService],
    }),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>('SMTP_HOST'),
          auth: {
            user: configService.get<string>('SMTP_EMAIL'),
            pass: configService.get<string>('SMTP_PASSWORD'),
          },
        },
        defaults: {
          from: '"Twitter clone" <modules@nestjs.com>',
        },
        template: {
          dir: __dirname + '\\mail\\templates',
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
      inject: [ConfigService],
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', process.env.STATIC_FILES_FOLDER_NAME),
      serveRoot: '/files',
    }),
    UserModule,
    AuthModule,
    MailModule,
    TweetModule,
    ProfileModule,
    FileModule,
  ],
  exports: [JwtModule],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes('*');
  }
}
