FROM node:22-alpine

RUN addgroup -S hardness && adduser -S hardness -G hardness

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

COPY . .

RUN chown -R hardness:hardness /app
USER hardness

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
