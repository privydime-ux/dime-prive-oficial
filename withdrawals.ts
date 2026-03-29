import { Router } from "express";
import { db } from "@workspace/db";
import { withdrawalsTable, modelsTable, notificationsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireModel } from "../lib/auth.js";
import { sendPix } from "../lib/efi.js";

const router = Router();

router.post("/request", requireModel, async (req, res) => {
  try {
    const user = (req as any).user;
    const { amount } = req.body;

    const models = await db.select().from(modelsTable).where(eq(modelsTable.id, user.modelId));
    const model = models[0];
    if (!model) { res.status(404).json({ error: "Perfil não encontrado" }); return; }

    const grossBalance = parseFloat(model.grossBalance as string) || 0;
    if (amount > grossBalance) {
      res.status(400).json({ error: "Saldo insuficiente" });
      return;
    }

    const { settingsTable } = await import("@workspace/db");
    const settings = await db.select().from(settingsTable).limit(1);
    const feeRate = settings[0] ? parseFloat(settings[0].withdrawalFeeRate as string) : 0.02;
    const autoLimit = settings[0] ? parseFloat(settings[0].autoWithdrawalLimit as string) : 450.00;

    const feeAmount = amount * feeRate;
    const netAmount = amount - feeAmount;

    const isAutomatic = netAmount < autoLimit;
    const status = isAutomatic ? "processing" : "pending_approval";

    const inserted = await db.insert(withdrawalsTable).values({
      modelId: user.modelId,
      grossAmount: amount.toFixed(2),
      feeAmount: feeAmount.toFixed(2),
      netAmount: netAmount.toFixed(2),
      pixKey: model.pixKey,
      status,
    }).returning();

    const withdrawal = inserted[0];

    await db.insert(notificationsTable).values({
      type: "withdrawal_request",
      message: `${model.artistName} solicitou saque de R$${netAmount.toFixed(2)} (${isAutomatic ? "automático" : "aguarda aprovação"})`,
    });

    if (isAutomatic) {
      const pixResult = await sendPix(model.pixKey, netAmount, withdrawal.id.toString());
      await db.update(withdrawalsTable).set({
        status: pixResult.success ? "completed" : "failed",
        processedAt: new Date(),
        efiTxid: pixResult.efiTxid || null,
      }).where(eq(withdrawalsTable.id, withdrawal.id));

      if (pixResult.success) {
        const currentBalance = parseFloat(model.grossBalance as string) || 0;
        await db.update(modelsTable).set({
          grossBalance: Math.max(0, currentBalance - amount).toFixed(2),
        }).where(eq(modelsTable.id, user.modelId));
      }

      res.json({
        success: true,
        status: pixResult.success ? "completed" : "failed",
        message: pixResult.success ? "Saque processado automaticamente" : "Falha no processamento",
        withdrawalId: withdrawal.id,
      });
      return;
    }

    res.json({
      success: true,
      status: "pending_approval",
      message: "Saque acima de R$450,00 — aguardando aprovação do administrador",
      withdrawalId: withdrawal.id,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.get("/history", requireModel, async (req, res) => {
  try {
    const user = (req as any).user;
    const withdrawals = await db.select({
      w: withdrawalsTable,
      m: modelsTable,
    }).from(withdrawalsTable)
      .leftJoin(modelsTable, eq(withdrawalsTable.modelId, modelsTable.id))
      .where(eq(withdrawalsTable.modelId, user.modelId))
      .orderBy(desc(withdrawalsTable.createdAt));

    res.json({
      withdrawals: withdrawals.map(({ w, m }) => ({
        id: w.id,
        modelId: w.modelId,
        artistName: m?.artistName || "—",
        pixKey: w.pixKey,
        grossAmount: parseFloat(w.grossAmount as string),
        feeAmount: parseFloat(w.feeAmount as string),
        netAmount: parseFloat(w.netAmount as string),
        status: w.status,
        createdAt: w.createdAt.toISOString(),
      }))
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

export default router;
