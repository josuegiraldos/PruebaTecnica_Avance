import { Router } from "express";
import { check } from "express-validator";
import { validateDocuments } from "../middlewares/validate.documents.js";
import { endpoint1, endpoint2, endpoint3, endpoint4, endpoint5, endpoint6, endpoint7 } from "../controllers/controllers.js";

const router = Router();

router.get("/endpoint1", endpoint1);

router.get("/endpoint2", endpoint2);

router.get("/endpoint3", endpoint3);

router.get("/endpoint4", endpoint4);

router.get("/endpoint5", endpoint5);

router.get("/endpoint6", endpoint6);

router.get("/endpoint7", endpoint7);

export default router;
