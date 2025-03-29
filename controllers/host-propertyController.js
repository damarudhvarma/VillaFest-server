import HostProperty from '../models/hostPropertyModel.js';
import Category from '../models/Category.js';
import Amenity from '../models/amenityModel.js';
import Property from '../models/propertyModel.js';
import mongoose from 'mongoose';
import path from 'path';

export const createHostPropertyController = async (req, res) => {
    try {
        const {
            title,
            category,
            price,
            weekendPrice,
            description,
            rules,
            amenities: amenitiesJson,
            latitude,
            longitude,
            address,
            city,
            state,
            postalCode,
            maxGuests,
            owner
        } = req.body;

        // Parse the JSON strings
        const parsedRules = JSON.parse(rules);
        const parsedAmenities = JSON.parse(amenitiesJson);
        const parsedOwner = JSON.parse(owner);

        // Validate required files
        if (!req.files || !req.files.mainImage) {
            return res.status(400).json({
                success: false,
                message: "Main image is required"
            });
        }

        // Create property folder name
        const propertyTitle = title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();

        // Generate image paths
        const mainImagePath = `/host-properties/${propertyTitle}/${req.files.mainImage[0].filename}`;
        const additionalImagePaths = req.files.additionalImages
            ? req.files.additionalImages.map(file => `/host-properties/${propertyTitle}/${file.filename}`)
            : [];

        // Find the category and increment its properties count
        const categoryDoc = await Category.findById(category);
        if (!categoryDoc) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        // Validate that all amenities exist
        const amenityDocs = await Amenity.find({ _id: { $in: parsedAmenities } });
        if (amenityDocs.length !== parsedAmenities.length) {
            return res.status(404).json({
                success: false,
                message: "One or more amenities not found"
            });
        }

        // Create the host property with all details
        const hostProperty = new HostProperty({
            title,
            category,
            price: Number(price),
            weekendPrice: Number(weekendPrice),
            description,
            rules: parsedRules,
            amenities: parsedAmenities,
            location: {
                type: 'Point',
                coordinates: [Number(longitude), Number(latitude)]
            },
            address: {
                street: address,
                city,
                state,
                postalCode
            },
            owner: {
                name: parsedOwner.name,
                contact: Number(parsedOwner.contact)
            },
            maxGuests: Number(maxGuests),
            mainImage: mainImagePath,
            additionalImages: additionalImagePaths,
            host: req.hostData._id, // Set the host from authenticated user
            status: 'pending' // Set initial status as pending
        });

        // Save the host property
        const savedHostProperty = await hostProperty.save();

        // Increment the category's properties count
        categoryDoc.properties += 1;
        await categoryDoc.save();

        // Populate the saved property with category and amenities data
        const populatedHostProperty = await HostProperty.findById(savedHostProperty._id)
            .populate('category', 'name image')
            .populate('amenities', 'name icon')
            .populate('host', 'fullName email phoneNumber');

        return res.status(201).json({
            success: true,
            message: "Host property created successfully and pending approval",
            property: populatedHostProperty
        });

    } catch (error) {
        console.error("Error creating host property:", error);
        return res.status(500).json({
            success: false,
            message: "Error creating host property",
            error: error.message
        });
    }
};


export const getHostPropertiesController = async (req, res) => {
    try {
        const hostProperties = await HostProperty.find({ host: req.hostData._id })
            .populate('category', 'name image')
            .lean();

        res.status(200).json(hostProperties);
    } catch (error) {
        console.error("Error getting host properties:", error);
        return res.status(500).json({
            success: false,
            message: "Error getting host properties",
            error: error.message
        });
    }
};

export const getAllHostPropertiesController = async (req, res) => {
    try {
        const hostProperties = await HostProperty.find()
            .populate('category', 'name image')
            .lean();

        res.status(200).json(hostProperties);
    } catch (error) {
        console.error("Error getting all host properties:", error);
        return res.status(500).json({
            success: false,
            message: "Error getting all host properties",
            error: error.message
        });
    }
};

export const approveHostPropertyController = async (req, res) => {
    try {
        const { id } = req.params;

        // Find the host property
        const hostProperty = await HostProperty.findById(id);
        if (!hostProperty) {
            return res.status(404).json({
                success: false,
                message: "Host property not found"
            });
        }

        // Check if property is already approved
        if (hostProperty.status === 'approved') {
            return res.status(400).json({
                success: false,
                message: "Property is already approved"
            });
        }

        // Update the host property status
        hostProperty.status = 'approved';
        await hostProperty.save();

        // Calculate increased prices (11% increase)
        const increasedPrice = Math.round(hostProperty.price * 1.11);
        const increasedWeekendPrice = Math.round(hostProperty.weekendPrice * 1.11);

        // Create a new property in the Property model with increased prices
        const newProperty = new Property({
            title: hostProperty.title,
            category: hostProperty.category,
            price: increasedPrice,
            weekendPrice: increasedWeekendPrice,
            description: hostProperty.description,
            rules: hostProperty.rules,
            amenities: hostProperty.amenities,
            location: hostProperty.location,
            address: hostProperty.address,
            owner: hostProperty.owner,
            mainImage: hostProperty.mainImage,
            additionalImages: hostProperty.additionalImages,
            maxGuests: hostProperty.maxGuests,
            host: hostProperty.host,
            isActive: true
        });

        // Save the new property
        await newProperty.save();

        // Populate the response data
        const populatedHostProperty = await HostProperty.findById(id)
            .populate('category', 'name image')
            .populate('amenities', 'name icon')
            .populate('host', 'fullName email phoneNumber');

        return res.status(200).json({
            success: true,
            message: "Property approved successfully",
            property: populatedHostProperty
        });

    } catch (error) {
        console.error("Error approving host property:", error);
        return res.status(500).json({
            success: false,
            message: "Error approving host property",
            error: error.message
        });
    }
};

export const rejectHostPropertyController = async (req, res) => {
    try {
        const { id } = req.params;

        // Find the host property
        const hostProperty = await HostProperty.findById(id);
        if (!hostProperty) {
            return res.status(404).json({
                success: false,
                message: "Host property not found"
            });
        }

        // Check if property is already rejected
        if (hostProperty.status === 'rejected') {
            return res.status(400).json({
                success: false,
                message: "Property is already rejected"
            });
        }

        // Update the host property status
        hostProperty.status = 'rejected';
        await hostProperty.save();

        // Populate the response data
        const populatedHostProperty = await HostProperty.findById(id)
            .populate('category', 'name image')
            .populate('amenities', 'name icon')
            .populate('host', 'fullName email phoneNumber');

        return res.status(200).json({
            success: true,
            message: "Property rejected successfully",
            property: populatedHostProperty
        });

    } catch (error) {
        console.error("Error rejecting host property:", error);
        return res.status(500).json({
            success: false,
            message: "Error rejecting host property",
            error: error.message
        });
    }
};

