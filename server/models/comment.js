'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Comment extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Comment.belongsTo(models.User, { foreignKey: 'UserId' })
      Comment.belongsTo(models.Post, { foreignKey: 'PostId' })
      Comment.belongsTo(models.Sticker, { foreignKey: 'StickerId' })
    }
  }
  Comment.init({
    UserId: DataTypes.INTEGER,
    PostId: DataTypes.INTEGER,
    content: DataTypes.TEXT,
    StickerId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Comment',
  });
  return Comment;
};