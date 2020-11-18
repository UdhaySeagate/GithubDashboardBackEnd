/**
 * Mongoose schema file to define collection
 */
const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const MembersSchema = new Schema(
  {
    members: {
      type: Array,
      required: true
    }
  },
  { timestamps: true },
  { collection: 'member' }
);

module.exports = mongoose.model('Member', MembersSchema);
