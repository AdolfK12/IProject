'use strict';
const {
  Model
} = require('sequelize');
const { hashPassword } = require('../helpers/bycrpt');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      User.hasMany(models.Post, { foreignKey: 'UserId', onDelete: 'CASCADE' })
      User.hasMany(models.Comment, { foreignKey: 'UserId', onDelete: 'CASCADE' })
      User.hasMany(models.UserEvent, { foreignKey: 'UserId', onDelete: 'CASCADE' })
      User.belongsToMany(models.Event, { through: models.UserEvent, foreignKey: 'UserId' });
      User.hasMany(models.Event, { foreignKey: 'OrganizerId', onDelete: 'CASCADE' });
    }
  }
  User.init({
    userName: {
      type : DataTypes.STRING,
    },
    email: {
      type : DataTypes.STRING,
      allowNull : false,
      unique : true,
      validate : {
        notEmpty : true,
        notNull : true,
        isEmail : true,
      }
    },
    password: {
      type : DataTypes.STRING,
      allowNull : false
    },
    imageUrl: {
      type : DataTypes.STRING,
    },
    subs: {
      type : DataTypes.STRING,
    },
    
  }, {
    hooks: {
      beforeCreate: (user) => {
        user.password = hashPassword(user.password),
        user.subs = false
    }},
    sequelize,
    modelName: 'User',
  });
  return User;
};