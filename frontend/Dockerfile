FROM node:20

WORKDIR /app

COPY package.json ./

RUN npm install

VOLUME /app

EXPOSE 3000

CMD ["npm", "run", "dev"]
