FROM node:24-bookworm-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY patches/ patches/
RUN npm ci

COPY . .
ENV EXPO_PUBLIC_API_URL=/api
RUN npm run build:pwa

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/ /usr/share/nginx/html/
EXPOSE 80
