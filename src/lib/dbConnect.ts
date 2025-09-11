import mongoose from 'mongoose'

const dbConnect = async () => {
  if (mongoose.connections[0].readyState) return
  try {
    await mongoose.connect(process.env.MONGODB_URI as string)
    console.log('MongoDB connected successfully')
  } catch (error) {
    console.error('MongoDB connection error:', error)
    throw new Error('Failed to connect to the database')
  }
}

export default dbConnect;
