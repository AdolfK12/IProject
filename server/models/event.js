'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Event extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Event.hasMany(models.UserEvent, { foreignKey: 'EventId' })
      Event.belongsToMany(models.User, { through: models.UserEvent, foreignKey: 'EventId' });
      Event.belongsTo(models.User, { foreignKey: 'OrganizerId' });
    }
  }
  Event.init({
    title: DataTypes.STRING,
    description: DataTypes.STRING,
    date: DataTypes.DATE,
    OrganizerId : DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Event',
  });
  return Event;
};