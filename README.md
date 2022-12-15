chat app: https://github.com/Limuvi/twitter-chat
## Installation

```bash
$ npm install
```

## Adding Custom Environment Variables
Create ```.env.development.local``` file with following variables:
```bash
PORT= #app port

POSTGRES_HOST=
POSTGRES_USERNAME=
POSTGRES_DATABASE=
POSTGRES_PASSWORD=
POSTGRES_PORT=

REDIS_PORT=
REDIS_HOST=

STATIC_FILES_FOLDER_NAME=

JWT_ACCESS_TOKEN_SECRET=
JWT_ACCESS_TOKEN_EXPIRATION_TIME=     #time in seconds
REFRESH_TOKEN_EXPIRATION_TIME=        #time in seconds
MAX_SESSIONS_COUNT=

COOKIE_SECRET=
PASSWORD_PRIVATE_KEY=

# how to set up gmail as smtp server: https://support.google.com/accounts/answer/185833?hl=en
SMTP_HOST=smtp.googlemail.com         #if you use gmail
SMTP_EMAIL=                           #your email
SMTP_PASSWORD=                        #your generated password 
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```
