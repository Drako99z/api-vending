module.exports = app => {
    const Keys = app.db.models.ApiKey;
    const random = require('string-random');

    //Continua si esta autenticado
    function isAuthenticated(req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        }
        res.redirect('/');
    };

    app.route('/addKey')
        .post(isAuthenticated, (req, res) => {
            var key = random(18);
            var name = req.body.name;
            if (name != "") {
                Keys.create({ "name": name, "key": key })
                    .then(result => {
                        req.flash('configMessage', 'Key generada exitosamente');
                        res.redirect('/config');
                    })
                    .catch(error => {
                        req.flash('configErrorMessage', 'Ha ocurrido un error en el servidor: ' + error.message);
                        res.redirect('/config');
                    });
            } else {
                req.flash('configErrorMessage', 'Uno o más campos se encuentran vacíos');
                res.redirect('/config');
            }
        });

    app.route('/change-key-status/:id')
        .get(isAuthenticated, (req, res) => {
            Keys.findOne({ where: req.params })
                .then(result => {
                    if (result) {
                        Keys.update({ status: !result.status }, { where: req.params })
                            .then(result => {
                                req.flash('configMessage', 'Key actualizada exitosamente');
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

    app.route('/edit-vending/:id')
        .get(isAuthenticated, async (req, res) => {
            let vending = await Keys.findOne({ where: req.params });
            if (vending != null) {
                res.render('edit-vending', { vending });
            } else {
                res.redirect('/config');
            }
        })
        .post(isAuthenticated, async (req, res) => {
            let name, key, status;
            name = req.body.name;
            key = req.body.key;
            status = Boolean(req.body.status);
            if (name != "" && key != "") {
                try {
                    let actualizado = await Keys.update({ status: status, name: name, key: key }, { where: req.params })
                    if (actualizado > 0) {
                        req.flash('configMessage', 'Máquina vending actualizada correctamente');
                    } else {
                        req.flash('configMessage', 'Ninguna máquina vending actualizada');
                    }
                    res.redirect('/config');
                } catch (error) {
                    req.flash('configErrorMessage', 'Ha ocurrido un error en el servidor: ' + error.message);
                    res.redirect('/edit-vending/' + req.params.id);
                }
            } else {
                req.flash('configErrorMessage', 'Uno o más campos se encuentran vacíos');
                res.redirect('/edit-vending/' + req.params.id);
            }
        });

    app.route('/delete-vending/:id')
        .post(isAuthenticated, async (req, res) => {
            try {
                const manager = app.routes.Manager;
                let passwordRoot = req.body.password;
                if (passwordRoot != null && passwordRoot != "" && manager.isRootPassword(passwordRoot)) {
                    let eliminadas = await Keys.destroy({ where: req.params });
                    if (eliminadas > 0) {
                        req.flash('configMessage', 'Máquina vending eliminada exitosamente');
                        res.redirect('/config');
                    } else {
                        req.flash('configMessage', 'Ninguna máquina vending eliminada');
                        res.redirect('/config');
                    }
                } else {
                    req.flash('configErrorMessage', 'No esta autorizado para realizar esta tarea');
                    res.redirect('/config');
                }
            } catch (error) {
                req.flash('configErrorMessage', 'Ha ocurrido un error en el servidor: ' + error.message);
                res.redirect('/config');
            }
        });

};