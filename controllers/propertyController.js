import Property from '../models/propertyModel.js';
import Category from '../models/Category.js';

export const createPropertyController = async (req, res) => {
    try {
        const {
            title,
            category,
            price,
            weekendPrice,
            description,
            rules,
            amenities,
            latitude,
            longitude,
            address,
            ownerName,
            ownerContact,
            city,
            state,
            postalCode,
            isActive
        } = req.body;

        // Find the category and increment its properties count
        const categoryDoc = await Category.findById(category);
        if (!categoryDoc) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        // Create the property with location coordinates
        const property = new Property({
            title,
            category,
            price,
            weekendPrice,
            description,
            rules,
            amenities,
            location: {
                type: 'Point',
                coordinates: [longitude, latitude] // MongoDB uses [longitude, latitude] order
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
            isActive
        });

        // Save the property
        const savedProperty = await property.save();

        // Increment the category's properties count
        categoryDoc.properties += 1;
        await categoryDoc.save();

        return res.status(201).json({
            success: true,
            message: "Property created successfully",
            property: savedProperty
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
        // Find all properties with populated category
        const properties = await Property.find()
            .populate('category', 'name image')
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
