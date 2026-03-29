import { Router } from "express";
import { db } from "@workspace/db";
import { paymentsTable, modelsTable, clientAccessTable, notificationsTable, settingsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { createPixCharge } from "../lib/efi.js";

const router = Router();

router.post("/create", async (req, res) => {
  try {
    const { modelId, clientToken } = req.body;

    const models = await db.select().from(modelsTable).where(eq(modelsTable.id, modelId));
    const model = models[0];
    if (!model) { res.status(404).json({ error: "Modelo não encontrada" }); return; }

    const settings = await db.select().from(settingsTable).limit(1);
    const valor = settings[0] ? parseFloat(settings[0].accessValue as string) : 2.00;
    const platformPixKey = settings[0]?.pixKey || process.env.EFI_PIX_KEY!;

    const txid = uuidv4().replace(/-/g, "").slice(0, 35);
    const expiresAt = new Date(Date.now() + 3600 * 1000);

    let qrCodeBase64 = "";
    let copiaCola = "";

    try {
      const pixResult = await createPixCharge(txid, valor, platformPixKey);
      qrCodeBase64 = pixResult.qrCodeBase64;
      copiaCola = pixResult.copiaCola;
    } catch (pixErr: any) {
      req.log.error({ err: pixErr }, "Efí Bank API error, using mock QR");
      qrCodeBase64 = "";
      copiaCola = `00020101021226930014BR.GOV.BCB.PIX0111${platformPixKey}5204000053039865802BR5925DIME PRIVY6009SAO PAULO62070503***63041234`;
    }

    await db.insert(paymentsTable).values({
      txid,
      modelId,
      clientIp: req.ip,
      clientToken: clientToken || null,
      valorPagoCliente: valor.toFixed(2),
      lucroPlatformaFixo: "2.00",
      saldoBrutoModelo: "0",
      status: "pending",
      paid: false,
      expiresAt,
      qrCodeBase64,
      copiaCola,
    });

    await db.insert(notificationsTable).values({
      type: "view",
      message: `Cliente visualizando perfil de ${model.artistName}`,
    });

    res.json({
      txid,
      qrCodeBase64,
      copiaCola,
      valor,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro ao criar cobrança" });
  }
});

router.get("/status/:txid", async (req, res) => {
  try {
    const { txid } = req.params;
    const payments = await db.select().from(paymentsTable).where(eq(paymentsTable.txid, txid));
    const payment = payments[0];
    if (!payment) { res.status(404).json({ error: "Pagamento não encontrado" }); return; }

    res.json({
      txid: payment.txid,
      status: payment.status,
      paid: payment.paid,
      modelId: payment.modelId,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.get("/check-access/:modelId", async (req, res) => {
  try {
    const modelId = parseInt(req.params.modelId);
    const clientToken = req.headers["x-client-token"] as string || req.query.token as string;

    if (!clientToken) {
      res.json({ hasAccess: false, accessToken: null });
      return;
    }

    const access = await db.select().from(clientAccessTable)
      .where(and(eq(clientAccessTable.modelId, modelId), eq(clientAccessTable.clientToken, clientToken)));

    res.json({ hasAccess: access.length > 0, accessToken: access.length > 0 ? clientToken : null });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

export default router;
