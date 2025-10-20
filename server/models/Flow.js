const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// This schema is designed to be flexible and store the state of a flow-based editor.
// It's inspired by the data structure used by libraries like React Flow.

const NodeSchema = new Schema({
  id: { type: String, required: true },
  type: { type: String, required: true },
  data: { type: Object, required: true },
  position: {
    x: { type: Number, required: true },
    y: { type: Number, required: true }
  }
}, { _id: false });

const EdgeSchema = new Schema({
  id: { type: String, required: true },
  source: { type: String, required: true },
  target: { type: String, required: true },
  label: { type: String } // The "trigger" text will be stored here
}, { _id: false });

const FlowSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  nodes: [NodeSchema],
  edges: [EdgeSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Flow', FlowSchema);
