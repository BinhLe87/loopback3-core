FROM node:9.11.2

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Bundle app source
COPY . /usr/src/app

RUN npm install

EXPOSE 8080 3000

#Print node version
CMD ["node", "-v"]

CMD [ "npm", "start" ]

#WORKDIR /usr/src/app/client
#RUN npm install
#CMD [ "npm", "start" ]


#Test CI
