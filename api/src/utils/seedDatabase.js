const { pool, initializeDatabase } = require('../config/db');

/**
 * Seed the database with initial data
 */
const seedDatabase = async () => {
  try {
    console.log('Seeding database...');
    
    // Ensure database tables exist
    await initializeDatabase();
    
    // Check if we already have data
    const [userRows] = await pool.execute('SELECT COUNT(*) as count FROM users');
    if (userRows[0].count > 0) {
      console.log('Database already has data, skipping seed');
      return;
    }
    
    // Create admin user
    await pool.execute(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
      ['admin', 'admin@example.com', 'admin123', 'admin']
    );
    console.log('Admin user created');
    
    // Create sample user
    await pool.execute(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
      ['user', 'user@example.com', 'user123', 'user']
    );
    console.log('Sample user created');
    
    // Seed dictionary data
    const dictionaryEntries = [
      { gesture_name: 'Hello', description: 'A greeting gesture', example_image_url: '/images/hello.jpg' },
      { gesture_name: 'Thank You', description: 'A gesture of gratitude', example_image_url: '/images/thank_you.jpg' },
      { gesture_name: 'Yes', description: 'Affirmative response', example_image_url: '/images/yes.jpg' },
      { gesture_name: 'No', description: 'Negative response', example_image_url: '/images/no.jpg' },
      { gesture_name: 'Please', description: 'A polite request', example_image_url: '/images/please.jpg' },
      { gesture_name: 'Sorry', description: 'An apology', example_image_url: '/images/sorry.jpg' },
      { gesture_name: 'Help', description: 'Asking for assistance', example_image_url: '/images/help.jpg' },
      { gesture_name: 'Love', description: 'Expression of affection', example_image_url: '/images/love.jpg' },
      { gesture_name: 'Friend', description: 'Referring to a friend', example_image_url: '/images/friend.jpg' },
      { gesture_name: 'Family', description: 'Referring to family', example_image_url: '/images/family.jpg' }
    ];
    
    for (const entry of dictionaryEntries) {
      await pool.execute(
        'INSERT INTO sign_language_dictionary (gesture_name, description, example_image_url) VALUES (?, ?, ?)',
        [entry.gesture_name, entry.description, entry.example_image_url]
      );
    }
    console.log('Dictionary entries created');
    
    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
};

seedDatabase();
