import bycrypt from 'bcrypt-nodejs';
const moment = require("moment/moment");

module.exports = (sequelize, DataType) => {
    const manager = sequelize.define('Manager', {
        id: {
            type: DataType.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        user: {
            type: DataType.STRING,
            allowNull: false,
            unique: true,
            validate: {
                notEmpty: true
            }
        },
        password: {
            type: DataType.STRING,
            allowNull: false,
            validate: {
                notEmpty: true
            }
        },
        createdAt: {
            type: DataType.DATE,
            get() {
                return moment(this.getDataValue('createdAt')).tz("America/Mexico_City").format('DD/MM/YYYY h:mm:ss a');
            }
        },
        updatedAt: {
            type: DataType.DATE,
            get() {
                return moment(this.getDataValue('updatedAt')).tz("America/Mexico_City").format('DD/MM/YYYY h:mm:ss a');
            }
        }
    });

    manager.prototype.validPassword = function(password) {
        return bycrypt.compareSync(password, this.password);
    };

    manager.encryptPassword = (password) =>{
        return bycrypt.hashSync(password, bycrypt.genSaltSync(10));
    };

    manager.validPassword = (password1, password2) =>{
        return bycrypt.compareSync(password1, password2);
    }

    manager.associate = (models) => {
        //Sin Asociación
    };

    return manager;
}