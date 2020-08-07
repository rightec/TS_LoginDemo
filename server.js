/**Verifico se sono in produzione oppure NO
 * In produzione potrei ricevere questo tipo di warning:
 * --------------------------------------------------------------------------------------
 * Warning: connect.session() MemoryStore is not designed for a production environment, 
 * as it will leak memory, and will not scale past a single process
 * --------------------------------------------------------------------------------------
 * Il warning è relativo alla mancata gestione dell'archivazione della sessione di sicurezza
 * come viene desritto qui:
 * 
 * " It's all about storing sessions, you should add a storing system that store sessions into your database. 
 * This help your app to manage sessions." 
 * 
 * La variabile process è una variabile globale messa a disposizione di NODE JS
 * Tramite l'oggetto env riesco ad accedere alla variabili di environment
 * nel file .env della cartella di progetto
 * NODE_ENV è un nome convenzionale che si da a questa variabile. NODE_ENV va comunque definito
 * 
 * Per utilizzare le variabili di ambiente, deve avere installato il modulo dotenv: npm install dotenv
 * Per usare le variabili d'ambiente devo però richiamarle e questo viene fatto a run time da
 * require('dotenv').config(); 
 * 
 * L'alternativa è utilizzare una preload: node -r dotenv/config server.js
 * server.js è designato come essere il primo file da eseguire poichè è configurato: 
 *  "devStart": "nodemon server.js" 
 * nel file package.json. 
 * per questa ragione all'esecuzione di npm run devstart viene lanciato il file server.js
 * 
 * Se usiamo quindi:
 * "devStart": "nodemon -r dotenv/config server.js"
 * possiamo fare a meno della require('dotenv').config();
 * 
 */

 //require('dotenv').config();  //Non usata. L'uso delle var di ambiente è dichiarato in package.json in fase di preload 
console.log(process.env.NODE_ENV); //Se undefined significa che il preload non c'è o non ha funzionato
if (process.env.NODE_ENV !== 'production'){
    console.log("We are not in production");
}else{
    console.log("We are in production");
}

/*Inizializzazione e dichiarazione variabili
Con la variabile costante express vado a indicare che richiedo
un oggetto di tipo express.
Da questo oggetto creo un secondo oggetto di tipo application
chiamato app
*/
const express = require('express');
const app = express();
//Accesso alla librerie flash
const flash = require('express-flash');
const session = require('express-session');

//Accesso all'oggetto bcrypt
const bcrypt = require('bcrypt');

//Accesso alla libreria passport
const passport = require('passport');

//Acceso alla libreria method-override
const methodOverride = require('method-override');

//Accesso all'oggetto creato dal file js passport-config

const initializePassport = require('./passport-config')
initializePassport(
    passport,
    email  => users.find(user => user.email === email),
    id  => users.find(user => user.id === id)
);


    
    
/**
 * per il demo utilizzo un array piuttosto che un database
 * Per utilizzare il database esiste un altro tutorial
 * 
 */
const users = [];

/*Con questo settaggio dico che il motore di visualizzazione
usa i file di tipo ejs
Questo è possibile perché nelle dipendenze create prima
abbimao inserito ejs
------ estratto da package.json
"dependencies": {
    "ejs"
------
*/

app.set('view-engine','ejs');

/**
 * Vogliamo dire al server che tramite l'oggetto
 * express vogliamo usare i dati che ci vengono
 * spediti tramite la POST e che sono encoded nella URL
 */
app.use(express.urlencoded({extended: false}));

//Il server usa le librerie flash
app.use(flash());

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false 
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(methodOverride('_method'));

app.use( express.static( "public" ) );

/*Quando mi viene richiesta la Home Page (root) il server risponde
Con la renderizzazione della risorsa ejs.
La risorsa ejs è un file simil HTML . In questo caso reindirizzo alla
pagina profilo se l'autenticazione è stata fatta
*/
app.get(process.env.WEB_HOME_PAGE, checkAuthenticated ,(req, res) => {
    console.log("Session messages",req.session.messages);
    req.session.messages = []; 
    //console.log("Request HOME and Rendering profile");
    //res.render('profile.ejs', {name: req.user.name});
    console.log("Request HOME and Redirect profile");
    res.redirect(process.env.WEB_PROFILE_PAGE);
});

/**
 * Equivalentemente renderizzo le altre risorse web
 * login e register
 */
app.get(process.env.WEB_LOGIN_PAGE, checkNotAuthenticated, (req, res) => {
    console.log("Session messages",req.session.messages);
    console.log("Request login and Rendering login");
    req.session.messages = []; //Clear the session messages (evitare la concatenazione)
    res.render('loginh.ejs');
});

/**
 * Nella post utilzzo il modulo passport
 */
app.post(process.env.WEB_LOGIN_PAGE, checkNotAuthenticated, passport.authenticate('local',{
    successRedirect: process.env.WEB_PROFILE_PAGE,
    failureRedirect: process.env.WEB_LOGIN_PAGE,
    successMessage: "POST SUCCESS",
    failureMessage: "POST LOGIN FAILED",
    failureFlash: true
}));

/**
 * Voglio che il server mi restituisca la pagina del profile
 * Solo se autneticata
 */
app.get(process.env.WEB_PROFILE_PAGE, checkAuthenticated, (req, res) => {
    console.log("Requested and rendered the profile page");
    res.render('profile.ejs');
});



app.get(process.env.WEB_REG_PAGE, checkNotAuthenticated, (req, res) => {
    console.log("Requested and rendered the register page");
    res.render('register.ejs');
});

/**
 * Poichè inserisco la crittografia rendo
 * questa gestione asincrona. Utilizzo quindi un
 * costrutto try catch
 */

app.post(process.env.WEB_REG_PAGE, checkNotAuthenticated, async (req, res) => {
    try {
        //definisco una variabile chiave di hash
        //per la password
        const hasedPassword = await bcrypt.hash(req.body.password,10);
        //Riempio quindi l'array
        users.push({
            id: Date.now().toString(),
            name: req.body.name,
            email: req.body.email,
            password: hasedPassword
        });
        console.log("POST register done, REDIRECT to Login page");
        res.redirect(process.env.WEB_LOGIN_PAGE);
    } catch {
        console.log("Catch error in POST reg page, REDIRECT to REG page");
        res.redirect(process.env.WEB_REG_PAGE);
    }
});

/**
 * Occorre anche pensare al log out 
 */
app.delete('/logout', (req,res) => {
    console.log("DELETE logOut request, REDIRECT to Login page");
    req.logOut();
    res.redirect(process.env.WEB_LOGIN_PAGE);
});

//Creo una middleware function per supportare la navigazione
function checkAuthenticated(req,res,next){
    if (req.isAuthenticated()){
        console.log("checkAuthenticated return next");
        return next();
    }
    console.log("checkAuthenticated redirect to login");
    res.redirect(process.env.WEB_LOGIN_PAGE);
}

function checkNotAuthenticated(req,res,next) {
    if (req.isAuthenticated()){
        console.log("checkNotAuthenticated redirect to Home page");
        return res.redirect(process.env.WEB_HOME_PAGE);
    }
    console.log("checkNotAuthenticated  next");
    next();
}

app.listen(3000); //L'applicazione va in ascolto sulla porta 3000

