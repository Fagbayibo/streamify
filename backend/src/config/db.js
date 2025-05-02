import mongoose from 'mongoose'
import "dotenv/config"

export const dbConnect = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI)
        console.log(`Mongodb connected:  ${conn.connection.host}`)
    } catch (error) {
        console.log('====================================');
        console.log(`Failed to connect to the datase`, error);
        console.log('====================================');
        process.exit(1)
    }
}