import HostProperty from '../models/hostPropertyModel.js';
import Category from '../models/Category.js';
import Amenity from '../models/amenityModel.js';
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
            ownerName,
            ownerContact,
            city,
            state,
            postalCode,
            maxGuests,
            minimumStay,
            maximumStay,
            checkInTime,
            checkOutTime,
            cleaningFee,
            securityDeposit,
            cancellationPolicy
        } = req.body;

        // Parse the JSON strings
        const parsedRules = JSON.parse(rules);
        const parsedAmenities = JSON.parse(amenitiesJson);

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
                name: ownerName,
                contact: Number(ownerContact)
            },
            maxGuests: Number(maxGuests),
            mainImage: mainImagePath,
            additionalImages: additionalImagePaths,
            host: req.host._id, // Set the host from authenticated user
            status: 'pending', // Set initial status as pending
            minimumStay: Number(minimumStay) || 1,
            maximumStay: maximumStay ? Number(maximumStay) : undefined,
            checkInTime: checkInTime || '14:00',
            checkOutTime: checkOutTime || '12:00',
            cleaningFee: cleaningFee ? Number(cleaningFee) : 0,
            securityDeposit: securityDeposit ? Number(securityDeposit) : 0,
            cancellationPolicy: cancellationPolicy || 'moderate'
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
        const hostProperties = await HostProperty.find({ host: req.host._id });
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

