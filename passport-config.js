/**
 * File creato per non mettere tutto nel file server.js
 */
// qui associo la libreria passport-local alla variabile LocalStartgey
const LocalStrategy = require('passport-local').Strategy;

//Anche in questo caso ho necessita di decrittare la password
const bcrypt = require('bcrypt');
//const { Passport } = require('passport');


//const { use } = require('passport');

function initialize(passport,getUserByEmail,getUserById){
    //definisco una funzione authenticateUser
    //Questa funzione accetta come parameteri la email la password ed una funzione choamata done
    const authenticateUser = async (email, password, done) =>{
        console.log("Email is ", email );
        console.log("Password is ", password );
        //Questa funziona per prima cosa deve restituirmi uno user
        const user = getUserByEmail(email);
        console.log ("user is", user);
        //Mi crea lo user a partire dalla email
        if (user == null){
            //Lo user non è stato trovato - vado a restiture la funzione done
            return done(null, false, {message: 'No user with that email'});
        }
        //Poi controllo la password che è da decrittare
        
        try {
            //await si può inserire se la function è definita async
            if (await bcrypt.compare(password, user.password)){
                return done(null, user);
            }else{
                return done(null, false, {message: 'Password incorrect'});
            }
        } catch (e) {
            done(e);
        }
        
    }

    //La variabile che passo alla funzione viene usata per creare
    //Una strategia di autenticazione locale    
    passport.use(new LocalStrategy({usernameField: 'email'},
    authenticateUser)); 
    //La stratgeia è relativa al campo email ed usa la funzione authenticateUser 
    passport.serializeUser((user,done) => done(null,user.id));
    passport.deserializeUser((id,done) => {
        return done(null,getUserById(id));
    });
}

/**
 * RIGUARDO LA SERIALIZZAZIONE:
 * In a typical web application, the credentials used to authenticate a user 
 * will only be transmitted during the login request. 
 * If authentication succeeds, a session will be established and maintained 
 * via a cookie set in the user's browser.
 * 
 * Each subsequent request will not contain credentials, but rather 
 * the unique cookie that identifies the session. 
 * In order to support login sessions, Passport will serialize and 
 * deserialize user instances to and from the session.
 */

module.exports = initialize;