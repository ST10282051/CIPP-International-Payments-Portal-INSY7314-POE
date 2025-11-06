
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 12;
module.exports.hashPassword = async function(password){
  return bcrypt.hash(password, SALT_ROUNDS);
};
module.exports.verify = async function(password, hash){
  return bcrypt.compare(password, hash);
};
