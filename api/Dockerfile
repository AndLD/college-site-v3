FROM node:16.13.1

WORKDIR /app

COPY package*.json /app/

RUN npm install

ENV NODE_ENV=production

COPY . .

RUN npm run build

EXPOSE 8080

CMD ["npm", "run", "prod"]