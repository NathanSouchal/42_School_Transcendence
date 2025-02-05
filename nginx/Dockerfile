FROM nginx:latest

# Installer mkcert (sans sudo)
RUN apt-get update && apt-get install -y libnss3-tools curl && \
    curl -L https://github.com/FiloSottile/mkcert/releases/download/v1.4.4/mkcert-v1.4.4-linux-amd64 -o /usr/local/bin/mkcert && \
    chmod +x /usr/local/bin/mkcert && \
    mkcert -install

# Créer un répertoire pour les certificats
RUN mkdir -p /etc/nginx/certs

# Générer les certificats pour localhost directement dans le conteneur
RUN mkcert -key-file /etc/nginx/certs/selfsigned.key -cert-file /etc/nginx/certs/selfsigned.crt localhost

# Copier la configuration Nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Exposer les ports HTTP et HTTPS
EXPOSE 80 443
