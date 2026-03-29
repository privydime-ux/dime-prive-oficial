import { Router } from "express";
import { db } from "@workspace/db";
import { chatMessagesTable, clientAccessTable, modelsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

router.get("/:modelId/messages", async (req, res) => {
  try {
    const modelId = parseInt(req.params.modelId);
    const clientToken = req.headers["x-client-token"] as string || "";

    if (!clientToken) {
      res.status(401).json({ error: "Token de acesso necessário" });
      return;
    }

    const access = await db.select().from(clientAccessTable)
      .where(and(eq(clientAccessTable.modelId, modelId), eq(clientAccessTable.clientToken, clientToken)));

    const authHeader = req.headers.authorization;
    const isModel = !!authHeader;

    if (!access.length && !isModel) {
      res.status(403).json({ error: "Acesso VIP necessário" });
      return;
    }

    const messages = await db.select().from(chatMessagesTable)
      .where(eq(chatMessagesTable.modelId, modelId));

    const models = await db.select().from(modelsTable).where(eq(modelsTable.id, modelId));

    res.json({
      messages: messages.map(m => ({
        id: m.id,
        senderRole: m.senderRole,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
      })),
      modelOnline: models[0]?.isOnline || false,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.post("/:modelId/messages", async (req, res) => {
  try {
    const modelId = parseInt(req.params.modelId);
    const { content } = req.body;
    const clientToken = req.headers["x-client-token"] as string || "";

    const access = await db.select().from(clientAccessTable)
      .where(and(eq(clientAccessTable.modelId, modelId), eq(clientAccessTable.clientToken, clientToken)));

    const authHeader = req.headers.authorization;
    const isModel = !!authHeader;
    const senderRole = isModel ? "model" : "client";

    if (!access.length && !isModel) {
      res.status(403).json({ error: "Acesso VIP necessário" });
      return;
    }

    const inserted = await db.insert(chatMessagesTable).values({
      modelId,
      clientToken: clientToken || "model",
      senderRole,
      content,
    }).returning();

    const msg = inserted[0];
    res.status(201).json({
      id: msg.id,
      senderRole: msg.senderRole,
      content: msg.content,
      createdAt: msg.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

export default router;
