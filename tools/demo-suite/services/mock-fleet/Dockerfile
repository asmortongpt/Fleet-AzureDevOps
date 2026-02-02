FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --omit=dev || npm install
COPY . .
EXPOSE 4020
CMD ["npm","run","start"]
