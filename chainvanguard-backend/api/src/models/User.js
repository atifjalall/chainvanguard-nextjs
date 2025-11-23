import mongoose, { Schema, model } from "mongoose";
import { genSalt, hash, compare } from "bcrypt";

const userSchema = new Schema(
  {
    // Basic Info
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    phone: { type: String, required: true },
    role: {
      type: String,
      enum: ["supplier", "vendor", "customer", "expert"],
      required: true,
      index: true,
    },

    // Authentication
    passwordHash: { type: String, required: true },
    walletAddress: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    walletName: { type: String, required: true },
    encryptedMnemonic: { type: String, required: true },

    // Address
    address: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    country: { type: String, default: "" },
    postalCode: { type: String, default: "" },

    // Business Info (for vendors/suppliers)
    companyName: { type: String, default: "" },
    businessType: { type: String, default: "" },
    registrationNumber: { type: String, default: "" },

    // Financial
    balance: { type: Number, default: 0, min: 0 },
    totalRevenue: { type: Number, default: 0, min: 0 },
    totalExpenses: { type: Number, default: 0, min: 0 },
    escrowBalance: { type: Number, default: 0, min: 0 },

    // Statistics
    totalTransactions: { type: Number, default: 0 },
    totalSales: { type: Number, default: 0 },
    totalPurchases: { type: Number, default: 0 },
    totalOrders: { type: Number, default: 0 },

    // Supplier Rating (for suppliers rated by vendors)
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    totalRatings: { type: Number, default: 0, min: 0 },

    // Status
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true, index: true },
    kycVerified: { type: Boolean, default: false },

    // Blockchain
    blockchainTxId: { type: String, default: "" },
    blockchainUserId: { type: String, default: "" },

    /**
     * Supplier-specific settings
     */
    supplierSettings: {
      // Auto-approve purchase requests from vendors
      autoApproveRequests: {
        type: Boolean,
        default: false,
      },

      // Minimum order value for auto-approval (in CVT)
      minOrderValue: {
        type: Number,
        default: 0,
        min: 0,
      },

      // Reward points system
      rewardPointsEnabled: {
        type: Boolean,
        default: true,
      },

      // How many reward points per 100 CVT spent
      rewardPointsRate: {
        type: Number,
        default: 1,
        min: 0,
      },

      // Discount percentage for reward points
      discountForRewards: {
        type: Number,
        default: 10,
        min: 0,
        max: 100,
      },

      // Business hours
      businessHours: {
        type: String,
        default: "9:00 AM - 6:00 PM",
      },

      // Response time (in hours)
      avgResponseTime: {
        type: Number,
        default: 24,
      },

      // Accepted payment methods
      acceptedPaymentMethods: {
        type: [String],
        default: ["wallet", "card"],
      },
    },

    /**
     * Vendor-specific settings
     */
    vendorSettings: {
      // Preferred suppliers
      preferredSuppliers: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],

      // Credit limit with suppliers
      creditLimit: {
        type: Number,
        default: 0,
        min: 0,
      },

      // Business license verification
      licenseVerified: {
        type: Boolean,
        default: false,
      },

      // Store description
      storeDescription: {
        type: String,
        maxlength: 500,
        default: "",
      },

      // Store banner/logo
      storeBanner: {
        type: String,
        default: "",
      },

      // Social media links
      socialLinks: {
        facebook: String,
        twitter: String,
        instagram: String,
        website: String,
      },

      // Operating hours
      operatingHours: {
        type: String,
        default: "Mon-Fri: 9AM-6PM",
      },
    },

    loyaltyPoints: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalSpent: {
      type: Number,
      default: 0,
      min: 0,
    },
    discountEligible: {
      type: Boolean,
      default: false,
    },

    // Supplier discount settings
    discountSettings: {
      pointsRequired: {
        type: Number,
        default: 1000,
        min: 0,
      },
      discountPercentage: {
        type: Number,
        default: 10,
        min: 0,
        max: 100,
      },
      enabled: {
        type: Boolean,
        default: true,
      },
    },

    settings: {
      type: Schema.Types.Mixed,
      default: {
        autoApproveRequests: false,
        notificationPreferences: {
          email: true,
          sms: false,
          push: true,
        },
      },
    },

    // Timestamps
    emailVerifiedAt: { type: Date, default: null },
    lastLoginAt: { type: Date, default: null },

    deactivatedAt: {
      type: Date,
    },
    deactivatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    deactivationReason: {
      type: String,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Indexes for performance
userSchema.index({ createdAt: -1 });
userSchema.index({ role: 1, isActive: 1 });

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await genSalt(10);
    this.password = await hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  return compare(candidatePassword, this.password);
};

// Don't return sensitive data in JSON
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.encryptedMnemonic;
  delete user.__v;
  return user;
};

// Static method to find by wallet
userSchema.statics.findByWallet = function (walletAddress) {
  return this.findOne({ walletAddress: walletAddress.toLowerCase() });
};

export default model("User", userSchema);
