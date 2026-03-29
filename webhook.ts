import { Router } from "express";
import { db } from "@workspace/db";
import { paymentsTable, modelsTable, clientAccessTable, notificationsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

const router = Router();

router.post("/pix", async (req, res) => {
  try {
    req.log.info({ body: req.body }, "Webhook Pix recebido");

    const pixData = req.body?.pix;
    if (!Array.isArray(pixData)) {
      res.json({ ok: true });
      return;
    }

    for (const pix of pixData) {
      const txid = pix.txid;
      if (!txid) continue;

      const payments = await db.select().from(paymentsTable).where(eq(paymentsTable.txid, txid));
      const payment = payments[0];
      if (!payment || payment.paid) continue;

      await db.update(paymentsTable).set({
        paid: true,
        status: "paid",
        paidAt: new Date(),
      }).where(eq(paymentsTable.txid, txid));

      const valorPago = parseFloat(payment.valorPagoCliente as string);
      const lucroPlatforma = 2.00;
      const saldoModelo = Math.max(0, valorPago - lucroPlatforma);

      const models = await db.select().from(modelsTable).where(eq(modelsTable.id, payment.modelId));
      const model = models[0];
      if (model) {
        const currentBalance = parseFloat(model.grossBalance as string) || 0;
        await db.update(modelsTable).set({
          totalSales: model.totalSales + 1,
          grossBalance: (currentBalance + saldoModelo).toFixed(2),
        }).where(eq(modelsTable.id, payment.modelId));

        await db.update(paymentsTable).set({
          saldoBrutoModelo: saldoModelo.toFixed(2),
        }).where(eq(paymentsTable.txid, txid));

        const clientToken = payment.clientToken || uuidv4();
        await db.insert(clientAccessTable).values({
          modelId: payment.modelId,
          clientToken,
          paymentId: payment.id,
        });

        await db.insert(notificationsTable).values({
          type: "payment",
          message: `PIX DE R$ ${valorPago.toFixed(2)} RECEBIDO! Acesso liberado para ${model.artistName}`,
        });
      }
    }

    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.json({ ok: true });
  }
});

export default router;
