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
            unique: true,
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

    perfil.associate = (models) => {
        perfil.hasMany(models.Ficha, { onDelete: 'cascade' });
    };

    return perfil;
}