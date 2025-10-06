FROM node:20-alpine

# Accept build arguments for Next.js public env vars
ARG NEXT_PUBLIC_BACKEND_URL
ENV NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

# Build the application with the environment variable
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
