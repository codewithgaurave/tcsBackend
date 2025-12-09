import mongoose from "mongoose";

const contactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot be more than 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please add a valid email",
      ],
    },
    phone: {
      type: Number,
      required: [true, "Phone number is required"],
      trim: true,
      match: [/^[\+]?[1-9][\d]{0,15}$/, "Please add a valid phone number"],
    },
    company: {
      type: String,
      trim: true,
      maxlength: [100, "Company name cannot be more than 100 characters"],
    },
    subject: {
      type: String,
      required: [true, "subject is required"],
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
      maxlength: [2000, "Message cannot be more than 2000 characters"],
    }
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
contactSchema.index({ status: 1, createdAt: -1 });
contactSchema.index({ email: 1 });
contactSchema.index({ assignedTo: 1 });

// Static method to get contact stats
contactSchema.statics.getStats = async function () {
  const stats = await this.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const total = await this.countDocuments();

  return {
    total,
    byStatus: stats.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {}),
  };
};

export default mongoose.model("Contact", contactSchema);
