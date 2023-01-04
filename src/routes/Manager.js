module.exports = app => {
    const Manager = app.db.models.Manager;
    const Ficha = app.db.models.Ficha;
    const Perfiles = app.db.models.Perfil;
    const Keys = app.db.models.ApiKey;

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

    //Pagina de configuracion
    app.route('/config')
        .get(isAuthenticated, async (req, res, next) => {
            try {
                let keys = await Keys.findAll();
                let profiles = await Perfiles.findAll({ order: [['price', 'ASC']] });
                res.render('config', { keys: keys, profiles: profiles });
            } catch (error) {
                res.status(412).json({ msg: error.message });
            }
        });

    //Pagina dashboard
    app.route('/dashboard')
        .get(isAuthenticated, async (req, res, next) => {
            try {

                //Obtener Parametros
                let page = (isEmptyOrNull(req.query.page) || isNaN(req.query.page)) ? 1 : Number(req.query.page);
                let status = (isEmptyOrNull(req.query.status) || isNaN(req.query.status)) ? 1 : Number(req.query.status);
                let profile = (isEmptyOrNull(req.query.profile)) ? "all" : req.query.profile;
                let vending = (isEmptyOrNull(req.query.vending)) ? "all" : req.query.vending;

                //Obtener clausulas where
                let whereFicha = getWhereFichas(status);
                let whereProfile = getWhereProfiles(profile);
                let whereVending = getWhereVending(status, vending);

                let urlPages = "?status=" + encodeURIComponent(status) + "&profile=" + encodeURIComponent(profile);
                if(status == 0){
                    urlPages += "&vending=" + encodeURIComponent(vending);
                }
                urlPages += "&page=";

                //Parametros de paginacion
                const resultsPerPage = 20;
                let numberOfResults = await Ficha.count({
                    where: whereFicha,
                    include: [{
                        model: Perfiles,
                        where: whereProfile, whereVending
                    }, {
                        model: Keys,
                        where: whereVending
                    }]
                });
                const numberOfPages = Math.ceil(numberOfResults / resultsPerPage);
                if (page > numberOfPages) {
                    page = numberOfPages;
                } else if (page < 1) {
                    page = 1;
                }

                //Determinar el limite inicial de SQL
                let startingLimit = (page - 1) * resultsPerPage;
                if(startingLimit < 0) startingLimit = 0;
                //Obtener el numero de registros para la pagina inicial
                let fichas = await Ficha.findAll({
                    where: whereFicha,
                    offset: startingLimit, limit: resultsPerPage,
                    include: [{
                        model: Perfiles,
                        where: whereProfile, whereVending
                    }, {
                        model: Keys,
                        where: whereVending
                    }]
                });
                let iterator = (page - 5) < 1 ? 1 : page - 5;
                let endingLink = (iterator + 9) <= numberOfPages ? (iterator + 9) : page + (numberOfPages - page);
                if (endingLink < (page + 4) && page >= 10) {
                    iterator -= (page + 4) - numberOfPages;
                }

                //Obtener Estadisticas
                let estadisticas = await getEstadisticasFichas();

                //Obtener Perfiles para el filtrado
                let perfiles = await Perfiles.findAll({ where: { status: 1 }, order: [['price', 'ASC']] });

                //Obtener las máquinas para el filtrado
                let vendings = (status == 0) ? await Keys.findAll({ where: { status: 1 } }) : null;

                //Mostrar pagina
                res.render('dashboard', {
                    fichas: fichas,
                    estadisticas: estadisticas,
                    data: {
                        profile,
                        perfiles,
                        vending,
                        vendings,
                        status,
                    },
                    pagination: {
                        page,
                        iterator,
                        endingLink,
                        numberOfPages,
                        urlPages
                    }
                });
            } catch (error) {
                res.status(412).json({ msg: error.message });
            }
        });

    function isEmptyOrNull(string) {
        if (string == null) {
            return true;
        } else if (string == "") {
            return true;
        }
        return false;
    }

    function getWhereFichas(status) {
        let whereFicha;
        switch (status) {
            case 0:     //Vendidas
                whereFicha = {
                    status: 0
                }
                break;
            case 1:     //Disponibles
                whereFicha = {
                    status: 1
                }
                break;
            case -1:    //Todas
                whereFicha = null;
                break;
            default:    //Todas
                whereFicha = null;
                break;
        }
        return whereFicha;
    }
    function getWhereProfiles(profile) {
        let whereProfile;
        switch (profile) {
            case "all":    //Todos
                whereProfile = {
                    status: 1
                };
                break;
            default:    //El perfil recibido
                whereProfile = {
                    profile: profile,
                    status: 1
                };
                break;
        }
        return whereProfile;
    }

    function getWhereVending(status, vending) {
        let whereVending;
        if(status == 0){
            switch (vending) {
                case "all":    //Todas
                    whereVending = {
                        status: 1
                    };
                    break;
                default:    //La maquina recibida
                    whereVending = {
                        name: vending,
                        status: 1
                    };
                    break;
            }
        }else{
            whereVending = null;
        }
        return whereVending;
    }

    async function getEstadisticasFichas() {
        let perfiles = await Perfiles.findAll({ where: { status: 1 }, order: [['price', 'ASC']] });
        let estadisticas = {};

        let estadisticaPerfil = [];
        let disponiblesPerfil;
        let vendidasPerfil;

        let fichasTotal = 0;
        let vendidasTotal = 0;
        let disponiblesTotal = 0;
        let masVendidaProfile = "No hay suficiente información de ventas";
        let masVendidaAux = -1;

        for (const i in perfiles) {
            //Consultas
            disponiblesPerfil = await Ficha.count({ where: { status: true, PerfilId: perfiles[i].id } });
            vendidasPerfil = await Ficha.count({ where: { status: false, PerfilId: perfiles[i].id } });

            //Objeto por perfil
            let object = {
                perfil: perfiles[i].profile,
                precio: perfiles[i].price,
                estadisticas: {
                    disponibles: disponiblesPerfil,
                    vendidas: vendidasPerfil,
                    total: (disponiblesPerfil + vendidasPerfil)
                }
            };
            estadisticaPerfil.push(object);

            //Calculos de estadisticas
            vendidasTotal += vendidasPerfil;
            disponiblesTotal += disponiblesPerfil;

            if (vendidasPerfil != 0) {
                if (vendidasPerfil > masVendidaAux) {
                    masVendidaAux = vendidasPerfil;
                    masVendidaProfile = perfiles[i].profile;
                }
            }
        }

        fichasTotal = vendidasTotal + disponiblesTotal;
        estadisticas = {
            fichasTotal: fichasTotal,
            vendidasTotal: vendidasTotal,
            disponiblesTotal: disponiblesTotal,
            masVendida: masVendidaProfile,
            perfiles: estadisticaPerfil
        };
        return estadisticas;
    }


    //Usar restriccion en varias rutas
    // app.use((req, res, next) => {
    //     isAuthenticated(req, res, next);
    //     next();
    // });

};