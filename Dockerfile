# Create a Nodejs environemt with version 16.13.2 and start a server
FROM node:16.13.2

WORKDIR /app
COPY code/yarn.lock .
COPY code/package.json .
COPY code/package-lock.json .

RUN npm install

COPY ./code .

CMD ["npm", "start"]

