FROM node:14.17.0

WORKDIR /app

COPY package.json /app

RUN npm install

COPY . .

RUN npm run tsc

EXPOSE 8080

CMD ["npm", "run", "prod"]