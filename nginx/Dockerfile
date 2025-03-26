#  Étape 1 : Build du frontend
FROM node:18 AS builder
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm install
COPY frontend/ .
 # Les fichiers sont générés dans /app/dist
RUN npm run build



# Étape 2 : Serveur Nginx pour le frontend en production
FROM nginx:latest
# Installer mkcert pour HTTPS (si nécessaire)
RUN apt-get update && apt-get install -y libnss3-tools curl && \
    curl -L https://github.com/FiloSottile/mkcert/releases/download/v1.4.4/mkcert-v1.4.4-linux-amd64 -o /usr/local/bin/mkcert && \
    chmod +x /usr/local/bin/mkcert && \
    mkcert -install

# Créer un répertoire pour les certificats
RUN mkdir -p /etc/nginx/certs

# Générer un certificat auto-signé pour HTTPS
RUN mkcert -key-file /etc/nginx/certs/selfsigned.key -cert-file /etc/nginx/certs/selfsigned.crt localhost

# Copier la configuration Nginx
COPY nginx/confProd/nginx.conf /etc/nginx/nginx.conf

# Copier le build frontend depuis le stage builder
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80 443
CMD ["nginx", "-g", "daemon off;"]