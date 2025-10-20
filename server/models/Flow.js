const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// A more structured schema for the node's data payload,
// allowing for different properties based on the node type.
const NodeDataSchema = new Schema({
  label: { type: String, required: true }, // A display name for the node

  // Properties specific to node types
  text: { type: String }, // For 'speak' nodes
  conditions: [{ // For 'condition' nodes
    keyword: { type: String, required: true },
    targetNodeId: { type: String, required: true }
  }],

  // You can add more type-specific fields here as needed
  // e.g., transferTo: { type: String } for a 'transfer' node

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
  sourceHandle: { type: String }, // To support multiple output points from a node (e.g., conditions)
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
