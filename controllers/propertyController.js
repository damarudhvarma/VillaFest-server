import Property from '../models/propertyModel.js';
import Category from '../models/Category.js';
import Amenity from '../models/amenityModel.js';


export const createPropertyController = async (req, res) => {
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
            isActive,
            maxGuests
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
        const mainImagePath = `/properties/${propertyTitle}/${req.files.mainImage[0].filename}`;
        const additionalImagePaths = req.files.additionalImages
            ? req.files.additionalImages.map(file => `/properties/${propertyTitle}/${file.filename}`)
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

        // Create the property with location coordinates and image paths
        const property = new Property({
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
            isActive,
            maxGuests: Number(maxGuests),
            mainImage: mainImagePath,
            additionalImages: additionalImagePaths
        });

        // Save the property
        const savedProperty = await property.save();

        // Increment the category's properties count
        categoryDoc.properties += 1;
        await categoryDoc.save();

        // Populate the saved property with category and amenities data
        const populatedProperty = await Property.findById(savedProperty._id)
            .populate('category', 'name image')
            .populate('amenities', 'name icon');

        return res.status(201).json({
            success: true,
            message: "Property created successfully",
            property: populatedProperty
        });

    } catch (error) {
        console.error("Error creating property:", error);
        return res.status(500).json({
            success: false,
            message: "Error creating property",
            error: error.message
        });
    }
};

export const getAllPropertiesController = async (req, res) => {
    try {
        // Find all properties with populated category and amenities
        const properties = await Property.find()
            .populate('category', 'name image')
            .populate('amenities', 'name icon iconUrl')
            .sort({ createdAt: -1 }); // Sort by newest first

        return res.status(200).json({
            success: true,
            message: "Properties fetched successfully",
            properties,
            total: properties.length
        });

    } catch (error) {
        console.error("Error fetching properties:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching properties",
            error: error.message
        });
    }
};

export const getPropertyByIdController = async (req, res) => {
    try {
        const { id } = req.params;
        const property = await Property.findById(id)
            .populate('category', 'name image')
            .populate('amenities', 'name icon iconUrl');


        if (!property) {
            return res.status(404).json({
                success: false,
                message: "Property not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Property fetched successfully",
            property
        });
    } catch (error) {
        console.error("Error fetching property:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching property",
            error: error.message
        });
    }
};

export const searchPropertiesController = async (req, res) => {
    try {
        const {
            checkInDate,
            checkOutDate,
            guests,
            minPrice,
            maxPrice,
            location // city name
        } = req.body;

        // Convert dates to Date objects
        const checkIn = new Date(checkInDate);
        const checkOut = new Date(checkOutDate);

        // Validate dates
        if (checkIn >= checkOut) {
            return res.status(400).json({
                success: false,
                message: "Check-out date must be after check-in date"
            });
        }

        // Build the query object
        const query = {
            maxGuests: { $gte: guests },
            price: { $gte: minPrice, $lte: maxPrice },
            isActive: true,
            $or: [
                // Properties with no bookings
                { bookedDates: { $size: 0 } },
                // Properties with bookings that don't overlap with requested dates
                {
                    bookedDates: {
                        $not: {
                            $elemMatch: {
                                $or: [
                                    // Check if any booking overlaps with the requested dates
                                    {
                                        checkIn: { $lte: checkOut },
                                        checkOut: { $gte: checkIn }
                                    }
                                ]
                            }
                        }
                    }
                }
            ]
        };

        // Add city filter if location is provided
        if (location) {
            query['address.city'] = { $regex: new RegExp(location, 'i') }; // Case-insensitive search
        }

        // Find properties that match the criteria
        const properties = await Property.find(query)
            .populate('category', 'name image')
            .populate('amenities', 'name icon iconUrl')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            message: "Properties fetched successfully",
            properties,
            total: properties.length
        });

    } catch (error) {
        console.error("Error searching properties:", error);
        return res.status(500).json({
            success: false,
            message: "Error searching properties",
            error: error.message
        });
    }
};

export const getCitiesController = async (req, res) => {
    try {
        // Find all properties and get unique cities
        const properties = await Property.find({}, 'address.city');

        // Extract unique cities and sort them
        const cities = [...new Set(properties.map(property => property.address.city))].sort();

        return res.status(200).json({
            success: true,
            message: "Cities fetched successfully",
            cities
        });

    } catch (error) {
        console.error("Error fetching cities:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching cities",
            error: error.message
        });
    }
};
