FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
# install all deps so dev scripts (tsx) are available
RUN npm ci
COPY . .
ENV NODE_ENV=development
EXPOSE 5000
CMD ["npm", "run", "dev"]
