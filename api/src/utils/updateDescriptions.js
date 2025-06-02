const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sign_language_db',
  port: process.env.DB_PORT || 3306,
};

const signDescriptions = {
  'hello': 'A common greeting gesture',
  'thank': 'Express gratitude',
  'yes': 'Affirmative response',
  'no': 'Negative response',
  'please': 'Polite request',
  'sorry': 'Apologetic expression',
  'help': 'Request for assistance',
  'love': 'Expression of affection',
  'friend': 'Someone you care about',
  'family': 'Related people group',
  'good': 'Positive quality',
  'bad': 'Negative quality',
  'beautiful': 'Aesthetically pleasing',
  'happy': 'Feeling joy',
  'sad': 'Feeling sorrow',
  'eat': 'Consume food',
  'drink': 'Consume liquid',
  'sleep': 'Rest state',
  'work': 'Job or task',
  'school': 'Educational institution',
  'home': 'Place of residence',
  'car': 'Vehicle for transportation',
  'book': 'Reading material',
  'water': 'Clear liquid for drinking',
  'food': 'Nourishment',
  'money': 'Currency',
  'big': 'Large size',
  'small': 'Little size',
  'hot': 'High temperature',
  'new': 'Recently made',
  'old': 'Existing for a long time',
  'important': 'Of great significance',
  'learn': 'Acquire knowledge',
  'teach': 'Share knowledge',
  'student': 'Person learning',
  'teacher': 'Person instructing',
  'doctor': 'Medical professional',
  'hospital': 'Medical facility',
  'mother': 'Female parent',
  'father': 'Male parent',
  'brother': 'Male sibling',
  'sister': 'Female sibling',
  'child': 'Young person',
  'you': 'Second person pronoun',
  'i': 'First person pronoun',
  'what': 'Question word',
  'where': 'Location question',
  'go': 'Move from here',
  'come': 'Move to here',
  'stop': 'Cease movement',
  'start': 'Begin action',
  'finish': 'Complete task',
  'listen': 'Pay attention to sound',
  'speak': 'Communicate verbally',
  'read': 'Understand written text',
  'write': 'Create written text',
  'play': 'Engage in fun activity',
  'travel': 'Journey to places',
  'buy': 'Purchase something',
  'sell': 'Offer for payment',
  'need': 'Require something',
  'want': 'Desire something',
  'today': 'Current day',
  'tomorrow': 'Next day',
  'yesterday': 'Previous day',
  'morning': 'Early part of day',
  'night': 'Dark part of day',
  'week': 'Seven days',
  'month': 'Four weeks',
  'year': 'Twelve months',
  'always': 'At all times',
  'never': 'At no time',
  'sometimes': 'Occasionally',
  'often': 'Frequently',
  'now': 'At this moment',
  'later': 'At a future time',
  'again': 'One more time',
  'different': 'Not the same',
  'walk': 'Move on foot',
  'sit': 'Rest in chair',
  'stand': 'Be upright',
  'jump': 'Leap up',
  'room': 'Space in building',
  'door': 'Entrance barrier',
  'window': 'Glass opening',
  'house': 'Building for living',
  'store': 'Shop for buying',
  'bus': 'Public transport',
  'train': 'Rail transport',
  'airplane': 'Air transport'
};

async function updateDescriptions() {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    console.log('Updating sign descriptions...');
    
    for (const [gestureName, description] of Object.entries(signDescriptions)) {
      await connection.query(
        'UPDATE signs SET description = ? WHERE gestureName = ?',
        [description, gestureName]
      );
      console.log(`Updated: ${gestureName}`);
    }
    
    console.log('All descriptions updated successfully!');
  } catch (error) {
    console.error('Error updating descriptions:', error);
  } finally {
    await connection.end();
  }
}

updateDescriptions();
