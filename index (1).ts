import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import modelsRouter from "./models.js";
import paymentsRouter from "./payments.js";
import webhookRouter from "./webhook.js";
import chatRouter from "./chat.js";
import adminRouter from "./admin.js";
import adminWebhookRouter from "./admin-webhook.js";
import withdrawalsRouter from "./withdrawals.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/models", modelsRouter);
router.use("/payments", paymentsRouter);
router.use("/webhook", webhookRouter);
router.use("/chat", chatRouter);
router.use("/admin", adminRouter);
router.use("/admin", adminWebhookRouter);
router.use("/withdrawals", withdrawalsRouter);

export default router;
