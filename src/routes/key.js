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
                    console.log({ msg: error.message });
                    res.status(412).req.flash('configErrorMessage', 'Ha ocurrido un error en el servidor');
                });
        });

    app.route('/change-status/:id')
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
                                console.log({ msg: error.message });
                                res.status(412).req.flash('configErrorMessage', 'Ha ocurrido un error en el servidor');
                            });
                    }
                })
                .catch(error => {
                    console.log({ msg: error.message });
                    res.status(412).req.flash('configErrorMessage', 'Ha ocurrido un error en el servidor');
                });
        });

};