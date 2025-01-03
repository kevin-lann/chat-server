import express, { Express } from "express";
import { Server } from "http";
import userRouter from "./routes/authRoutes";
import { errorConverter, errorHandler } from "./middlewares";
import { connectDB } from "./database";
import config from "./config/config";
import { rabbitMQService } from "./services/RabbitMQService";
import swaggerjsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { swaggerOptions } from "./config/swaggerOptions";

const app: Express = express();
const HOST = "localhost"
let server: Server;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(userRouter);
app.use(errorConverter);
app.use(errorHandler);

const swaggerDocs = swaggerjsdoc(swaggerOptions)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs))

connectDB();

server = app.listen(config.PORT, () => {
    console.log(`Server is running at http://${HOST}:${config.PORT}`);
});

const initializeRabbitMQClient = async () => {
    try {
        await rabbitMQService.init()
        console.log("RabbitMQ client initiated and listening for messages")
    } catch(error) {
        console.error("Failed to init rabbitMQ client: ", error)
    }
}

initializeRabbitMQClient()

const exitHandler = () => {
    if (server) {
        server.close(() => {
            console.info("Server closed")
            process.exit(1)
        })
    }
    else {
        process.exit(1)
    }
}

const unexpectedErrorHandler = (error: unknown) => {
    console.error(error);
    exitHandler();
};

process.on("uncaughtException", unexpectedErrorHandler);
process.on("unhandledRejection", unexpectedErrorHandler);