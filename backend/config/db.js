const mongoose = require('mongoose');
const MONGO_URI = "mongodb://localhost:27017/tshirt-customization"
// const MONGO_URI = "mongodb+srv://rrao3426_db_user:8INWhRJSNLRSEvic@cluster0.ijaaetb.mongodb.net/myDatabase?retryWrites=true&w=majority&appName=Cluster0"


const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected...');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

module.exports = connectDB;