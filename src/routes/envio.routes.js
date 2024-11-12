import { Router } from "express";
import { getEnvioUser } from "../controllers/envio.controller.js";

const router = Router();

router.get('/envios/:identificacion', getEnvioUser);

export default router;