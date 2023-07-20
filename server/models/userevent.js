'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class UserEvent extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      UserEvent.belongsTo(models.Event, { foreignKey: 'EventId' })
      UserEvent.belongsTo(models.User, { foreignKey: 'UserId' })
    }
  }
  UserEvent.init({
    UserId: DataTypes.INTEGER,
    EventId: DataTypes.INTEGER,
    isOrganizer : {
      type : DataTypes.BOOLEAN,
      defaultValue : false
    }
  }, {
    sequelize,
    modelName: 'UserEvent',
  });
  return UserEvent;
};