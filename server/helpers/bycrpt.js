const bcrypt = require('bcryptjs');

// hook
const hashPassword = (password) => {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);
    return hash;
}

// login
const comparePassword = (password, hashedPassword) => {
    return bcrypt.compareSync(password, hashedPassword);
}

module.exports = {
    hashPassword,
    comparePassword
}