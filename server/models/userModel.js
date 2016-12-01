const mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    validator = require('validator'),
    bcrypt = require('bcrypt-nodejs');

const userSchema = new Schema({
    username: { type: String, required: true, validate: validator.isAlphanumeric, unique: true, maxlength: 20 },
    password: { type: String, required: true, minlength: 6, maxlength: 40 },
    createdAt: { type: Date, default: Date.now }
});

userSchema.pre('save', function (next) {
    const user = this;

    if (!user.isModified('password')) return next();

    bcrypt.genSalt(12, function (err, salt) {
        if (err) throw err;
        bcrypt.hash(user.password, salt, null, function (err, hash) {
            if (err) throw err;
            user.password = hash;
            next();
        });
    });
});

userSchema.methods.isValidPassword = function (password) {
    return bcrypt.compareSync(password, this.password);
};

module.exports = mongoose.model('User', userSchema);