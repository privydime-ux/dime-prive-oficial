import { Router } from "express";
import { db } from "@workspace/db";
import { modelsTable, photosTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireModel, requireAuth } from "../lib/auth.js";
import { saveBase64Image } from "../lib/storage.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const models = await db.select().from(modelsTable)
      .where(and(eq(modelsTable.status, "approved"), eq(modelsTable.isHidden, false)));
    res.json({
      models: models.map(m => ({
        id: m.id,
        artistName: m.artistName,
        bio: m.bio,
        profilePhoto: m.profilePhoto,
        status: m.status,
        isOnline: m.isOnline,
        totalSales: m.totalSales,
        createdAt: m.createdAt.toISOString(),
      }))
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.get("/me/profile", requireModel, async (req, res) => {
  try {
    const user = (req as any).user;
    const models = await db.select().from(modelsTable).where(eq(modelsTable.id, user.modelId));
    const model = models[0];
    if (!model) { res.status(404).json({ error: "Perfil não encontrado" }); return; }

    const photos = await db.select().from(photosTable).where(eq(photosTable.modelId, model.id));

    res.json({
      model: {
        id: model.id, artistName: model.artistName, bio: model.bio, profilePhoto: model.profilePhoto,
        status: model.status, isOnline: model.isOnline, totalSales: model.totalSales, createdAt: model.createdAt.toISOString(),
      },
      photos: photos.map(p => ({ id: p.id, url: p.url, createdAt: p.createdAt.toISOString() })),
      whatsapp: model.whatsapp,
      pixKey: model.pixKey,
      selfieUrl: model.selfieUrl,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.put("/me/profile", requireModel, async (req, res) => {
  try {
    const user = (req as any).user;
    const { bio, profilePhoto } = req.body;
    const updates: any = {};
    if (bio !== undefined) updates.bio = bio;
    if (profilePhoto !== undefined) {
      updates.profilePhoto = await saveBase64Image(profilePhoto);
    }
    await db.update(modelsTable).set(updates).where(eq(modelsTable.id, user.modelId));
    res.json({ success: true, message: "Perfil atualizado" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.post("/me/photos", requireModel, async (req, res) => {
  try {
    const user = (req as any).user;
    const { imageBase64 } = req.body;
    const url = await saveBase64Image(imageBase64);
    const inserted = await db.insert(photosTable).values({ modelId: user.modelId, url }).returning();
    res.status(201).json({ success: true, photoId: inserted[0].id, url });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro ao salvar foto" });
  }
});

router.delete("/me/photos/:photoId", requireModel, async (req, res) => {
  try {
    const user = (req as any).user;
    const photoId = parseInt(req.params.photoId);
    await db.delete(photosTable)
      .where(and(eq(photosTable.id, photoId), eq(photosTable.modelId, user.modelId)));
    res.json({ success: true, message: "Foto excluída" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.get("/me/stats", requireModel, async (req, res) => {
  try {
    const user = (req as any).user;
    const models = await db.select().from(modelsTable).where(eq(modelsTable.id, user.modelId));
    const model = models[0];
    if (!model) { res.status(404).json({ error: "Não encontrado" }); return; }
    const gross = parseFloat(model.grossBalance as string) || 0;
    const feeRate = 0.02;
    res.json({
      totalSales: model.totalSales,
      profileViews: model.profileViews,
      grossBalance: gross,
      availableBalance: gross,
      withdrawalFeeRate: feeRate,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const models = await db.select().from(modelsTable).where(eq(modelsTable.id, id));
    const model = models[0];
    if (!model || model.isHidden) { res.status(404).json({ error: "Modelo não encontrada" }); return; }

    await db.update(modelsTable).set({ profileViews: model.profileViews + 1 }).where(eq(modelsTable.id, id));

    const photos = await db.select().from(photosTable).where(eq(photosTable.modelId, id));

    const clientToken = req.headers["x-client-token"] as string || "";
    let hasAccess = false;
    if (clientToken) {
      const { clientAccessTable } = await import("@workspace/db");
      const access = await db.select().from(clientAccessTable)
        .where(and(eq(clientAccessTable.modelId, id), eq(clientAccessTable.clientToken, clientToken)));
      hasAccess = access.length > 0;
    }

    res.json({
      model: {
        id: model.id, artistName: model.artistName, bio: model.bio, profilePhoto: model.profilePhoto,
        status: model.status, isOnline: model.isOnline, totalSales: model.totalSales, createdAt: model.createdAt.toISOString(),
      },
      photos: photos.map(p => ({ id: p.id, url: p.url, createdAt: p.createdAt.toISOString() })),
      hasAccess,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

export default router;
