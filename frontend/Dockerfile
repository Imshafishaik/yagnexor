FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY src ./src
COPY index.html .
COPY vite.config.js .
COPY tailwind.config.js .
COPY postcss.config.js .

RUN npm run build

EXPOSE 5173

CMD ["npm", "run", "preview"]
