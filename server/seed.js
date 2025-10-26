const mongoose = require('mongoose');
const Flow = require('./models/Flow');

const MONGODB_URI = 'mongodb://localhost:27017/conversation-builder';

const seedDatabase = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected for seeding...');

    await Flow.deleteMany({});
    console.log('Cleared existing flows.');

    const nodes = [
      { id: 'start_node_0', type: 'start', position: { x: 50, y: 150 }, data: {} },
      { id: 'speak_node_1', type: 'speak', position: { x: 250, y: 150 }, data: { text: 'Hello, this is a test. Please say something.' } },
      { id: 'listen_node_2', type: 'listen', position: { x: 500, y: 150 }, data: { language: 'en' } },
      { id: 'end_node_3', type: 'end', position: { x: 750, y: 150 }, data: {} }
    ];

    const edges = [
      { id: 'e-start-speak', source: 'start_node_0', target: 'speak_node_1', type: 'default' },
      { id: 'e-speak-listen', source: 'speak_node_1', target: 'listen_node_2', type: 'default' },
      { id: 'e-listen-end', source: 'listen_node_2', target: 'end_node_3', type: 'default' }
    ];

    const flow = new Flow({
      name: 'Automated Test Flow',
      nodes,
      edges,
    });

    await flow.save();
    console.log('Database seeded with test flow!');

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
  }
};

seedDatabase();
