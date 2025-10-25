const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Schema for a single condition within a condition node
const ConditionSchema = new Schema({
  keyword: { type: String, required: true }
}, { _id: false });

const NodeDataSchema = new Schema({
  label: { type: String },
  text: { type: String },
  conditions: [ConditionSchema],
  language: { type: String }, // For 'listen' nodes
  variableName: { type: String }, // For 'variable' nodes
  value: { type: Schema.Types.Mixed }, // For 'variable' nodes
  duration: { type: Number }, // For 'wait' nodes
  audioUrl: { type: String }, // For 'play_audio' nodes
  confirmationText: { type: String }, // For 'confirmation' nodes
  summaryText: { type: String }, // For 'summary' nodes
  condition: { type: String }, // For 'loop' nodes
}, { _id: false, strict: false });


const NodeSchema = new Schema({
  id: { type: String, required: true },
  type: { type: String, required: true }, // e.g., 'start', 'speak', 'listen', 'condition'
  data: { type: NodeDataSchema, required: true },
  position: {
    x: { type: Number, required: true },
    y: { type: Number, required: true }
  }
}, { _id: false });

const EdgeSchema = new Schema({
  id: { type: String, required: true },
  source: { type: String, required: true },
  target: { type: String, required: true },
  sourceHandle: { type: String }, // For condition nodes, this will be the index of the condition
  label: { type: String }, // The keyword from the condition will now be stored on the edge label
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
  },
  history: [{
    nodes: [NodeSchema],
    edges: [EdgeSchema],
    savedAt: {
      type: Date,
      default: Date.now
    }
  }]
});

module.exports = mongoose.model('Flow', FlowSchema);
