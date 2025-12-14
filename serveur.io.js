const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const io = new require("socket.io")(server)

// pour le css
app.use(express.static(__dirname));

app.get('/', (request, response) => {
    response.sendFile('client.html', {root: __dirname});
});

server.listen(8888, () => {
    console.log('Le serveur écoute sur le port 8888');
});

var nbJoueurs = 2;
var joueurs = [];
var jeton = -1;
  

/*===============================
Ecouteurs d'événements socket pris du TP2 + rajout de notre part
================================*/

io.on('connection', (socket) => {

    socket.on('joueurs', () => {
        let nomsJoueurs = "";
        for (let nom of joueurs) 
            nomsJoueurs += nom + " ";
        console.log("Envoi des noms de joueurs : " + nomsJoueurs);
        socket.emit('joueurs', nomsJoueurs);
    });

   socket.on('entree', nomJoueur => {
       console.log("Entrée dans la partie de " + nomJoueur);

        // si le nb de joueurs maximal n'est pas encore atteint
        if (joueurs.length < nbJoueurs) 
        {
            // si le joueur n'est pas déjà enregistré càd le meme nom, on le met dans le tableau de joueurs
            if (!joueurs.includes(nomJoueur)) 
            {
                joueurs.push(nomJoueur);
                console.dir(joueurs);

                let nomsJoueurs = "";
                for (let nom of joueurs) nomsJoueurs += nom + " ";
                
                socket.emit('entree', {
                    nomJoueur: nomJoueur,
                    numJoueur: joueurs.length - 1,
                    nomsJoueurs: nomsJoueurs
                });
                socket.broadcast.emit('entreeAutreJoueur', {
                    nomJoueur: nomJoueur,
                    nomsJoueurs: nomsJoueurs
                });

                // si pas assez de joeurs
                const manque = nbJoueurs - joueurs.length;
                io.emit('manqueJoueurs', { manque });
                io.emit('messageServeur', manque > 0 ? `Il manque ${manque} joueur(s) pour commencer la partie` : '');

                // si le nb minimal de joueurs pouvant jouer est atteint, la partie peut commencer
                // chaque joueur ayant un jeton (de façon croissante), ils jouent donc selon un ordre precis : 
                // le premier joueur ayant rejoint a un jeton 0 donc c'est lui qui joue en premier
                // le jeton est incrémenté à chaque fois qu'un joueur rentre

                if (joueurs.length === nbJoueurs) {
                    jeton = 0;
                    console.log("Le jeton passe à 0, la partie peut commencer");
                    io.emit('messageServeur', 'la partie peut commencer');
                    io.emit('tour', { joueurCourant: jeton });
                    io.emit('manqueJoueurs', { manque: 0 });
                }
            } 
            else
                socket.emit('messageServeur', 'Nom de joueur déjà enregistré'); // joueur deja present
        }
        else
            socket.emit('messageServeur', 'Nombre de joueurs déjà atteint !'); 
            // joueurs max atteint càd joueurs.length == nbJoueurs 
    });

    // ecouteur permettant d'ecouter chaque coup des joueurs, donc permet d'établir le tour de rôle
    socket.on('coupJoue', tour => {
        console.log("coupJoue reçu de numJoueur =", tour.numJoueur);

        if (tour.numJoueur === jeton)
        {
            jeton = (jeton + 1) % joueurs.length;
            io.emit('tour', { joueurCourant: jeton });
        } 
        else socket.emit('messageServeur', "Pas ton tour");
    });


    socket.on('sortie', nomJoueur => {
        console.log("Sortie de la partie de "+nomJoueur);
        let index = joueurs.indexOf(nomJoueur)
        if (index != -1)
        {
            joueurs.splice(index, 1);
            jeton = -1;
            let nomsJoueurs = "";
            for (let nom of joueurs) nomsJoueurs += nom+" ";
            socket.emit('sortie', {'nomJoueur':nomJoueur,
                                    'nomsJoueurs':nomsJoueurs});
            socket.broadcast.emit('sortieAutreJoueur',
                                    {'nomJoueur':nomJoueur, // Pour information
                                    'numJoueur': index,
                                    'nomsJoueurs':nomsJoueurs});
            // informer tous les clients du nombre de joueurs manquants après la sortie
            const manque = nbJoueurs - joueurs.length;
            io.emit('manqueJoueurs', { manque });
            io.emit('messageServeur', manque > 0 ? `Il manque ${manque} joueur(s) pour commencer la partie` : '');
        }
        else socket.emit('messageServeur', 'Joueur inconnu');
    });

    socket.on('message', data => {
        console.log("Message à diffuser de [", data.numJoueur, "]:" ,data.texte);
        if (data.numJoueur == -1) 
            socket.emit('messageServeur', 'Vous devez entrer dans la partie !');
        else {
            let message = joueurs[data.numJoueur] + " : " + data.texte;
            console.log("Message à diffuser =>", message)
            io.emit('message', message);
        }
    });

})