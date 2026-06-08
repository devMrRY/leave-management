FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
# install all deps so dev scripts (tsx) are available
RUN npm ci
COPY . .

# Build TypeScript into dist during image build
RUN npm run build

# Run production start (uses built `dist/app.js`)
CMD ["npm", "start"]
