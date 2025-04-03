FROM node:18 AS builder
WORKDIR /app
COPY frontend/ .
RUN npm install
RUN npm run build

FROM nginx:latest
RUN apt-get update && apt-get install -y libnss3-tools curl && \
    curl -L https://github.com/FiloSottile/mkcert/releases/download/v1.4.4/mkcert-v1.4.4-linux-amd64 -o /usr/local/bin/mkcert && \
    chmod +x /usr/local/bin/mkcert && \
    mkcert -install

RUN mkdir -p /etc/nginx/certs

RUN mkcert -key-file /etc/nginx/certs/selfsigned.key -cert-file /etc/nginx/certs/selfsigned.crt localhost

COPY nginx/confProd/nginx.conf /etc/nginx/nginx.conf

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80 443
CMD ["nginx", "-g", "daemon off;"]
