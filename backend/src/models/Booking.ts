import mongoose, { Document, Schema } from "mongoose";

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled";

export type PaymentMethod =
  | "transfer"
  | "onsite";

export interface IBooking extends Document {
  userId: string;

  courtId: string;
  courtName: string;

  locationId: string;
  location: string;

  date: string;

  startTime: string;
  endTime: string;

  totalPrice: number;

  paymentMethod: PaymentMethod;

  status: BookingStatus;

  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema =
  new Schema<IBooking>(
    {
      userId: {
        type: String,
        required: true,
        index: true,
      },

      courtId: {
        type: String,
        required: true,
        index: true,
      },

      courtName: {
        type: String,
        required: true,
        trim: true,
      },

      locationId: {
        type: String,
        required: true,
        index: true,
      },

      location: {
        type: String,
        required: true,
        trim: true,
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

      totalPrice: {
        type: Number,
        required: true,
        min: 0,
      },

      paymentMethod: {
        type: String,
        enum: [
          "transfer",
          "onsite",
        ],
        required: true,
      },

      status: {
        type: String,
        enum: [
          "pending",
          "confirmed",
          "completed",
          "cancelled",
        ],
        default: "pending",
        index: true,
      },
    },
    {
      timestamps: true,
    }
  );

export const Booking =
  mongoose.models.Booking ||
  mongoose.model<IBooking>(
    "Booking",
    BookingSchema
  );