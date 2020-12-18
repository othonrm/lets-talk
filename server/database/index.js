const mongoose = require('mongoose');

mongoose.set('useFindAndModify', false);

const databaseUrl = process.env.DB_HOST.replace(
    '<username>',
    process.env.DB_USERNAME,
)
    .replace('<password>', process.env.DB_PASSWORD)
    .replace('<database>', process.env.DB_DATABASE);

mongoose
    .connect(databaseUrl, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => {
        console.log('Mongdb connected');
    })
    .catch(err => console.log(err));

mongoose.Promise = global.Promise;

module.exports = mongoose;
