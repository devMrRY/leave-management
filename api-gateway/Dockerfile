FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
# install dependencies (including dev deps needed for build)
RUN npm ci
COPY . .

# Build TypeScript into `dist/` during image build so `dist/` exists in image
# Use npm script `build`.
RUN npm run build

# Run production start (uses built `dist/app.js`)
CMD ["npm", "start"]