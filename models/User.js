const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    nom: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    motDePasse: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    lastActivity: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

userSchema.pre("save", async function () {
  if (!this.isModified("motDePasse")) return;

  this.motDePasse = await bcrypt.hash(this.motDePasse, 10);
});

userSchema.methods.comparePassword = async function (inputPassword) {
  try {
    return await bcrypt.compare(inputPassword, this.motDePasse);
  } catch (err) {
    throw new Error(err);
  }
};

module.exports = mongoose.model("User", userSchema);
