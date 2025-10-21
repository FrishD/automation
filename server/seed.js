
const mongoose = require('mongoose');
const Flow = require('./models/Flow'); // Adjust the path as needed

const MONGO_URI = 'mongodb://localhost:27017/conversation-builder'; // Your DB name

const seedData = {
  name: 'Full Test Flow',
  nodes: [
    { id: 'start', type: 'start', position: { x: 50, y: 50 }, data: { label: 'Start' } },

    { id: 'speak_intro', type: 'speak', position: { x: 250, y: 50 }, data: { text: 'שלום! בוא נבדוק את הבלוקים החדשים.' } },

    { id: 'set_name', type: 'variable', position: { x: 450, y: 50 }, data: { variableAction: 'set', variableName: 'customer_name', variableValue: 'יולס' } },

    { id: 'confirm_name', type: 'confirmation', position: { x: 650, y: 50 }, data: { text: 'השם שלך הוא {customer_name}. האם זה נכון?' } },

    { id: 'speak_wrong', type: 'speak', position: { x: 850, y: 150 }, data: { text: 'אוקיי, נתחיל מחדש.' } },
    { id: 'end_wrong', type: 'end', position: { x: 1050, y: 150 }, data: { label: 'End' } },

    { id: 'play_sound', type: 'play_audio', position: { x: 850, y: 50 }, data: { url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' } },

    { id: 'wait', type: 'wait', position: { x: 1050, y: 50 }, data: { duration: 3, units: 'seconds' } },

    { id: 'loop', type: 'loop', position: { x: 1250, y: 50 }, data: { loopType: 'count', count: 2 } },

    { id: 'loop_speak', type: 'speak', position: { x: 1300, y: 150 }, data: { text: 'זוהי איטרציה של הלולאה.' } },

    { id: 'summary', type: 'summary', position: { x: 1450, y: 50 }, data: { text: 'הבדיקה הסתיימה בהצלחה. תודה, {customer_name}.', enableRating: true } },
  ],
  edges: [
    { id: 'e1', source: 'start', target: 'speak_intro' },
    { id: 'e2', source: 'speak_intro', target: 'set_name' },
    { id: 'e3', source: 'set_name', target: 'confirm_name' },
    { id: 'e4', source: 'confirm_name', sourceHandle: 'yes', target: 'play_sound' },
    { id: 'e5', source: 'confirm_name', sourceHandle: 'no', target: 'speak_wrong' },
    { id: 'e6', source: 'speak_wrong', target: 'end_wrong' },
    { id: 'e7', source: 'play_sound', target: 'wait' },
    { id: 'e8', source: 'wait', target: 'loop' },
    { id: 'e9', source: 'loop', sourceHandle: 'loop_start', target: 'loop_speak' },
    // Edge to go back to loop start (not perfectly supported by this linear model but will work for simulator)
    { id: 'e10', source: 'loop_speak', target: 'loop' },
    { id: 'e11', source: 'loop', sourceHandle: 'loop_exit', target: 'summary' },
  ],
};

const seedDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB Connected...');

    await Flow.deleteMany({}); // Clear existing data
    console.log('Cleared existing flows...');

    await Flow.create(seedData);
    console.log('Test flow seeded!');

  } catch (err) {
    console.error(err.message);
    process.exit(1);
  } finally {
    mongoose.connection.close();
  }
};

seedDB();
