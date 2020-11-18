/**
 * Mongoose schema file to define collection
 */
const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const ViewsSchema = new Schema(
  {
    repo: {
      type: String,
      required: true
    },
    list: {
      type: Array,
      required: false
    }
  },
  { timestamps: true },
  { collection: 'view' }
);

module.exports = mongoose.model('View', ViewsSchema);
