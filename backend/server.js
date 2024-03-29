import express from 'express'
import dotenv from 'dotenv'
import productRoutes from './routes/productRoutes.js'
import userRoutes from './routes/userRoutes.js'
import orderRoutes from './routes/orderRoutes.js'
import uploadRoutes from './routes/uploadRoutes.js'
import path from 'path'

import connectDB from './config/db.js'

import colors from 'colors'
import morgan from 'morgan'

import { notFound, errorHandler } from '../middleware/errorMiddleware.js'

const app = express()

dotenv.config()

// for accepting Body from Json
app.use(express.json())

const __dirname = path.resolve()
app.use('/uploads', express.static(path.join(__dirname, '/uploads')))

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '/frontend/build')))
  app.get('*', (req, res) =>
    res.sendFile(path.resolve(__dirname, 'frontend', 'build', 'index.html'))
  )
}

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
}

// // middleware setup
// app.use((req, res, next) => {
// 	console.log('HELLO');
// 	next();
// });

connectDB()

app.use('/api/products', productRoutes)
app.use('/api/users', userRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/upload', uploadRoutes)
app.get('/api/config/paypal', (req, res) =>
  res.send(process.env.PAYPAL_CLIENT_ID)
)

// 404
app.use(notFound)

// error middleware
app.use(errorHandler)

const PORT = process.env.PORT || 5000

app.listen(
  PORT,
  console.log(
    `Server running in ${process.env.NODE_ENV} on port ${PORT}`.yellow.bold
  )
)
