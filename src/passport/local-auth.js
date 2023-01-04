module.exports = app => {
    const passport = require('passport');
    const Manager = app.db.models.Manager;

    passport.serializeUser((Manager, done) => {
        done(null, Manager.id)
    });

    passport.deserializeUser((id, done) => {
        Manager.findOne({ where: id })
            .then(result => done(null, result))
            .catch(error => {
                console.log(error.message);
            });
    });

    const LocalStrategy = require('passport-local').Strategy;

    passport.use('local-signup', new LocalStrategy({
        usernameField: 'user',
        passwordField: 'password',
        passReqToCallback: true
    }, async (req, user, password, done) => {
        let passwordConfirm = req.body.passwordConfirm;
        if (password == passwordConfirm) {
            try {
                let count = await Manager.count();
                if (count == 0) {
                    Manager.findOne({ where: { "user": user } }).then(result => {
                        if (result) {
                            return done(null, false, req.flash('signupMessage', 'El usuario ya se encuentra registrado'));
                        }
                        Manager.create({
                            "user": user,
                            "password": Manager.encryptPassword(password)
                        })
                            .then(result => done(null, result))
                            .catch(error => {
                                console.log(error);
                            });
                    });
                }else{
                    return done(null, false, req.flash('signupMessage', "Solo se permite un usuario administrador"));
                }
            } catch (error) {
                return done(null, false, req.flash('signupMessage', "Error en el servidor: " + error.message));
            }
        } else {
            return done(null, false, req.flash('signupMessage', 'La confirmación de contraseña no coincide'));
        }

    }));

    passport.use('local-signin', new LocalStrategy({
        usernameField: 'user',
        passwordField: 'password',
        passReqToCallback: true
    }, (req, user, password, done) => {
        Manager.findOne({ where: { "user": user } }).then(result => {
            if (!result) {
                return done(null, false, req.flash('signinMessage', 'Usuario no encontrado'));
            }
            if (!result.validPassword(password)) {
                return done(null, false, req.flash('signinMessage', 'Contraseña incorrecta'));
            }
            done(null, result);
        }).catch(error => {
            console.log(error);
        });
    }));
}