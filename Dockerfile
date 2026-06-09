FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY server/package*.json ./server/
COPY client-frontend/package*.json ./client-frontend/
COPY barber-frontend/package*.json ./barber-frontend/

RUN npm ci
RUN npm ci --prefix server
RUN npm ci --prefix client-frontend
RUN npm ci --prefix barber-frontend

COPY . .

RUN npm run build 

ENV NODE_ENV=production
ENV PORT=5001

EXPOSE 5001
CMD ["npm", "start"]
