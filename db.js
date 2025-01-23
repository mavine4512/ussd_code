import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

let db; // Declare a variable to hold the database connection

export const connectToDatabase = async () => {
    try {
        db = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
        });
        console.log('USSD DB connected successfully');
        return db;
    } catch (err) {
        console.error('USSD DB connection failed:', err.message);
        process.exit(1); // Exit the application if the connection fails
    }
};

// Export the database instance
export const getDatabase = () => {
    if (!db) {
        throw new Error('Database is not connected. Call connectToDatabase first.');
    }
    return db;
};
