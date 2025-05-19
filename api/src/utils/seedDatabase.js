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
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      ['Admin User', 'admin@example.com', 'admin123', 'admin']
    );
    console.log('Admin user created');
    
    // Create sample user
    await pool.execute(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      ['Sample User', 'user@example.com', 'user123', 'user']
    );
    console.log('Sample user created');
    
    // Seed signs data
    const signs = [
      { gestureName: 'Hello', description: 'A greeting gesture' },
      { gestureName: 'Thank You', description: 'A gesture of gratitude' },
      { gestureName: 'Yes', description: 'Affirmative response' },
      { gestureName: 'No', description: 'Negative response' },
      { gestureName: 'Please', description: 'A polite request' },
      { gestureName: 'Sorry', description: 'An apology' },
      { gestureName: 'Help', description: 'Asking for assistance' },
      { gestureName: 'Love', description: 'Expression of affection' },
      { gestureName: 'Friend', description: 'Referring to a friend' },
      { gestureName: 'Family', description: 'Referring to family' }
    ];
    
    for (const sign of signs) {
      await pool.execute(
        'INSERT INTO signs (gestureName, description) VALUES (?, ?)',
        [sign.gestureName, sign.description]
      );
    }
    console.log('Signs created');
    
    // Seed videos data
    const videoBaseFolder = '/uploads/videos/';
    const videos = [
      { title: 'How to Sign Hello', description: 'Tutorial for Hello sign', filePath: `${videoBaseFolder}hello.mp4`, signName: 'Hello' },
      { title: 'Thank You in Sign Language', description: 'Learn to say thank you', filePath: `${videoBaseFolder}thank_you.mp4`, signName: 'Thank You' },
      { title: 'Signing Yes', description: 'Quick tutorial on Yes', filePath: `${videoBaseFolder}yes.mp4`, signName: 'Yes' },
      { title: 'Signing No', description: 'Tutorial for No sign', filePath: `${videoBaseFolder}no.mp4`, signName: 'No' },
    ];
    
    for (const video of videos) {
      // Get the sign id
      const [signRows] = await pool.execute('SELECT id FROM signs WHERE gestureName = ?', [video.signName]);
      if (signRows.length > 0) {
        const signId = signRows[0].id;
        await pool.execute(
          'INSERT INTO videos (title, description, filePath, signId) VALUES (?, ?, ?, ?)',
          [video.title, video.description, video.filePath, signId]
        );
      }
    }
    console.log('Videos created');
    
    // Seed courses data
    const courses = [
      { title: 'Introduction to Sign Language', content: JSON.stringify({ 
        description: 'Basic introduction to sign language for beginners',
        duration: '2 weeks',
        level: 'Beginner'
      })},
      { title: 'Intermediate Sign Language', content: JSON.stringify({ 
        description: 'Advance your sign language skills',
        duration: '4 weeks',
        level: 'Intermediate'
      })},
      { title: 'Conversational Sign Language', content: JSON.stringify({ 
        description: 'Learn to have fluid conversations in sign language',
        duration: '6 weeks',
        level: 'Advanced'
      })}
    ];
    
    for (const course of courses) {
      await pool.execute(
        'INSERT INTO courses (title, content) VALUES (?, ?)',
        [course.title, course.content]
      );
    }
    console.log('Courses created');
    
    // Add signs to courses
    // Get course ids
    const [courseRows] = await pool.execute('SELECT id, title FROM courses');
    const courseMap = {};
    courseRows.forEach(course => {
      courseMap[course.title] = course.id;
    });
    
    // Get sign ids
    const [signRows] = await pool.execute('SELECT id, gestureName FROM signs');
    const signMap = {};
    signRows.forEach(sign => {
      signMap[sign.gestureName] = sign.id;
    });
    
    // Intro course signs
    const introCourse = courseMap['Introduction to Sign Language'];
    const introSigns = ['Hello', 'Thank You', 'Yes', 'No'];
    for (const sign of introSigns) {
      await pool.execute(
        'INSERT INTO course_sign (courseId, signId) VALUES (?, ?)',
        [introCourse, signMap[sign]]
      );
    }
    
    // Intermediate course signs
    const intermediateCourse = courseMap['Intermediate Sign Language'];
    const intermediateSigns = ['Please', 'Sorry', 'Help', 'Love'];
    for (const sign of intermediateSigns) {
      await pool.execute(
        'INSERT INTO course_sign (courseId, signId) VALUES (?, ?)',
        [intermediateCourse, signMap[sign]]
      );
    }
    
    // Advanced course signs - all signs
    const advancedCourse = courseMap['Conversational Sign Language'];
    for (const sign of Object.keys(signMap)) {
      await pool.execute(
        'INSERT INTO course_sign (courseId, signId) VALUES (?, ?) ON DUPLICATE KEY UPDATE courseId = courseId',
        [advancedCourse, signMap[sign]]
      );
    }
    console.log('Course-Sign relationships created');
    
    // Create enrollments
    // Get user ids
    const [userIdRows] = await pool.execute('SELECT id, name FROM users');
    const userMap = {};
    userIdRows.forEach(user => {
      userMap[user.name] = user.id;
    });
    
    // Enroll sample user in intro course
    await pool.execute(
      'INSERT INTO enrollments (userId, courseId) VALUES (?, ?)',
      [userMap['Sample User'], courseMap['Introduction to Sign Language']]
    );
    
    // Enroll admin in all courses
    for (const courseId of Object.values(courseMap)) {
      await pool.execute(
        'INSERT INTO enrollments (userId, courseId) VALUES (?, ?) ON DUPLICATE KEY UPDATE enrollmentDate = CURRENT_TIMESTAMP',
        [userMap['Admin User'], courseId]
      );
    }
    console.log('Enrollments created');
    
    // Create some interaction logs
    const interactions = [
      { userId: userMap['Sample User'], action: 'Logged in' },
      { userId: userMap['Sample User'], action: 'Viewed course: Introduction to Sign Language' },
      { userId: userMap['Sample User'], action: 'Practiced sign: Hello' },
      { userId: userMap['Admin User'], action: 'Added new sign: Family' },
      { userId: userMap['Admin User'], action: 'Updated course content' }
    ];
    
    for (const interaction of interactions) {
      await pool.execute(
        'INSERT INTO interaction_logs (userId, action) VALUES (?, ?)',
        [interaction.userId, interaction.action]
      );
    }
    console.log('Interaction logs created');
    
    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
};

seedDatabase();
