const { pool, initializeDatabase } = require('../config/db');

/**
 * Seed the database with initial data for users, courses, course_sign, enrollments, and interaction_logs
 */
const seedDatabase = async () => {
  try {
    console.log('Seeding database...');

    // Ensure database tables exist
    await initializeDatabase();

    // Check if users table already has data
    const [userRows] = await pool.execute('SELECT COUNT(*) as count FROM users');
    if (userRows[0].count > 0) {
      console.log('Users table already has data, skipping user seeding');
    } else {
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
    }

    // Check if courses table already has data
    const [courseCountRows] = await pool.execute('SELECT COUNT(*) as count FROM courses');
    if (courseCountRows[0].count > 0) {
      console.log('Courses table already has data, skipping course seeding');
    } else {
      // Seed courses data
      const courses = [
        {
          title: 'Introduction to Sign Language',
          content: JSON.stringify({
            description: 'Basic introduction to sign language for beginners',
            duration: '2 weeks',
            level: 'Beginner',
          }),
        },
        {
          title: 'Intermediate Sign Language',
          content: JSON.stringify({
            description: 'Advance your sign language skills',
            duration: '4 weeks',
            level: 'Intermediate',
          }),
        },
        {
          title: 'Conversational Sign Language',
          content: JSON.stringify({
            description: 'Learn to have fluid conversations in sign language',
            duration: '6 weeks',
            level: 'Advanced',
          }),
        },
      ];

      for (const course of courses) {
        await pool.execute('INSERT INTO courses (title, content) VALUES (?, ?)', [
          course.title,
          course.content,
        ]);
      }
      console.log('Courses created');
    }

    // Get course and sign IDs for course_sign table
    const [courseDataRows] = await pool.execute('SELECT id, title FROM courses');
    const courseMap = {};
    courseDataRows.forEach((course) => {
      courseMap[course.title] = course.id;
    });

    const [signRows] = await pool.execute('SELECT id, gestureName FROM signs');
    const signMap = {};
    signRows.forEach((sign) => {
      signMap[sign.gestureName] = sign.id;
    });

    // Check if course_sign table already has data
    const [courseSignRows] = await pool.execute('SELECT COUNT(*) as count FROM course_sign');
    if (courseSignRows[0].count > 0) {
      console.log('Course_sign table already has data, skipping course_sign seeding');
    } else {
      // Intro course signs
      const introCourse = courseMap['Introduction to Sign Language'];
      const introSigns = ['Hello', 'Thank You', 'Yes', 'No'];
      for (const sign of introSigns) {
        if (signMap[sign]) {
          await pool.execute('INSERT INTO course_sign (courseId, signId) VALUES (?, ?)', [
            introCourse,
            signMap[sign],
          ]);
        }
      }

      // Intermediate course signs
      const intermediateCourse = courseMap['Intermediate Sign Language'];
      const intermediateSigns = ['Please', 'Sorry', 'Help', 'Love', 'Good', 'Bad', 'Work', 'School'];
      for (const sign of intermediateSigns) {
        if (signMap[sign]) {
          await pool.execute('INSERT INTO course_sign (courseId, signId) VALUES (?, ?)', [
            intermediateCourse,
            signMap[sign],
          ]);
        }
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
    }

    // Check if enrollments table already has data
    const [enrollmentRows] = await pool.execute('SELECT COUNT(*) as count FROM enrollments');
    if (enrollmentRows[0].count > 0) {
      console.log('Enrollments table already has data, skipping enrollment seeding');
    } else {
      // Get user IDs
      const [userIdRows] = await pool.execute('SELECT id, name FROM users');
      const userMap = {};
      userIdRows.forEach((user) => {
        userMap[user.name] = user.id;
      });

      // Enroll sample user in intro course
      await pool.execute('INSERT INTO enrollments (userId, courseId) VALUES (?, ?)', [
        userMap['Sample User'],
        courseMap['Introduction to Sign Language'],
      ]);

      // Enroll admin in all courses
      for (const courseId of Object.values(courseMap)) {
        await pool.execute(
          'INSERT INTO enrollments (userId, courseId) VALUES (?, ?) ON DUPLICATE KEY UPDATE enrollmentDate = CURRENT_TIMESTAMP',
          [userMap['Admin User'], courseId]
        );
      }
      console.log('Enrollments created');
    }

    // Check if interaction_logs table already has data
    const [interactionRows] = await pool.execute('SELECT COUNT(*) as count FROM interaction_logs');
    if (interactionRows[0].count > 0) {
      console.log('Interaction_logs table already has data, skipping interaction_logs seeding');
    } else {
      // Get user IDs
      const [userIdRows] = await pool.execute('SELECT id, name FROM users');
      const userMap = {};
      userIdRows.forEach((user) => {
        userMap[user.name] = user.id;
      });

      // Create some interaction logs
      const interactions = [
        { userId: userMap['Sample User'], action: 'Logged in' },
        { userId: userMap['Sample User'], action: 'Viewed course: Introduction to Sign Language' },
        { userId: userMap['Sample User'], action: 'Practiced sign: Hello' },
        { userId: userMap['Admin User'], action: 'Added new sign: Family' },
        { userId: userMap['Admin User'], action: 'Updated course content' },
      ];

      for (const interaction of interactions) {
        await pool.execute('INSERT INTO interaction_logs (userId, action) VALUES (?, ?)', [
          interaction.userId,
          interaction.action,
        ]);
      }
      console.log('Interaction logs created');
    }

    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
};

seedDatabase();