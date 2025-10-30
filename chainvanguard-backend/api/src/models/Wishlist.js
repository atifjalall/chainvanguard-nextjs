import mongoose from "mongoose";

const wishlistSchema = new mongoose.Schema(
  {
    // User who owns this wishlist
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    // Wishlist items
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        addedAt: {
          type: Date,
          default: Date.now,
          index: true,
        },
        notes: {
          type: String,
          maxlength: 200,
        },
        // Track price when added (for price drop notifications)
        priceWhenAdded: {
          type: Number,
          min: 0,
        },
        // Notification preferences for this item
        notifyOnPriceDrop: {
          type: Boolean,
          default: false,
        },
        notifyOnBackInStock: {
          type: Boolean,
          default: false,
        },
      },
    ],

    // Settings
    isPublic: {
      type: Boolean,
      default: false,
    },

    // Metadata
    lastModified: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
wishlistSchema.index({ userId: 1 });
wishlistSchema.index({ "items.productId": 1 });
wishlistSchema.index({ "items.addedAt": -1 });

// Update lastModified on save
wishlistSchema.pre("save", function (next) {
  this.lastModified = new Date();
  next();
});

// Virtual for item count
wishlistSchema.virtual("itemCount").get(function () {
  return this.items ? this.items.length : 0;
});

// Method to check if product is in wishlist
wishlistSchema.methods.hasProduct = function (productId) {
  return this.items.some(
    (item) => item.productId.toString() === productId.toString()
  );
};

// Method to get item by product ID
wishlistSchema.methods.getItem = function (productId) {
  return this.items.find(
    (item) => item.productId.toString() === productId.toString()
  );
};

// Method to remove product
wishlistSchema.methods.removeProduct = function (productId) {
  this.items = this.items.filter(
    (item) => item.productId.toString() !== productId.toString()
  );
  return this.save();
};

// Static method to get or create wishlist
wishlistSchema.statics.getOrCreate = async function (userId) {
  let wishlist = await this.findOne({ userId });

  if (!wishlist) {
    wishlist = new this({
      userId,
      items: [],
    });
    await wishlist.save();
  }

  return wishlist;
};

// Static method to cleanup deleted products
wishlistSchema.statics.cleanupDeletedProducts = async function () {
  const Product = mongoose.model("Product");

  const wishlists = await this.find();

  for (const wishlist of wishlists) {
    const validItems = [];

    for (const item of wishlist.items) {
      const product = await Product.findById(item.productId);
      if (product) {
        validItems.push(item);
      }
    }

    wishlist.items = validItems;
    await wishlist.save();
  }
};

export default mongoose.model("Wishlist", wishlistSchema);
