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
            maxGuests,
            rooms
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
            rooms: Number(rooms),
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
            guests = 1,
            minPrice = 0,
            maxPrice = Number.MAX_SAFE_INTEGER,
            location // city name
        } = req.body;

        console.log("Search params:", { checkInDate, checkOutDate, guests, minPrice, maxPrice, location });

        // Build the base query object
        const query = { isActive: true };

        // Add guest filter
        if (guests) {
            query.maxGuests = { $gte: parseInt(guests) };
        }

        // Add price filter if provided
        if (minPrice !== undefined || maxPrice !== undefined) {
            query.price = {};
            if (minPrice !== undefined) query.price.$gte = parseInt(minPrice);
            if (maxPrice !== undefined) query.price.$lte = parseInt(maxPrice);
        }

        // Add location filter if provided
        if (location) {
            query['address.city'] = { $regex: new RegExp(location, 'i') };
        }

        // Add date filter if both dates are provided
        if (checkInDate && checkOutDate) {
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

            // Find properties where:
            // 1. No bookings exist, OR
            // 2. No booking conflicts with the requested dates
            query.$or = [
                { bookedDates: { $size: 0 } },
                {
                    bookedDates: {
                        $not: {
                            $elemMatch: {
                                checkIn: { $lt: checkOut },
                                checkOut: { $gt: checkIn }
                            }
                        }
                    }
                }
            ];
        }

        console.log("Final query:", JSON.stringify(query, null, 2));

        // Find properties that match the criteria
        const properties = await Property.find(query)
            .populate('category', 'name image')
            .populate('amenities', 'name icon iconUrl')
            .sort({ createdAt: -1 });

        console.log(`Found ${properties.length} properties`);

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

export const getActiveHostPropertiesController = async (req, res) => {
    try {
        // Get host ID from authenticated host data
        const hostId = req.hostData._id;

        // Find all properties for this host
        const properties = await Property.find({ host: hostId })
            .populate('category', 'name image')
            .populate('amenities', 'name icon iconUrl')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            message: "Host properties fetched successfully",
            properties,
            total: properties.length
        });
    } catch (error) {
        console.error("Error fetching host properties:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching host properties",
            error: error.message
        });
    }
}

export const blockDatesController = async (req, res) => {
    try {
        const { id } = req.params;
        const { blockedDates } = req.body;

        // Validate input
        if (!blockedDates || !Array.isArray(blockedDates) || blockedDates.length < 2) {
            return res.status(400).json({
                success: false,
                message: "Please provide at least two dates in the blockedDates array"
            });
        }

        // Find the property
        const property = await Property.findById(id);
        if (!property) {
            return res.status(404).json({
                success: false,
                message: "Property not found"
            });
        }

        // Verify the host owns this property
        if (property.host.toString() !== req.hostData._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to block dates for this property"
            });
        }

        // Get start and end dates
        const startDate = new Date(blockedDates[0]);
        const endDate = new Date(blockedDates[blockedDates.length - 1]);

        // Validate dates
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: "Invalid date format in blockedDates"
            });
        }

        if (startDate >= endDate) {
            return res.status(400).json({
                success: false,
                message: "End date must be after start date"
            });
        }

        // Add the blocked date range
        property.blockedDates.push({
            startDate,
            endDate
        });

        // Save the property
        await property.save();

        return res.status(200).json({
            success: true,
            message: "Dates blocked successfully",
            blockedDates: property.blockedDates
        });

    } catch (error) {
        console.error("Error blocking dates:", error);
        return res.status(500).json({
            success: false,
            message: "Error blocking dates",
            error: error.message
        });
    }
}

export const getBlockedDatesController = async (req, res) => {
    try {
        const hostId = req.hostData._id;

        // Find all properties owned by this host
        const properties = await Property.find({ host: hostId })
            .select('_id title mainImage blockedDates');

        if (!properties || properties.length === 0) {
            return res.status(200).json({
                success: true,
                message: "No properties found for this host",
                data: []
            });
        }

        // Format the response data
        const blockedDatesData = properties.map(property => ({
            propertyId: property._id,
            propertyTitle: property.title,
            propertyImage: property.mainImage,
            blockedDates: property.blockedDates.map(dateRange => ({
                id: dateRange._id,
                startDate: dateRange.startDate,
                endDate: dateRange.endDate
            }))
        }));

        return res.status(200).json({
            success: true,
            message: "Blocked dates fetched successfully",
            data: blockedDatesData
        });
    } catch (error) {
        console.error("Error fetching blocked dates:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching blocked dates",
            error: error.message
        });
    }
}
