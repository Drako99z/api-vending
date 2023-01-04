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
            if (req.body.profile != "" && req.body.price != "") {
                Perfiles.create(req.body)
                    .then(result => {
                        req.flash('configMessage', 'Perfil guardado exitosamente');
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

    app.route('/edit-profile/:id')
        .get(isAuthenticated, async (req, res) => {
            let perfil = await Perfiles.findOne({ where: req.params });
            if(perfil != null){
                res.render('edit-profile', { perfil });
            }else{
                res.redirect('/config');
            }
        })
        .post(isAuthenticated, async (req, res) => {
            let profile, price, status;
            profile = req.body.profile;
            price = req.body.price;
            status = Boolean(req.body.status);
            if (profile != "" && price != "") {
                try{
                    let actualizado = await Perfiles.update({status: status, profile: profile, price: price}, {where: req.params})
                    if(actualizado > 0){
                        req.flash('configMessage', 'Perfil actualizado correctamente');
                    }else{
                        req.flash('configMessage', 'Ningún perfil actualizado');
                    }
                    res.redirect('/config');
                }catch(error){
                    req.flash('configErrorMessage', 'Ha ocurrido un error en el servidor: ' + error.message);
                    res.redirect('/edit-profile/' + req.params.id);
                }
            }else{
                req.flash('configErrorMessage', 'Uno o más campos se encuentran vacíos');
                res.redirect('/edit-profile/' + req.params.id);
            }
        });

    app.route('/delete-profile/:id')
        .get(isAuthenticated, async (req, res) => {
            try {
                let eliminados = await Perfiles.destroy({ where: req.params });
                if (eliminados > 0) {
                    req.flash('configMessage', 'Perfil eliminado exitosamente');
                    res.redirect('/config');
                } else {
                    req.flash('configMessage', 'Ningún perfil eliminado');
                    res.redirect('/config');
                }
            } catch (error) {
                req.flash('configErrorMessage', 'Ha ocurrido un error en el servidor: ' + error.message);
                res.redirect('/config');
            }
        });

};