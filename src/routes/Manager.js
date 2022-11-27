module.exports = app => {
    const passport = require('passport');
    const Manager = app.db.models.Manager;

    //Continua si esta autenticado
    function isAuthenticated(req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        }
        res.redirect('/');
    };

    //Cerrar Sesión Usuario
    app.route('/logout')
        .get((req, res, next) => {
            req.logout((err) => {
                if (err) return next(err);
                res.redirect("/");
            });
        });

    //Cambiar Nombre de Usuario
    app.route('/change-user')
        .post(isAuthenticated, (req, res, next) => {
            if (req.body.user != "") {
                Manager.update(req.body, { where: { "id": app.locals.user.id } })
                    .then(result => {
                        req.flash('configMessage', 'Usuario actualizado exitosamente');
                        res.redirect('/config');
                    })
                    .catch(error => {
                        req.flash('configErrorMessage', 'Ha ocurrido un error: ' + error.message);
                        res.redirect('/config');
                    });
            } else {
                req.flash('configErrorMessage', 'Uno o más campos se encuentran vacíos');
                res.redirect('/config');
            }
        });

    //Cambiar Contraseña
    app.route('/change-password')
        .post(isAuthenticated, (req, res, next) => {
            if (req.body.newPassword != "") {
                if (req.body.newPassword != req.body.newPasswordConfirm) {
                    req.flash('configErrorMessage', 'La confirmación de la contraseña no coincide');
                    res.redirect('/config');
                } else {
                    if (!app.locals.user.validPassword(req.body.password)) {
                        req.flash('configErrorMessage', 'Contraseña incorrecta');
                        res.redirect('/config');
                    } else {
                        Manager.update({ password: Manager.encryptPassword(req.body.newPassword) }, { where: { "id": app.locals.user.id } })
                            .then(result => {
                                req.flash('configMessage', 'Contraseña cambiada exitosamente');
                                res.redirect('/config');
                            })
                            .catch(error => {
                                req.flash('configErrorMessage', 'Ha ocurrido un error: ' + error.message);
                                res.redirect('/config');
                            });
                    }
                }
            } else {
                req.flash('configErrorMessage', 'Uno o más campos se encuentran vacíos');
                res.redirect('/config');
            }
        });

    //Pagina dashboard
    app.route('/dashboard')
        .get(isAuthenticated, (req, res, next) => {
            res.render('dashboard');
        });

    //Pagina de configuracion
    app.route('/config')
        .get(isAuthenticated, (req, res, next) => {
            const Keys = app.db.models.ApiKey;
            Keys.findAll()
                .then(result => res.render('config', { results: result }))
                .catch(error => {
                    res.status(412).json({ msg: error.message });
                });
        });



    //Usar restriccion en varias rutas
    // app.use((req, res, next) => {
    //     isAuthenticated(req, res, next);
    //     next();
    // });

};