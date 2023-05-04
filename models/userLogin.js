const { Model } = require('sequelize');
module.exports = (sequelize, Datatypes) => {
  class UserLogin extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.belongsTo(models.User, {
        foreignKey: 'user_id',
        targetKey: 'id',
        as: 'user'
      });
    }
  }
  UserLogin.init(
    {
      user_id: {
        type: Datatypes.UUID,
        references: {
          model: 'user',
          key: 'id'
        }
      },
      refresh_token_id: {
        type: Datatypes.STRING
      },
      access_token_id: {
        type: Datatypes.STRING
      },
      refresh_token_expire_time: {
        type: Datatypes.BIGINT
      }
    },
    {
      sequelize,
      modelName: 'UserLogin',
      tableName: 'user_login',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at'
    }
  );
  return UserLogin;
};
