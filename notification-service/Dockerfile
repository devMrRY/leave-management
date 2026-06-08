FROM node:18-alpine

WORKDIR /app

# Copy package.json and install deps
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

ENV NODE_ENV=production
EXPOSE 7000
CMD ["npm", "start"]
