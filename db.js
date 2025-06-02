const mongoose = require("mongoose");
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const documentSchema = new mongoose.Schema({
  _id: String,
  data: Object
});

module.exports = mongoose.model("Document", documentSchema);
