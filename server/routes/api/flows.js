const express = require('express');
const router = express.Router();

// Load Flow model
const Flow = require('../../models/Flow');

// @route   GET api/flows
// @desc    Get all flows
// @access  Public
router.get('/', async (req, res) => {
  try {
    const flows = await Flow.find().sort({ createdAt: -1 });
    res.json(flows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST api/flows
// @desc    Create a new flow
// @access  Public
router.post('/', async (req, res) => {
  const newFlow = new Flow({
    name: req.body.name || 'Untitled Flow',
    nodes: req.body.nodes || [],
    edges: req.body.edges || []
  });

  try {
    const flow = await newFlow.save();
    res.status(201).json(flow);
  } catch (err) {
    res.status(400).json({ message: 'Error creating flow' });
  }
});

// @route   PUT api/flows/:id
// @desc    Update a flow
// @access  Public
router.put('/:id', async (req, res) => {
  try {
    const flow = await Flow.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        nodes: req.body.nodes,
        edges: req.body.edges
      },
      { new: true, runValidators: true }
    );

    if (!flow) {
      return res.status(404).json({ message: 'Flow not found' });
    }

    res.json(flow);
  } catch (err) {
    console.error('Error updating flow:', err); // Log the full error
    res.status(400).json({ message: 'Error updating flow', error: err.message });
  }
});

// @route   GET api/flows/:id
// @desc    Get a single flow
// @access  Public
router.get('/:id', async (req, res) => {
    try {
      const flow = await Flow.findById(req.params.id);
      if (!flow) {
        return res.status(404).json({ message: 'Flow not found' });
      }
      res.json(flow);
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  });


module.exports = router;
