module.exports = (sequelize, DataType) => {
    const key = sequelize.define('ApiKey', {
        id: {
            type: DataType.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        key: {
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
        }
    });

    return key;
}