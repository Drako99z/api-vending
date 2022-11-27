import bycrypt from 'bcrypt-nodejs';

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
        }
    });

    manager.prototype.validPassword = function(password) {
        return bycrypt.compareSync(password, this.password);
    };

    manager.encryptPassword = (password) =>{
        return bycrypt.hashSync(password, bycrypt.genSaltSync(10));
    }

    return manager;
}