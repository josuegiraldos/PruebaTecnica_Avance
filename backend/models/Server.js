import cors from "cors";
import express from "express";
import rutas from "../routes/routes.js";

class Server {
  constructor() {
    this.app = express();
    this.port = process.env.PORT;
    this.paths = {
      pruebaPath: "/",
    };

    // Middlewares
    this.middlewares();

    //Routing
    this.routes();
  }

  middlewares() {
    // CORS
    this.app.use(cors());

    // Leer y parsear JSON en BODY
    this.app.use(express.json());

    // PUBLIC DIRECTORY
    this.app.use(express.static("public"));
  }

  routes() {
    this.app.use(this.paths.pruebaPath, rutas);
  }

  listen() {
    this.app.listen(this.port, () => {
      console.log(`Servidor corriendo en el puerto: ${this.port}`);
    });
  }
}

export default Server;
