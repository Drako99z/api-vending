module.exports = app => {
    const Perfiles = app.db.models.Perfil;

    //Continua si esta autenticado
    function isAuthenticated(req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        }
        res.redirect('/');
    };

    app.route('/addProfile')
        .post(isAuthenticated, (req, res) => {
            Perfiles.create(req.body)
                .then(result => {
                    req.flash('configMessage', 'Perfil guardado exitosamente');
                    res.redirect('/config');
                })
                .catch(error => {
                    req.flash('configErrorMessage', 'Ha ocurrido un error en el servidor: ' + error.message);
                    res.redirect('/config');
                });
        });

    app.route('/change-profile-status/:id')
        .get(isAuthenticated, (req, res) => {
            Perfiles.findOne({ where: req.params })
                .then(result => {
                    if (result) {
                        Perfiles.update({ status: !result.status }, { where: req.params })
                            .then(result => {
                                req.flash('configMessage', 'Perfil actualizado exitosamente');
                                res.redirect('/config');
                            })
                            .catch(error => {
                                req.flash('configErrorMessage', 'Ha ocurrido un error en el servidor: ' + error.message);
                                res.redirect('/config');
                            });
                    }
                })
                .catch(error => {
                    req.flash('configErrorMessage', 'Ha ocurrido un error en el servidor: ' + error.message);
                    res.redirect('/config');
                });
        });

};