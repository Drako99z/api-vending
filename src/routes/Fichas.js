module.exports = app => {
    const Ficha = app.db.models.Ficha;

    app.route('/fichas')
        .get((req, res) => {
            Ficha.findAll()
            .then(result => res.json(result))
            .catch(error => {
                res.status(412).json({msg: error.message});
            });
        })
        .post((req, res) => {
            Ficha.create(req.body)
            .then(result => res.json(result))
            .catch(error => {
                res.status(412).json({msg: error.message});
            });
        });

    app.route('/fichas/:id')
        .get((req, res) => {
            Ficha.findOne({where: req.params})
            .then(result => res.json (result))
            .catch(error => {
                res.status(412).json({msg: error.message});
            });
        })
        .put((req, res) => {
            Ficha.update(req.body, {where: req.params})
            .then(result => res.sendStatus(204))
            .catch(error => {
                res.status(412).json({msg: error.message});
            });
        })
        .delete((req, res) => {
            Ficha.destroy({where: req.params})
            .then(result => res.sendStatus(204))
            .catch(error => {
                res.status(412).json({msg: error.message});
            });
        });


};