const moment = require("moment/moment");

module.exports = (sequelize, DataType) => {
    const key = sequelize.define('ApiKey', {
        id: {
            type: DataType.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataType.STRING,
            allowNull: true,
            unique: true,
            validate: {
                notEmpty: true
            }
        },
        key: {
            type: DataType.STRING,
            allowNull: false,
            unique: true,
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

    key.associate = (models) => {
        key.hasMany(models.Ficha, { onDelete: 'cascade' });
    };

    return key;
}