import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const hostSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'Full name is required'],
        trim: true,
        minlength: [2, 'Full name must be at least 2 characters long'],
        maxlength: [100, 'Full name cannot exceed 100 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long']
    },
    phoneNumber: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true,
        match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
    },
    bankingDetails: {
        accountHolderName: {
            type: String,
            required: [true, 'Account holder name is required'],
            trim: true
        },
        accountNumber: {
            type: String,
            required: [true, 'Account number is required'],
            trim: true,
            match: [/^[0-9]{9,18}$/, 'Please enter a valid account number']
        },
        bankName: {
            type: String,
            required: [true, 'Bank name is required'],
            trim: true
        },
        ifscCode: {
            type: String,
            required: [true, 'IFSC code is required'],
            trim: true,
            uppercase: true,
            match: [/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Please enter a valid IFSC code']
        }
    },
    enquiry: {
        locationDetails: {
            address: {
                type: String,
                trim: true
            },
            city: {
                type: String,
                trim: true
            },
            state: {
                type: String,
                trim: true
            },
            postalCode: {
                type: String,
                trim: true
            },
            country: {
                type: String,
                trim: true
            }
        },
        amenities: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Amenity'
        }],
        customAmenities: [{
            type: String,
            trim: true
        }],
        propertyRules: [{
            type: String,
            trim: true
        }],
        propertyDetails: {
            title: {
                type: String,
                trim: true
            },
            regularPrice: {
                type: Number,
                min: 0
            },
            weekendPrice: {
                type: Number,
                min: 0
            },
            rooms: {
                type: Number,
                min: 1
            },
            guestLimit: {
                type: Number,
                min: 1
            },
            description: {
                type: String,
                trim: true
            },
            photos: [{
                type: String,
                trim: true
            }]
        }
    },
    isActive: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});




// Method to generate JWT token
hostSchema.methods.generateAuthToken = function () {
    const token = jwt.sign(
        {
            _id: this._id,
            email: this.email,
            fullName: this.fullName,
            phoneNumber: this.phoneNumber,
            isActive: this.isActive
        },
        process.env.JWT_SECRET,

    );
    return token;
};

// Method to compare password
hostSchema.methods.comparePassword = async function (candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw error;
    }
};

// Method to generate refresh token


const Host = mongoose.model('Host', hostSchema);

export default Host;
