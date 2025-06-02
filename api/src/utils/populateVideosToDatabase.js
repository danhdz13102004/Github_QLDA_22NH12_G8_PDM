const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const dotenv = require('dotenv');
dotenv.config();

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sign_language_db',
  port: process.env.DB_PORT || 3306,
};

// Directory containing the dataset
const datasetDir = 'D:/Dataset';

async function populateDatabase() {
  console.log('Config: ', dbConfig)
  const connection = await mysql.createConnection(dbConfig);

  try {
    console.log('Connected to the database.');

    // Ensure tables exist (cấu trúc phù hợp với model)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS signs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        gestureName VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS videos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        filePath TEXT NOT NULL,
        signId INT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (signId) REFERENCES signs(id) ON DELETE CASCADE
      );
    `);

    // Kiểm tra xem thư mục dataset có tồn tại không
    if (!fs.existsSync(datasetDir)) {
      console.error(`Thư mục dataset không tồn tại: ${datasetDir}`);
      return;
    }

    // Read dataset directory
    const gestureDirs = fs.readdirSync(datasetDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory());

    console.log(`Tìm thấy ${gestureDirs.length} thư mục gesture`);

    for (const dir of gestureDirs) {
      const gestureName = dir.name;
      console.log(`Đang xử lý gesture: ${gestureName}`);

      try {
        // Insert hoặc get existing sign
        const [existingSign] = await connection.query(
          'SELECT id FROM signs WHERE gestureName = ?',
          [gestureName]
        );

        let signId;
        if (existingSign.length > 0) {
          signId = existingSign[0].id;
          console.log(`  - Sign đã tồn tại với ID: ${signId}`);
        } else {
          const [signResult] = await connection.query(
            'INSERT INTO signs (gestureName) VALUES (?)',
            [gestureName]
          );
          signId = signResult.insertId;
          console.log(`  - Tạo sign mới với ID: ${signId}`);
        }

        // Đường dẫn thư mục gesture
        const gestureDir = path.join(datasetDir, gestureName);
        
        // Kiểm tra thư mục có tồn tại không
        if (!fs.existsSync(gestureDir)) {
          console.log(`  - Thư mục không tồn tại: ${gestureDir}`);
          continue;
        }

        // Read video files (hỗ trợ nhiều định dạng video)
        const videoFiles = fs.readdirSync(gestureDir)
          .filter(file => {
            const ext = path.extname(file).toLowerCase();
            return ['.mp4', '.avi', '.mov', '.mkv', '.webm'].includes(ext);
          });

        console.log(`  - Tìm thấy ${videoFiles.length} video files`);

        for (const videoFile of videoFiles) {
          const filePath = path.join(datasetDir, gestureName, videoFile);
          const title = path.parse(videoFile).name; // Tên file không có extension

          try {
            // Kiểm tra xem video đã tồn tại chưa
            const [existingVideo] = await connection.query(
              'SELECT id FROM videos WHERE filePath = ?',
              [filePath]
            );

            if (existingVideo.length === 0) {
              // Insert video metadata
              await connection.query(
                'INSERT INTO videos (title, filePath, signId) VALUES (?, ?, ?)',
                [title, filePath, signId]
              );
              console.log(`    + Thêm video: ${videoFile}`);
            } else {
              console.log(`    - Video đã tồn tại: ${videoFile}`);
            }
          } catch (videoError) {
            console.error(`    ! Lỗi khi thêm video ${videoFile}:`, videoError.message);
          }
        }
      } catch (gestureError) {
        console.error(`Lỗi khi xử lý gesture ${gestureName}:`, gestureError.message);
      }
    }

    // Thống kê kết quả
    const [signCount] = await connection.query('SELECT COUNT(*) as count FROM signs');
    const [videoCount] = await connection.query('SELECT COUNT(*) as count FROM videos');
    
    console.log('\n=== Hoàn thành populate database ===');
    console.log(`Tổng số signs: ${signCount[0].count}`);
    console.log(`Tổng số videos: ${videoCount[0].count}`);

  } catch (error) {
    console.error('Lỗi khi populate database:', error);
  } finally {
    await connection.end();
    console.log('Đã đóng kết nối database.');
  }
}

// Chạy script
populateDatabase().catch(console.error);