import mongoose, { Schema, Document } from "mongoose";

export interface IBooking extends Document {
  bookingCode: string;
  userId: string;
  customerName: string;
  customerPhone: string;
  courtId: string;
  courtName: string;
  locationId: string;
  location: string;
  date: string;
  startTime: string;
  endTime: string;
  durationHours: number;
  regularHours: number;
  peakHours: number;
  totalPrice: number;
  paymentMethod: "transfer" | "onsite";
  status: "pending" | "confirmed" | "completed" | "cancelled";
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    bookingCode: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    customerPhone: {
      type: String,
      required: true,
      trim: true,
    },
    courtId: {
      type: String,
      required: true,
    },
    courtName: {
      type: String,
      required: true,
    },
    locationId: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    date: {
      type: String,
      required: true,
      index: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    durationHours: {
      type: Number,
      default: 1,
    },
    regularHours: {
      type: Number,
      default: 0,
    },
    peakHours: {
      type: Number,
      default: 0,
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ["transfer", "onsite"],
      default: "transfer",
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled"],
      default: "pending",
      index: true,
    },
    note: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast conflict checking
BookingSchema.index({ courtId: 1, date: 1, status: 1 });

export const Booking =
  mongoose.models.Booking || mongoose.model<IBooking>("Booking", BookingSchema);
