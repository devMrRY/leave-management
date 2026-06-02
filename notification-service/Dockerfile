# Use official Node.js LTS image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the source code
COPY . .

ENV NODE_ENV=development

# Expose port (change if your service uses a different port)
EXPOSE 7000

# Start the service
CMD ["npm", "run", "dev"]
