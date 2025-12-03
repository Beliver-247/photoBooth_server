import mongoose, { Schema, Document } from 'mongoose';

export interface ISession extends Document {
  eventId?: string;
  photoPublicIds: string[];
  finalReelPublicId?: string;
  slug?: string;
  downloadUrl?: string;
  email?: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SessionSchema: Schema = new Schema(
  {
    eventId: {
      type: String,
      default: null,
    },
    photoPublicIds: {
      type: [String],
      default: [],
    },
    finalReelPublicId: {
      type: String,
      default: null,
    },
    slug: {
      type: String,
      default: null,
    },
    downloadUrl: {
      type: String,
      default: null,
    },
    email: {
      type: String,
      default: null,
    },
    phone: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Create a sparse unique index on slug (allows multiple null values but enforces uniqueness for non-null values)
SessionSchema.index({ slug: 1 }, { unique: true, sparse: true });

export const Session = mongoose.model<ISession>('Session', SessionSchema);
