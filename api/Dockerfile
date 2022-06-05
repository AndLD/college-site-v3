FROM node:16.13.1

WORKDIR /app

COPY package*.json /app

RUN npm install

COPY . .

RUN npm run build

COPY ./app-settings.json ./ts-built/

EXPOSE 8080

CMD ["npm", "run", "prod"]