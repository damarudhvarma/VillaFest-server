import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true,
        minlength: [2, 'First name must be at least 2 characters long']
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        default: " ",
        set: function (v) {
            return v === "" ? " " : v;
        }
    },
    mobileNumber: {
        type: String,
        required: [true, 'Mobile number is required'],
        unique: true,
        trim: true,
        match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit mobile number']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long']
    },
    isHost: {
        type: Boolean,
        default: false
    },
    host: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Host'
    },
    wishlist: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Property',
        default: []
    }]
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw error;
    }
};

// Generate JWT Token
userSchema.methods.generateToken = function () {
    try {
        return jwt.sign(
            {
                id: this._id,
                email: this.email,
                firstName: this.firstName,
                lastName: this.lastName,
                mobileNumber: this.mobileNumber
            },
            process.env.JWT_SECRET,

        );
    } catch (error) {
        throw error;
    }
};


const User = mongoose.model('User', userSchema);

export default User;
