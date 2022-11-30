const moment = require("moment/moment");

module.exports = (sequelize, DataType) => {
    const perfil = sequelize.define('Perfil', {
        id: {
            type: DataType.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        profile: {
            type: DataType.STRING,
            allowNull: false,
            validate: {
                notEmpty: true
            }
        },
        price: {
            type: DataType.DECIMAL,
            allowNull: false,
            validate: {
                notEmpty: true
            }
        },
        status: {
            type: DataType.BOOLEAN,
            allowNull: false,
            defaultValue: true,
            validate: {
                notEmpty: true
            }
        },
        createdAt: {
            type: DataType.DATE,
            get() {
                return moment(this.getDataValue('createdAt')).format('DD/MM/YYYY h:mm:ss a');
            }
        },
        updatedAt: {
            type: DataType.DATE,
            get() {
                return moment(this.getDataValue('updatedAt')).format('DD/MM/YYYY h:mm:ss a');
            }
        }
    });

    perfil.associate = (models) => {
        perfil.hasMany(models.Ficha);
    };

    return perfil;
}