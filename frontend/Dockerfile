# Utilise une image officielle Node.js
FROM node:20

# Définit le dossier de travail
WORKDIR /app

# Copie uniquement les fichiers de dépendances pour optimiser le cache
COPY package.json package-lock.json ./

# Installation des dépendances
RUN npm install

# Monte le projet avec Docker volume pour éviter de copier les fichiers à chaque build
VOLUME /app

# Expose le port de Vite.js
EXPOSE 3000

# Lance Vite en mode développement avec HMR (Hot Module Reload)
CMD ["npm", "run", "dev"]
