FROM keymetrics/pm2:latest
# FROM node:latest
WORKDIR /usr/local/src
COPY package*.json ./
COPY ecosystem.config.js .
COPY . .
RUN npm install
EXPOSE 9090
CMD [ "pm2-runtime", "start", "ecosystem.config.js"]
# CMD ["npm", "start"]

