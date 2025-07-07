const mongoose = require('mongoose');

const databaseUrl = process.env.DB_HOST.replace(
    '<db_username>',
    process.env.DB_USERNAME,
).replace('<db_password>', process.env.DB_PASSWORD);

console.log('Connecting to MongoDB...');

mongoose
    .connect(databaseUrl)
    .then(() => {
        console.log('Mongdb connected');
    })
    .catch(err => console.log(err));

mongoose.Promise = global.Promise;

module.exports = mongoose;
