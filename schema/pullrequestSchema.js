/**
 * Mongoose schema file to define collection
 */
const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const PullrequestSchema = new Schema(
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
  { collection: 'pullrequest' }
);

module.exports = mongoose.model('Pullrequest', PullrequestSchema);
