import { Router, type IRouter } from "express";
import healthRouter from "./health";
import liveStudioRouter from "./liveStudio";

const router: IRouter = Router();

router.use(healthRouter);
router.use(liveStudioRouter);

export default router;
