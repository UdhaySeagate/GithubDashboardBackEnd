/**
 * Mongoose schema file to define collection
 */
const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const ClonesSchema = new Schema(
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
  { collection: 'clone' }
);

module.exports = mongoose.model('Clone', ClonesSchema);
