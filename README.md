# ***HAI305I Projet JavaScript 2025-2026***

*Participants au projet :*  
- **`Alice GUY`**, *Groupe C*  
- **`Hantsa RAMEFISON`**, *Groupe C*  

****

## Pour lancer le serveur :

Exécuter :

    npm install

Pour ensuite pouvoir ne faire que (car on a configuré un `package.json`) :

    npm start

au lancement du serveur.

Sinon vous pouvez lancer le serveur comme on a l'habitude de faire :

    node serveur.io.js

## Pour accéder au jeu :

Dans deux navigateurs différents, quand le serveur est lancé, taper :

    http://localhost:8888

Vous aurez alors un visuel du chat, sur les deux fenêtres, sans la bibliothèque car la partie n'a pas encore été lancée.

Le jeu se joue à `deux` (que l'on peut changer dans ***serveur.io.js*** *(var nbJoueurs = 2)* si vous souhaitez, mais pour faciliter le projet, on a choisi 2 joueurs initialement) donc vous avez besoin de rentrer `un nom dans chaque navigateur` pour pouvoir :

- Entrer dans la partie puis  
- Lancer la partie

S'il n'y a qu'un seul joueur qui rentre dans la partie, lance cette partie et veut placer un livre sur les étagères, un message d'erreur s'affichera toujours :

    Soit ce n'est pas votre tour, soit il n'y a pas assez de joueurs (ici 2 !)

Et donc logiquement, si ce n'est pas votre tour, ce message s'affichera aussi.

****

## Brèves explications de `client.html` et `serveur.io.js`

### Gestion de la bibliothèque (côté client)

En premier lieu, nous nous sommes chargés de la gestion de la bibliothèque, c'est-à-dire pouvoir charger les livres du JSON pour pouvoir les placer dans un tableau que l'on a initialisé au début (let livres = []).  
Tout ça grâce à la fonction `chargerLivres()` qui récupère le fichier `livres.json` et stocke les livres en mémoire pour les utiliser ensuite.

Nous avons donc mis en place :

- Le dessin des étagères `dessinerEtageres` et des ancrages `dessinerAncrages` avec d3.js  
- Le dessin de la caisse `dessinerCaisse` qui contient les livres en attente  
- La fonction `remplirCaisse()` qui prend 3 livres aléatoires dans le tableau `livres` et les affiche dans la caisse sous forme de rectangles cliquables  
- La fonction `depoLivre(etagere, indexAncrage)` qui permet, quand c’est le tour du joueur, de déposer un livre sélectionné sur un emplacement libre d’une étagère.

### Gestion des joueurs (client + serveur)

En deuxième lieu, nous nous sommes attaqués à la gestion des joueurs :

- initialisation de `numJoueur` et `joueurCourant` à $-1$ pour pouvoir commencer à $0$ quand un joueur rentre et quand la partie démarre,  
- demande de la liste des joueurs `demandeJoueurs`,  
- entrée du joueur dans la partie, `entrerDansLaPartie` côté client : événement `entree` côté serveur,  
- sortie du joueur de la partie : `quitterLaPartie` côté client, événement `sortie` côté serveur.

Tout ça grâce à `socket.emit` qui fait le lien client <=> serveur pour envoyer des événements nommés avec des données différentes (nomJoueur, numJoueur, liste des joueurs, etc).

Côté serveur `serveur.io.js`, nous gérons :

- le tableau `joueurs` qui contient les noms,  
- la variable `jeton` qui indique à quel joueur c’est de jouer,  
- la limitation à 2 joueurs (`nbJoueurs = 2`),  
- l’envoi des messages `entree`, `entreeAutreJoueur`, `sortie`, `sortieAutreJoueur` et `tour` à tous les clients concernés.

### Gestion du chat

En troisième lieu, nous pouvons voir la gestion du chat. On a deux fonctions principales pour cela :

- `envoiMessage(input)` qui envoie le message au serveur selon le joueur qui a tapé ce message, désigné par son `numJoueur`.  
- `ajouterMessage(message)` permet ensuite de stocker et d'afficher ce message dans la zone de texte, tout en sautant une ligne à chaque nouveau message, et en faisant défiler la zone automatiquement vers le bas (`textarea.scrollTop = textarea.scrollHeight;`) pour voir le dernier message.

Côté serveur, l’écouteur `socket.on('message', data => { ... })` reconstruit le message sous la forme `nomDuJoueur : texte` et le renvoie à tous les clients avec `io.emit('message', message)`.

### Jeu au tour par tour

Le jeu est au tour par tour :

- Côté serveur, l’événement `coupJoue` met à jour la variable `jeton` si le joueur qui a joué est bien celui qui possède le jeton. On passe alors au joueur suivant (`jeton = (jeton + 1) % joueurs.length`) et le serveur envoie l’événement `tour` avec le nouveau `joueurCourant`.  
- Côté client, `joueurCourant` est mis à jour à la réception de `tour`, et `depoLivre` vérifie `if (numJoueur !== joueurCourant)` avant d’autoriser un dépôt de livre.

Si un joueur essaie de jouer alors que ce n’est pas son tour, un message du serveur “Pas ton tour” lui est envoyé via `messageServeur`.

### Visu avec d3.js

La partie visuelle est assurée avec d3.js :

- Les étagères sont représentées par des rectangles horizontaux
- Chaque étagère possède plusieurs ancrages (cercles) qui sont cliquables pour déposer un livre 
- La caisse est aussi un rectangle avec ses propres ancrages
- Les livres sont des rectangles bleus ; lorsqu’on passe la souris dessus, un texte temporaire affiche le titre et le genre du livre 
- Un livre peut être sélectionné pour être ensuite déposé sur une étagère

### Score et classements

Pour la partie score, nous avons deux niveaux :

1. Score local autour du livre posé (`scoreAutourPosition`) :  
   - On regarde les voisins immédiats (gauche et droite) sur l’étagère où le livre vient d’être posé  
   - On ajoute des points si :  
     - le genre est identique,  
     - l’auteur est identique,  
     - la littérature est identique.  

2. Score global par étagère (`score(etagere)` + `scoreTot`) :  
   - On parcourt tous les livres d’une étagère  
   - On compte le nombre de livres par format (`nbformat`) et par genre (`nbGenre`)
   - On ajoute des points si un même format ou un même genre apparaît au moins deux fois sur l’étagère
   - `scoreTot()` additionne les scores de toutes les étagères et affiche le score total dans `scoreJ`

Actuellement, le score affiché est un score global pour la partie, donc pas par joueur, et donc considérons que c'est un jeu de cooperation

---

## Limitations actuelles

- L’ordre alphabétique complet des auteurs sur un rayonnage n’est pas entièrement implémenté : nous utilisons déjà les auteurs pour établir le score mais nous ne trions pas visuellement les livres par ordre alphabétique
- Le score affiché est global et n’est pas encore séparé par joueur (mais la base est là pour l’étendre), comme dit précédemment

---

## Aperçus du projet :

![alt text](img/image.png)  
![alt text](img/image-1.png)  
![alt text](img/image-2.png)  
![alt text](img/image-3.png)
