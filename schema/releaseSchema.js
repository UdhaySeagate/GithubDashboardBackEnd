/**
 * Mongoose schema file to define collection
 */
const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const ReleaseSchema = new Schema(
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
  { collection: 'release' }
);

module.exports = mongoose.model('Release', ReleaseSchema);
