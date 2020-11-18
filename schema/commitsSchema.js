/**
 * Mongoose schema file to define collection
 */
const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const CommitsSchema = new Schema(
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
  { collection: 'commit' }
);

module.exports = mongoose.model('Commit', CommitsSchema);
