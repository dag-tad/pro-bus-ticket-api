FROM node:18-alpine AS development

WORKDIR /usr/src/app

COPY package*.json ./
COPY yarn.lock* ./

RUN npm ci

COPY . .

EXPOSE 3000

CMD ["npm", "run", "start:dev"]
