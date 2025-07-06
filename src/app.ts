import express from 'express';
import authRoutes from './routes/authRoutes';
import trainingRoutes from './routes/trainingRoutes';
import userRoutes from './routes/userRoutes';
import dietRoutes from './routes/dietRoutes';
import productRoutes from './routes/productRoutes';

const app = express();

app.use(express.json());

// debugging para acessos feitos ao servidor
app.use(async (req, res, next) => {
    console.log(`${req.method} ${req.url}`);

    // Simulando delay alto para fins de demonstração
    // await new Promise(resolve => setTimeout(resolve, 3000));

    next();
});

app.use('/api', trainingRoutes);

app.use('/api', userRoutes);

app.use('/api', productRoutes);

app.use('/api', dietRoutes);

app.use('/api/auth', authRoutes);


export default app;