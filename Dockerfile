FROM node:boron

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Bundle app source
COPY . /usr/src/app

RUN npm install

EXPOSE 8080

#Print node version
CMD ["node", "-v"]

CMD [ "npm", "start" ]

#Test CI
