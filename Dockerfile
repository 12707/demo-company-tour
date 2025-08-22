FROM node:24.6.0
WORKDIR /app
COPY index.html .
COPY package.json .
COPY package-lock.json .
COPY tsconfig.json .
COPY src/ ./src/
COPY public/ ./public/
RUN npm i && npm run build
# RUN npm run build
ENTRYPOINT ["npm", "run", "start"]

