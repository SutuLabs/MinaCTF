FROM node:16-alpine

WORKDIR /usr/app

COPY package.json ./
COPY package-lock.json ./

RUN npm ci

COPY ./ ./

CMD [ "npx", "-p", "ts-node", "ts-node", "server/server.ts" ]