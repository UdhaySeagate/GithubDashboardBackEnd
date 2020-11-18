/**
 * Mongoose schema file to define collection
 */
const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const RepoSchema = new Schema(
  {
    repo: {
      type: Array,
      required: true
    }
  },
  { timestamps: true },
  { collection: 'repo' }
);

module.exports = mongoose.model('Repo', RepoSchema);
