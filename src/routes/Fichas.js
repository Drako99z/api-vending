module.exports = app => {
    var moment = require('moment');
    const Ficha = app.db.models.Ficha;
    const Perfiles = app.db.models.Perfil;
    const Keys = app.db.models.ApiKey;

    var key;

    //Continua si esta autenticado
    function isAuthenticated(req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        }
        res.redirect('/');
    };

    app.route('/fichas')
        .post(isAuthenticated, async (req, res) => {
            if (req.body.fichas != "") {
                try {
                    //Transformando las cadenas de comandos en fichas
                    let perfilesGuardados = await Perfiles.findAll({ where: { status: 1 } });
                    let cadenas = req.body.fichas;
                    let ficha;
                    let fichaError = false;
                    cadenas = cadenas.split('\n');

                    for (const i in cadenas) {
                        ficha = fichaToObject(cadenas[i]);       //Convertir ficha en objeto
                        if (ficha != null) {
                            for (const j in perfilesGuardados) {
                                if (perfilesGuardados[j].profile.includes(ficha.perfil)) {          //si esta presente el perfil encontrado
                                    try {
                                        let fichaGuardada = await Ficha.create(ficha);                  //Se crea el registro de la ficha
                                        fichaGuardada.setPerfil(perfilesGuardados[j]);                  //Se asigna la ficha a su perfil
                                    } catch (error) {
                                        fichaError = true;
                                    }
                                    break;
                                }
                            }
                        }
                    }
                    if (!fichaError) {
                        req.flash('dashboardMessage', 'Fichas agregadas exitosamente');
                    } else {
                        req.flash('dashboardMessage', 'Fichas agregadas. Algunas fichas no pudieron agregarse correctamente');
                    }
                    res.redirect('/dashboard');

                } catch (error) {
                    req.flash('dashboardErrorMessage', 'Ha ocurrido un error en el servidor: ' + error.message);
                    res.redirect('/dashboard');
                }
            } else {
                req.flash('dashboardErrorMessage', 'Uno o más campos se encuentran vacíos');
                res.redirect('/dashboard');
            }
        });

    //Metodo que transforma cadena de ficha en un objeto
    function fichaToObject(cadena) {
        let fichaObject = null;
        if (cadena.includes("name=") && cadena.includes("password=") && cadena.includes("profile=") && cadena.includes("limit-uptime=")) {
            //limpiar cadena
            let ficha = cadena
                .replace(/\s{0,}add\s{0,}/g, '')         //quitar el add del inicio
                .replace(/\s{0,}=\s{0,}/g, '=')          //quitar igual con espacios
                .replace(/\s{0,}comment=".{0,}"/g, '')   //quitar comentario
                .replace(/"/g, '').trim();               //quitar comillas

            //dividir en propiedades
            let propiedades = ficha.split(' ');
            fichaObject = {};
            propiedades.forEach(prop => {
                if (prop.includes("name=")) {
                    fichaObject.user = prop.replace("name=", "").trim();
                }
                if (prop.includes("password=")) {
                    fichaObject.password = prop.replace("password=", "").trim();
                }
                if (prop.includes("profile=")) {
                    fichaObject.perfil = prop.replace("profile=", "").trim();
                }
                if (prop.includes("limit-uptime=")) {
                    fichaObject.time = prop.replace("limit-uptime=", "").trim();
                }
            });
        }
        return fichaObject;
    }

    app.route('/clearHistory')
        .post(isAuthenticated, async (req, res) => {
            if (req.body.range != "") {
                try {
                    const manager = app.routes.Manager;
                    let passwordRoot = req.body.passwordRoot;
                    if (passwordRoot != null && passwordRoot != "" && manager.isRootPassword(passwordRoot)) {

                        let range = req.body.range;
                        let object = getWhereClearHistory(range, req.body.vending);
                        let date = object.date;
                        let where = object.where;

                        let toDestroy = await Ficha.findAll(where);
                        let idDestroy = [];
                        for (let i = 0; i < toDestroy.length; i++) {
                            idDestroy.push(toDestroy[i].id);
                        }
                        let eliminadas = await Ficha.destroy({ where: { id: idDestroy } });

                        if (range != "all" && range != "reset") {
                            req.flash('configMessage', eliminadas + ' Fichas vendidas antes del ' + date.format('DD/MM/YYYY') + ' eliminadas exitosamente');
                        } else if (range == "all") {
                            req.flash('configMessage', eliminadas + ' Fichas vendidas eliminadas exitosamente');
                        } else {
                            req.flash('configMessage', eliminadas + ' Fichas eliminadas exitosamente');
                        }
                        res.redirect('/config');
                    } else {
                        req.flash('configErrorMessage', 'No esta autorizado para realizar esta tarea');
                        res.redirect('/config');
                    }
                } catch (error) {
                    req.flash('configErrorMessage', 'Ha ocurrido un error en el servidor: ' + error.message);
                    res.redirect('/config');
                }
            } else {
                req.flash('configErrorMessage', 'Uno o más campos se encuentran vacíos');
                res.redirect('/config');
            }
        });

    function getWhereClearHistory(range, vending) {
        const { Op } = require("sequelize");
        let date;
        let whereVending = (vending == "all") ? { status: 1 } : { status: 1, name: vending };
        let include = [{
            model: Keys,
            where: whereVending,
            attributes: []
        }];
        let where = { attributes: ['id'], where: {}, truncate: true }; //Eliminar Todas las fichas
        switch (range) {
            case "1Year":
                date = moment().subtract(1, 'year');
                break;
            case "6Months":
                date = moment().subtract(6, 'month');
                break;
            case "3Months":
                date = moment().subtract(3, 'month');
                break;
            case "1Month":
                date = moment().subtract(1, 'month');
                break;
        }
        if (range != "all" && range != "reset") {//Eliminar las fichas vendidas en el rango de fechas
            where = {
                attributes: ['id'],
                where: {
                    status: 0,
                    updatedAt: {
                        [Op.lte]: date
                    }
                },
                include: include
            };
        } else if (range == "all") {//Eliminar todas las fichas vendidas
            where = {
                attributes: ['id'],
                where: {
                    status: 0
                },
                include: include
            };
        }
        return {date: date, where: where};
    }

    app.route('/sales')
        .get(isAuthenticated, async (req, res) => {
            let range = req.query.range;
            let startDate = req.query.startDate;
            let endDate = req.query.endDate;

            range = (range == null || range == "") ? "today" : range;
            if (range == "custom" && (startDate == null || endDate == null || startDate == "" || endDate == "")) {
                res.redirect('/sales?range=today');
            } else {
                res.render('sales', { ventas: await getVentas(range, startDate, endDate) });
            }
        });

    async function getVentas(range, startDate, endDate) {
        let maquinas = await Keys.findAll({ where: { status: 1 } });
        let perfiles = await Perfiles.findAll({ where: { status: 1 }, order: [['price', 'ASC']] });
        let ventas = {};

        let ventasMaquina = [];

        let acumuladoTotal = 0;
        let vendidasTotal = 0;
        let disponiblesTotal = await Ficha.count({ where: { status: 1 } });
        let masVentasMaquina = "No hay suficiente información de ventas";
        let masVendidaAux = -1;

        for (let i in maquinas) {
            let forProfile = [];
            let ventaMaquinaTotal = 0;
            let acumMaquinaTotal = 0;
            let vendidasMaquinaAux = 0;

            for (let j in perfiles) {

                let vendidas = await Ficha.count({
                    where: { status: 0 },
                    include: [{
                        model: Perfiles,
                        where: { id: perfiles[j].id }
                    }, {
                        model: Keys,
                        where: { id: maquinas[i].id }
                    }]
                });
                let saldoAcum = vendidas * perfiles[j].price;
                vendidasTotal += vendidas;
                acumuladoTotal += saldoAcum;
                vendidasMaquinaAux += vendidas;

                if (range != "all") {
                    vendidas = await Ficha.count({
                        where: getVentasWhere(range, startDate, endDate),
                        include: [{
                            model: Perfiles,
                            where: { id: perfiles[j].id }
                        }, {
                            model: Keys,
                            where: { id: maquinas[i].id }
                        }]
                    });
                    saldoAcum = vendidas * perfiles[j].price;
                }
                forProfile.push({ perfil: perfiles[j].profile, precio: perfiles[j].price, vendidas: vendidas, saldoAcumulado: saldoAcum });
                ventaMaquinaTotal += vendidas;
                acumMaquinaTotal += saldoAcum;

            }
            ventasMaquina.push({ maquina: maquinas[i].name, ventaTotal: ventaMaquinaTotal, acumuladoTotal: acumMaquinaTotal, venta: forProfile });

            if (vendidasMaquinaAux != 0) {
                if (vendidasMaquinaAux > masVendidaAux) {
                    masVendidaAux = vendidasMaquinaAux;
                    masVentasMaquina = maquinas[i].name;
                }
            }

        }
        ventas = {
            rangoVentas: range,
            fechaInicial: startDate,
            fechaFinal: endDate,
            disponiblesTotal: disponiblesTotal,
            vendidasTotal: vendidasTotal,
            acumuladoTotal: acumuladoTotal,
            masVentasMaquina: masVentasMaquina,
            ventasForMaquina: ventasMaquina
        };
        return ventas;
    }

    function getVentasWhere(range, startDate, endDate) {
        const { Op } = require("sequelize");
        let whereVentas = {};
        switch (range) {
            case "today":
                whereVentas = {
                    status: 0,
                    updatedAt: {
                        [Op.gte]: moment().startOf('day'),
                        [Op.lte]: moment().endOf('day')
                    }
                };
                break;
            case "yesterday":
                whereVentas = {
                    status: 0,
                    updatedAt: {
                        [Op.gte]: moment().subtract(1, 'day').startOf('day'),
                        [Op.lte]: moment().subtract(1, 'day').endOf('day')
                    }
                };
                break;
            case "week":
                whereVentas = {
                    status: 0,
                    updatedAt: {
                        [Op.gte]: moment().startOf('week'),
                        [Op.lte]: moment().endOf('week')
                    }
                };
                break;
            case "lastWeek":
                whereVentas = {
                    status: 0,
                    updatedAt: {
                        [Op.gte]: moment().subtract(1, 'week').startOf('week'),
                        [Op.lte]: moment().subtract(1, 'week').endOf('week')
                    }
                };
                break;
            case "month":
                whereVentas = {
                    status: 0,
                    updatedAt: {
                        [Op.gte]: moment().startOf('month'),
                        [Op.lte]: moment().endOf('month')
                    }
                };
                break;
            case "lastMonth":
                whereVentas = {
                    status: 0,
                    updatedAt: {
                        [Op.gte]: moment().subtract(1, 'month').startOf('month'),
                        [Op.lte]: moment().subtract(1, 'month').endOf('month')
                    }
                };
                break;
            case "custom":
                whereVentas = {
                    status: 0,
                    updatedAt: {
                        [Op.gte]: startDate,
                        [Op.lte]: moment(endDate).endOf('day')
                    }
                };
                break;
            default:
                whereVentas = {
                    status: 0
                };
                break;
        }
        return whereVentas;
    }


    //Maquina Vending Metodos
    app.route('/vending')
        .post(isAutorized, async (req, res, next) => {
            try {
                res.status(200).json({ estatus: "Correcto", result: await getDisponiblesPerfil() });
            } catch (error) {
                res.status(412).json({ estatus: "Error", msg: error.message });
            }
        });

    async function getDisponiblesPerfil() {
        let perfiles = await Perfiles.findAll({ where: { status: 1 }, order: [['price', 'ASC']] });
        let disponiblesPerfil;
        let disponibles = [];
        for (const i in perfiles) {
            disponiblesPerfil = await Ficha.count({ where: { status: true, PerfilId: perfiles[i].id } });
            disponibles.push({ perfil: perfiles[i].profile, precio: perfiles[i].price, disponibles: disponiblesPerfil });
        }
        return disponibles;
    }

    app.route('/vending/:price')
        .post(isAutorized, async (req, res, next) => {
            try {
                res.status(200).json({ estatus: "Correcto", result: await getFichaAndDisabled(req.params.price) });
            } catch (error) {
                res.status(412).json({ estatus: "Error", msg: error.message });
            }
        });

    async function getFichaAndDisabled(price) {
        let ficha = await Ficha.findOne({
            where: { status: 1 },
            include: [{
                model: Perfiles,
                where: { status: 1, price: price }
            }]
        });
        let object;
        if (ficha != null) {
            object = { user: ficha.user, password: ficha.password, precio: ficha.Perfil.price }; //Obtener Ficha
            Ficha.update({ status: 0 }, { where: { id: ficha.id } })   //Desactivarla
            ficha.setApiKey(key);             //Se asigna la ficha a la maquina que la vendió
        } else {
            object = { msg: "Ninguna ficha encontrada" };
        }
        return object;
    }

    //Continua si el token api esta autorizado
    async function isAutorized(req, res, next) {
        if (req.body.key != null) {
            if (req.body.key != "") {
                try {
                    let api = await Keys.findOne({ where: { key: req.body.key, status: 1 } })
                    if (api) {
                        key = api;
                        return next();
                    } else {
                        res.status(401).json({ estatus: "Error", msg: "No autorizado" });
                    }
                } catch (error) {
                    res.status(412).json({ estatus: "Error", msg: error.message });
                }
            } else {
                res.status(400).json({ estatus: "Error", msg: "Datos enviados de forma incorrecta" });
            }
        } else {
            res.status(400).json({ estatus: "Error", msg: "Datos enviados de forma incorrecta" });
        }
    };

};