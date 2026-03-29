import { Router } from "express";
import { db } from "@workspace/db";
import { modelsTable, paymentsTable, notificationsTable, withdrawalsTable, settingsTable } from "@workspace/db";
import { eq, sql, desc } from "drizzle-orm";
import { requireAdmin } from "../lib/auth.js";

const router = Router();

router.get("/stats", requireAdmin, async (req, res) => {
  try {
    const allModels = await db.select().from(modelsTable);
    const allPayments = await db.select().from(paymentsTable).where(eq(paymentsTable.paid, true));
    const allWithdrawalsList = await db.select().from(withdrawalsTable);
    const pendingWithdrawals = allWithdrawalsList.filter(w => w.status === "pending_approval");

    const totalRevenue = allPayments.reduce((sum, p) => sum + parseFloat(p.lucroPlatformaFixo as string), 0);
    const totalWithdrawalFees = allWithdrawalsList.reduce((sum, w) => sum + parseFloat(w.feeAmount as string), 0);
    const volumeTransacted = allPayments.reduce((sum, p) => sum + parseFloat(p.valorPagoCliente as string), 0);

    const pendingKyc = allModels.filter(m => m.status === "pending").length;

    const topModels = [...allModels]
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, 3)
      .map(m => ({ id: m.id, artistName: m.artistName, sales: m.totalSales }));

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentPayments = allPayments.filter(p => p.paidAt && p.paidAt > sevenDaysAgo);
    const salesByDay: Record<string, { count: number; revenue: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      salesByDay[key] = { count: 0, revenue: 0 };
    }
    for (const p of recentPayments) {
      const key = p.paidAt!.toISOString().slice(0, 10);
      if (salesByDay[key]) {
        salesByDay[key].count++;
        salesByDay[key].revenue += parseFloat(p.valorPagoCliente as string);
      }
    }

    const totalViews = allModels.reduce((s, m) => s + m.profileViews, 0);
    const conversionRate = totalViews > 0 ? (allPayments.length / totalViews) * 100 : 0;

    res.json({
      totalRevenue,
      totalTransactions: allPayments.length,
      totalModels: allModels.length,
      pendingKyc,
      pendingWithdrawals: pendingWithdrawals.length,
      conversionRate,
      topModels,
      salesLast7Days: Object.entries(salesByDay).map(([date, v]) => ({ date, count: v.count, revenue: v.revenue })),
      totalWithdrawalFees,
      volumeTransacted,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.get("/models", requireAdmin, async (req, res) => {
  try {
    const { usersTable } = await import("@workspace/db");
    const result = await db.select({
      model: modelsTable,
      user: { email: usersTable.email },
    }).from(modelsTable).leftJoin(usersTable, eq(modelsTable.userId, usersTable.id));

    res.json({
      models: result.map(({ model: m, user }) => ({
        id: m.id,
        artistName: m.artistName,
        email: user?.email || "",
        whatsapp: m.whatsapp,
        pixKey: m.pixKey,
        status: m.status,
        isOnline: m.isOnline,
        selfieUrl: m.selfieUrl,
        profilePhoto: m.profilePhoto,
        bio: m.bio,
        totalSales: m.totalSales,
        grossBalance: parseFloat(m.grossBalance as string) || 0,
        createdAt: m.createdAt.toISOString(),
      }))
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.post("/models/:id/approve", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const models = await db.select().from(modelsTable).where(eq(modelsTable.id, id));
    await db.update(modelsTable).set({ status: "approved" }).where(eq(modelsTable.id, id));
    await db.insert(notificationsTable).values({
      type: "kyc_approved",
      message: `✅ Criadora ${models[0]?.artistName} foi aprovada`,
    });
    res.json({ success: true, message: "Modelo aprovada" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.post("/models/:id/reject", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const models = await db.select().from(modelsTable).where(eq(modelsTable.id, id));
    await db.update(modelsTable).set({ status: "rejected" }).where(eq(modelsTable.id, id));
    await db.insert(notificationsTable).values({
      type: "kyc_rejected",
      message: `❌ Criadora ${models[0]?.artistName} foi rejeitada`,
    });
    res.json({ success: true, message: "Modelo rejeitada" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.post("/models/:id/hide", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const models = await db.select().from(modelsTable).where(eq(modelsTable.id, id));
    const current = models[0];
    const newHidden = !current.isHidden;
    await db.update(modelsTable).set({ isHidden: newHidden }).where(eq(modelsTable.id, id));
    res.json({ success: true, message: newHidden ? "Modelo ocultada" : "Modelo visível" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.delete("/models/:id/delete", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(modelsTable).where(eq(modelsTable.id, id));
    res.json({ success: true, message: "Modelo excluída" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.get("/withdrawals", requireAdmin, async (req, res) => {
  try {
    const withdrawals = await db.select({
      w: withdrawalsTable,
      m: modelsTable,
    }).from(withdrawalsTable)
      .leftJoin(modelsTable, eq(withdrawalsTable.modelId, modelsTable.id))
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

router.post("/withdrawals/:id/authorize", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const withdrawals = await db.select().from(withdrawalsTable).where(eq(withdrawalsTable.id, id));
    const w = withdrawals[0];
    if (!w) { res.status(404).json({ error: "Não encontrado" }); return; }

    const { sendPix } = await import("../lib/efi.js");
    const pixResult = await sendPix(w.pixKey, parseFloat(w.netAmount as string), w.id.toString());

    await db.update(withdrawalsTable).set({
      status: pixResult.success ? "completed" : "failed",
      processedAt: new Date(),
      efiTxid: pixResult.efiTxid || null,
    }).where(eq(withdrawalsTable.id, id));

    const models = await db.select().from(modelsTable).where(eq(modelsTable.id, w.modelId));
    if (models[0] && pixResult.success) {
      const currentBalance = parseFloat(models[0].grossBalance as string) || 0;
      const deduct = parseFloat(w.grossAmount as string);
      await db.update(modelsTable).set({
        grossBalance: Math.max(0, currentBalance - deduct).toFixed(2),
      }).where(eq(modelsTable.id, w.modelId));
    }

    await db.insert(notificationsTable).values({
      type: "withdrawal",
      message: `💸 Saque de R$${parseFloat(w.netAmount as string).toFixed(2)} ${pixResult.success ? "autorizado e enviado" : "falhou"} — ${models[0]?.artistName}`,
    });

    res.json({ success: true, message: pixResult.success ? "Saque processado" : "Falha no envio" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.get("/settings", requireAdmin, async (req, res) => {
  try {
    const settings = await db.select().from(settingsTable).limit(1);
    if (!settings[0]) {
      res.json({
        pixKey: process.env.EFI_PIX_KEY || "",
        accessValue: 2.00,
        platformFee: 2.00,
        withdrawalFeeRate: 0.02,
        autoWithdrawalLimit: 450.00,
      });
      return;
    }
    const s = settings[0];
    res.json({
      pixKey: s.pixKey,
      accessValue: parseFloat(s.accessValue as string),
      platformFee: parseFloat(s.platformFee as string),
      withdrawalFeeRate: parseFloat(s.withdrawalFeeRate as string),
      autoWithdrawalLimit: parseFloat(s.autoWithdrawalLimit as string),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.put("/settings", requireAdmin, async (req, res) => {
  try {
    const { pixKey, accessValue, platformFee, withdrawalFeeRate, autoWithdrawalLimit } = req.body;
    const existing = await db.select().from(settingsTable).limit(1);
    const updates: any = { updatedAt: new Date() };
    if (pixKey !== undefined) updates.pixKey = pixKey;
    if (accessValue !== undefined) updates.accessValue = Number(accessValue).toFixed(2);
    if (platformFee !== undefined) updates.platformFee = Number(platformFee).toFixed(2);
    if (withdrawalFeeRate !== undefined) updates.withdrawalFeeRate = Number(withdrawalFeeRate).toFixed(4);
    if (autoWithdrawalLimit !== undefined) updates.autoWithdrawalLimit = Number(autoWithdrawalLimit).toFixed(2);

    if (existing[0]) {
      await db.update(settingsTable).set(updates).where(eq(settingsTable.id, existing[0].id));
    } else {
      await db.insert(settingsTable).values({
        pixKey: pixKey || process.env.EFI_PIX_KEY || "",
        accessValue: (accessValue || 2).toFixed(2),
        platformFee: (platformFee || 2).toFixed(2),
        withdrawalFeeRate: (withdrawalFeeRate || 0.02).toFixed(4),
        autoWithdrawalLimit: (autoWithdrawalLimit || 450).toFixed(2),
        updatedAt: new Date(),
      });
    }
    res.json({ success: true, message: "Configurações atualizadas" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.get("/notifications", requireAdmin, async (req, res) => {
  try {
    const notifications = await db.select().from(notificationsTable)
      .orderBy(desc(notificationsTable.createdAt))
      .limit(50);
    res.json({
      notifications: notifications.map(n => ({
        id: n.id,
        type: n.type,
        message: n.message,
        createdAt: n.createdAt.toISOString(),
      }))
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.post("/lockdown", requireAdmin, async (req, res) => {
  try {
    const { active } = req.body;
    const existing = await db.select().from(settingsTable).limit(1);
    if (existing[0]) {
      await db.update(settingsTable).set({ updatedAt: new Date() }).where(eq(settingsTable.id, existing[0].id));
    }
    await db.insert(notificationsTable).values({
      type: "lockdown",
      message: active ? "🔒 MODO LOCKDOWN ATIVADO — Vitrine ocultada pelo Arquiteto" : "🔓 MODO LOCKDOWN DESATIVADO — Vitrine restaurada",
    });

    if (active) {
      await db.update(modelsTable).set({ isHidden: true });
    } else {
      await db.update(modelsTable).set({ isHidden: false }).where(eq(modelsTable.status, "approved"));
    }

    res.json({ success: true, message: active ? "Lockdown ativado" : "Lockdown desativado" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

export default router;
