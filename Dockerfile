FROM node:4.2.2-slim

WORKDIR /var/app
COPY package.json /var/app/
RUN npm install --production
COPY ./app /var/app
COPY ./db /var/db
EXPOSE 3000

CMD ["npm", "start"]