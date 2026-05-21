import mongoose from 'mongoose'

const dbConnect = async () => {
  if (mongoose.connections[0].readyState) return
  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error('MONGODB_URI is not set')
  }

  try {
    await mongoose.connect(uri)
    console.log('MongoDB connected successfully')
  } catch (error) {
    console.error('MongoDB connection error:', error)
    throw new Error('Failed to connect to the database')
  }
}

export default dbConnect;
