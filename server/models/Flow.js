const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Schema for a single condition within a condition node
const ConditionSchema = new Schema({
  keyword: { type: String, required: true }
}, { _id: false });

const NodeDataSchema = new Schema({
  label: { type: String }, // Display name for the node in the UI
  text: { type: String }, // For 'speak', 'confirmation', 'summary' nodes
  conditions: [ConditionSchema], // For 'condition' nodes

  // Fields for 'wait' node
  duration: { type: Number },
  units: { type: String, enum: ['seconds', 'minutes'] },

  // Fields for 'loop' node
  loopType: { type: String, enum: ['count', 'condition'] },
  count: { type: Number },
  variable: { type: String }, // variable name for condition
  operator: { type: String }, // e.g., '==', '!=', '<', '>'
  value: { type: Schema.Types.Mixed }, // value for condition

  // Fields for 'variable' node
  variableAction: { type: String, enum: ['set', 'save_last_response'] },
  variableName: { type: String },
  variableValue: { type: Schema.Types.Mixed }, // value to set

  // Fields for 'play_audio' node
  url: { type: String },

  // Fields for 'summary' node
  enableRating: { type: Boolean }
}, { _id: false });


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
  }
});

module.exports = mongoose.model('Flow', FlowSchema);
