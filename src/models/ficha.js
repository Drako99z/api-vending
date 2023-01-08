const moment = require("moment");

module.exports = (sequelize, DataType) => {
    const ficha = sequelize.define('Ficha', {
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
        time: {
            type: DataType.STRING,
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

    ficha.associate = (models) => {
        ficha.belongsTo(models.Perfil, { onDelete: 'cascade' });
        ficha.belongsTo(models.ApiKey, { onDelete: 'cascade' });
    };

    return ficha;
}
