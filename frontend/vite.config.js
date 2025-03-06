import { defineConfig } from "vite";
// import fs from "fs";

// MODE DEV
export default defineConfig({
  server: {
    port: 3000,
    host: "0.0.0.0",
    strictPort: true,
    // On fait tourner Vite en HTTP
    // et on configure HMR pour qu'il utilise wss via Nginx sur le port 8443
    hmr: {
      protocol: 'wss',
      host: 'localhost',
      port: 8443,
    },
  },
  build: {
    target: "esnext",
  },
  envDir: '/home/nsouchal/PROJECTS/transcendence/.env',
});


// MODE PROD
// export default defineConfig({
//   server: {
//     historyApiFallback: true,
//     /*
//     ➡ Permet aux routes frontend de fonctionner correctement avec le mode SPA (Single Page Application).

//       Lorsqu'une URL est directement accédée dans le navigateur, Vite redirige automatiquement vers index.html.
//       Exemple :
//       Si un utilisateur visite https://localhost:3000/game, Vite servira index.html au lieu d'afficher une erreur 404.
//       Ensuite, le routing frontend prend le relais (react-router, vue-router, ou du vanilla JS comme ton projet).
//       ✅ Important pour éviter les erreurs 404 sur les routes frontend.
//     */

//     port: 3000,
//     /*
//     ➡ Spécifie que le serveur de développement Vite doit écouter sur le port 3000.

//       Sans cette ligne, Vite choisit automatiquement un port disponible (ex: 5173, 8080, etc.).
//       Tu forces ici le port 3000 pour uniformiser l'accès.
//     */

//     host: true,
//     /*
//     ➡ Permet à Vite d'écouter sur 0.0.0.0 au lieu de localhost uniquement.

//     Par défaut, Vite écoute sur localhost : cela signifie que seul ton ordinateur peut accéder au serveur.
//     Avec host: true, le serveur est accessible depuis d'autres machines sur le réseau.
//     Ex: si ton PC est à 192.168.1.10, ton smartphone pourra accéder à http://192.168.1.10:3000.
//     ✅ Utilisé dans les environnements Docker pour rendre le serveur accessible aux autres conteneurs.
//     */

//     strictPort: true,
//     /*
//     ➡ Empêche Vite de choisir un autre port si le 3000 est déjà utilisé.

//     Par défaut, si le port 3000 est occupé, Vite choisira un autre port (ex: 3001, 3002, etc.).
//     Avec strictPort: true, Vite va refuser de démarrer si le port 3000 est pris.
//     ✅ Permet d'assurer que ton frontend fonctionne toujours sur le même port, ce qui est utile en Docker.
//     */

//     https: false,  // ✅ Désactive HTTPS (Nginx gérera SSL)
//   },
//   build: {
//     target: "esnext"    // On utilise esbuild en prod et il faut preciser la versione la plus recente pour 
//                         // qu'on puisse utiliser top-level await (utilisation d'un await en dehors d'une fonctione async, necessaire en mode production avec des naviguateurs modernes)
//   }
// });
