const mongoose = require('mongoose');

const removeRequestSchema = new mongoose.Schema({
  website: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Website',
    required: [true, 'Website is required'],
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/\S+@\S+\.\S+/, 'Please use a valid email address'],
  },
  domainUrl: {
    type: String,
    required: [true, 'Domain URL is required'],
    trim: true,
  },
  reason: {
    type: String,
    required: [true, 'Reason is required'],
    trim: true,
    maxlength: [1000, 'Reason cannot exceed 1000 characters'],
  },
  removeOption: {
    type: String,
    required: [true, 'Remove option is required'],
    trim: true,
  },
  nospam: {
    type: String,
    default: null,
    trim: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  createdAt: { type: Date, default: Date.now },
});

const RemoveRequest = mongoose.model('RemoveRequest', removeRequestSchema);
module.exports = RemoveRequest;
