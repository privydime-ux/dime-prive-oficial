import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, modelsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { hashPassword, comparePassword, signToken, requireAuth } from "../lib/auth.js";
import { saveBase64Image } from "../lib/storage.js";
import { notificationsTable } from "@workspace/db";

const router = Router();

const ADMIN_EMAIL = "dimeprivyoficial@gmail.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD!;

router.post("/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (role === "admin") {
      if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
        res.status(401).json({ error: "Credenciais inválidas" });
        return;
      }
      const token = signToken({ userId: 0, email: ADMIN_EMAIL, role: "admin", modelId: null });
      res.json({ token, role: "admin", name: "Administrador", modelId: null });
      return;
    }

    const users = await db.select().from(usersTable).where(eq(usersTable.email, email));
    const user = users[0];

    if (!user || !comparePassword(password, user.passwordHash)) {
      res.status(401).json({ error: "Email ou senha incorretos" });
      return;
    }

    if (user.role !== role && role !== "client") {
      res.status(401).json({ error: "Tipo de conta incorreto" });
      return;
    }

    let modelId: number | null = null;
    if (user.role === "model") {
      const models = await db.select().from(modelsTable).where(eq(modelsTable.userId, user.id));
      modelId = models[0]?.id ?? null;
    }

    const token = signToken({ userId: user.id, email: user.email, role: user.role, modelId });
    res.json({ token, role: user.role, name: user.name, modelId });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  const user = (req as any).user;
  res.json({ email: user.email, role: user.role, name: user.role === "admin" ? "Administrador" : user.email, modelId: user.modelId ?? null });
});

router.post("/logout", (_req, res) => {
  res.json({ success: true, message: "Logout realizado" });
});

router.post("/register-model", async (req, res) => {
  try {
    const { artistName, email, password, whatsapp, pixKey, selfieBase64 } = req.body;

    const existing = await db.select().from(usersTable).where(eq(usersTable.email, email));
    if (existing.length > 0) {
      res.status(400).json({ error: "Email já cadastrado" });
      return;
    }

    const passwordHash = hashPassword(password);
    const inserted = await db.insert(usersTable).values({
      email,
      passwordHash,
      role: "model",
      name: artistName,
    }).returning();

    const user = inserted[0];

    let selfieUrl: string | null = null;
    if (selfieBase64) {
      selfieUrl = await saveBase64Image(selfieBase64);
    }

    const modelInserted = await db.insert(modelsTable).values({
      userId: user.id,
      artistName,
      whatsapp,
      pixKey,
      selfieUrl,
      status: "pending",
      isOnline: false,
      isHidden: false,
      totalSales: 0,
      profileViews: 0,
      grossBalance: "0",
    }).returning();

    const model = modelInserted[0];

    await db.insert(notificationsTable).values({
      type: "kyc",
      message: `Nova criadora aguardando aprovação: ${artistName}`,
    });

    res.status(201).json({ success: true, message: "Cadastro enviado para aprovação", modelId: model.id });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro ao cadastrar" });
  }
});

export default router;
