module.exports = app => {
    const Ficha = app.db.models.Ficha;

    app.route('/fichas')
        .get((req, res) => {
            Ficha.findAll()
                .then(result => res.json(result))
                .catch(error => {
                    res.status(412).json({ msg: error.message });
                });
        })
        .post((req, res) => {
            let cadenas = req.body.fichas;
            cadenas = cadenas.split('\n');
            var fichas = [];
            cadenas.forEach(ficha => {
                fichas.push(fichaToObject(ficha));
            });

            res.json(fichas);
        });

    function fichaToObject(cadena) {
        //limpiar cadena
        let ficha = cadena
            .replaceAll(/\s{0,}add\s{0,}/g, '')         //quitar el add del inicio
            .replaceAll(/\s{0,}=\s{0,}/g, '=')          //quitar igual con espacios
            .replaceAll(/\s{0,}comment=".{0,}"/g, '')   //quitar comentario
            .replaceAll(/"/g, '').trim();               //quitar comillas

        //dividir en propiedades
        let propiedades = ficha.split(' ');
        let fichaObject = {};
        propiedades.forEach(prop => {
            if (prop.includes("name=")) {
                fichaObject.name = prop.replaceAll("name=", "").trim();
            }
            if (prop.includes("password=")) {
                fichaObject.password = prop.replaceAll("password=", "").trim();
            }
            if (prop.includes("profile=")) {
                fichaObject.profile = prop.replaceAll("profile=", "").trim();
            }
            if (prop.includes("limit-uptime=")) {
                fichaObject.time = prop.replaceAll("limit-uptime=", "").trim();
            }
        });
        return fichaObject;
    }

    app.route('/oneFicha')
        .get((req, res) => {
            Ficha.findAll()
                .then(result => res.json(result))
                .catch(error => {
                    res.status(412).json({ msg: error.message });
                });
        })
        .post((req, res) => {
            Ficha.create(req.body)
                .then(result => res.json(result))
                .catch(error => {
                    res.status(412).json({ msg: error.message });
                });
        });

    app.route('/fichas/:id')
        .get((req, res) => {
            Ficha.findOne({ where: req.params })
                .then(result => res.json(result))
                .catch(error => {
                    res.status(412).json({ msg: error.message });
                });
        })
        .put((req, res) => {
            Ficha.update(req.body, { where: req.params })
                .then(result => res.sendStatus(204))
                .catch(error => {
                    res.status(412).json({ msg: error.message });
                });
        })
        .delete((req, res) => {
            Ficha.destroy({ where: req.params })
                .then(result => res.sendStatus(204))
                .catch(error => {
                    res.status(412).json({ msg: error.message });
                });
        });

};