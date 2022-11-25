module.exports = app =>{
    app.get('/', (req, res) =>{
        res.json({status: 'Vending API Active'});
    });
};