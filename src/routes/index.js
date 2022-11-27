module.exports = app => {
    const passport = require('passport');
    const Manager = app.db.models.Manager;

    const ManagerProfile = {
        user: "test.manager@api.com",
        password: "test"
    }

    //Continua si no esta autenticado
    function isNotAuthenticated(req, res, next) {
        if (!req.isAuthenticated()) {
            return next();
        }
        res.redirect('/dashboard');
    };

    //Formulario de inicio de sesión --- Inserción de usuario administrador automática
    app.get('/', isNotAuthenticated, (req, res) => {
        Manager.count()
            .then(result => {
                if (result <= 0) {
                    Manager.create({
                        "user": ManagerProfile.user,
                        "password": Manager.encryptPassword(ManagerProfile.password)
                    })
                        .then(result => res.render('index'))
                        .catch(error => {
                            console.log(error);
                        });
                } else {
                    res.render('index');
                }
            })
            .catch(error => {
                res.status(412).json({ msg: error.message });
            });
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


    //Registro - No utilizado
    // app.route('/signup')
    //     .get((req, res, next) => {
    //         res.render('index');
    //     })
    //     .post(passport.authenticate('local-signup', {
    //         successRedirect: '/dashboard',
    //         failureRedirect: '/signup',
    //         passReqToCallback: true
    //     }));
};