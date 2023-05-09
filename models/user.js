const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.hasOne(models.UserLogin, {
        foreignKey: 'user_id'
      });
    }
  }
  User.init(
    {
      name: {
        type: DataTypes.STRING
      },
      email: {
        type: DataTypes.STRING,
        unique: true
      },
      user_name: {
        type: DataTypes.STRING,
        unique: true
      },
      password: {
        type: DataTypes.STRING
      },
      active: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      confirmation_code: {
        type: DataTypes.TEXT,
        defaultValue: null
      },
      reset_password_token: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null
      },
      reset_password_expires: {
        type: DataTypes.BIGINT,
        allowNull: true,
        defaultValue: null
      }
    },
    {
      sequelize,
      paranoid: true,
      modelName: 'User',
      tableName: 'user'
    }
  );
  return User;
};
