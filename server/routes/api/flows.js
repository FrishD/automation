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

// @route   POST api/flows/:id/history
// @desc    Save a snapshot of the flow
// @access  Public
router.post('/:id/history', async (req, res) => {
  try {
    const flow = await Flow.findById(req.params.id);
    if (!flow) {
      return res.status(404).json({ message: 'Flow not found' });
    }

    const snapshot = {
      nodes: req.body.nodes,
      edges: req.body.edges,
    };

    flow.history.push(snapshot);
    await flow.save();

    res.status(201).json(flow.history);
  } catch (err) {
    console.error('Error saving snapshot:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET api/flows/:id/history
// @desc    Get the history of a flow
// @access  Public
router.get('/:id/history', async (req, res) => {
    try {
        const flow = await Flow.findById(req.params.id);
        if (!flow) {
            return res.status(404).json({ message: 'Flow not found' });
        }
        res.json(flow.history);
    } catch (err) {
        console.error('Error fetching history:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT api/flows/:id/history/:historyId
// @desc    Restore a flow to a specific version
// @access  Public
router.put('/:id/history/:historyId', async (req, res) => {
    try {
        const flow = await Flow.findById(req.params.id);
        if (!flow) {
            return res.status(404).json({ message: 'Flow not found' });
        }

        const historyEntry = flow.history.id(req.params.historyId);
        if (!historyEntry) {
            return res.status(404).json({ message: 'History not found' });
        }

        flow.nodes = historyEntry.nodes;
        flow.edges = historyEntry.edges;

        await flow.save();

        res.json(flow);
    } catch (err) {
        console.error('Error restoring flow:', err);
        res.status(500).json({ message: 'Server error' });
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
