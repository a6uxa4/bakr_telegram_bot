const { default: mongoose } = require("mongoose");
const AutoIncrement = require("mongoose-sequence")(mongoose);

const concertSchema = new mongoose.Schema({
  concertId: {
    type: Number,
    unique: true,
  },
  plannedTo: {
    type: Date,
    required: true,
  },
  cityOn: {
    type: String,
    required: true,
  },
  institutionOn: {
    type: String,
    required: true,
  },
  linkTo: {
    type: String,
    required: true,
  },
});

concertSchema.plugin(AutoIncrement, { inc_field: "concertId" });

const Concert = mongoose.model("Concert", concertSchema);

module.exports = { Concert };
