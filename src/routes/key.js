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
            Keys.create({ "key": key })
                .then(result => {
                    req.flash('configMessage', 'Key generada exitosamente');
                    res.redirect('/config');
                })
                .catch(error => {
                    req.flash('configErrorMessage', 'Ha ocurrido un error en el servidor: ' + error.message);
                    res.redirect('/config');
                });
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

};