const mongoose = require('mongoose'),
    Schema = mongoose.Schema;


const fileSchema = new Schema({
    name: { type: String, required: true },
    v: { type: Number },
    type: { type: String },
    path: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date }
});


fileSchema.pre('save', function (next) {
    let file = this;

    if (!file.isModified()) return next();

    file.updatedAt = Date.now();
    next();
});
module.exports = mongoose.model('File', fileSchema);