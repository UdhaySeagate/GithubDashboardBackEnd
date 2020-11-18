/**
 * Model file to handle all the database connection logis
 */
const { membersSchema } = require('../schema/index');
const { Logger } = require('../helpers/index');
const { cards } = require('../api/index');

const GetMembersListFromDB = async () => {
  try {
    Logger.log('info', `Get members list from DB`);
    const response = await membersSchema.findOne({});
    return response;
  } catch (exc) {
    Logger.log('error', exc);
    throw exc;
  }
};

const SetMembersListToDB = async () => {
  Logger.log('info', `Updating latest members list to members collection`);
  const membersList = await cards.GetMembersList();
  const update = { $set: { members: membersList } };
  membersSchema.findOneAndUpdate({}, update, { upsert: true }, err => {
    if (err) {
      Logger.log('error', err);
    }
  });
};

module.exports = {
  GetMembersListFromDB,
  SetMembersListToDB
};
