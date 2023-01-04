module.exports = app => {
    const passport = require('passport');
    const Manager = app.db.models.Manager;

    //Continua si no esta autenticado
    function isNotAuthenticated(req, res, next) {
        if (!req.isAuthenticated()) {
            return next();
        }
        res.redirect('/dashboard');
    };

    //Formulario de inicio de sesión --- Inserción de usuario administrador automática
    app.get('/', isNotAuthenticated, async (req, res) => {
        try {
            let count = await Manager.count(); //Busca si hay usuarios registrados
            if (count == 0) {
                res.redirect('/signup'); //Si no hay redirecciona al registro
            } else {
                res.render('index'); //Si no, continua al inicio de sesion
            }
        } catch (error) {
            res.status(412).json({ msg: error.message });
        }
    });

    //Post para iniciar sesión
    app.route('/signin')
        .get(isNotAuthenticated, (req, res, next) => {
            res.redirect('/');
        })
        .post(passport.authenticate('local-signin', {
            successRedirect: '/dashboard',
            failureRedirect: '/',
            passReqToCallback: true
        }));


    //Post para Registro
    app.route('/signup')
        .get(isNotAuthenticated, async (req, res, next) => {
            try {
                let count = await Manager.count();
                if (count == 0) {
                    res.render('signup');
                } else {
                    res.redirect('/');
                }
            } catch (error) {
                res.status(412).json({ msg: error.message });
            }
        })
        .post(passport.authenticate('local-signup', {
            successRedirect: '/dashboard',
            failureRedirect: '/signup',
            passReqToCallback: true
        }));
};