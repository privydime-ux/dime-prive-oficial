import axios from "axios";
import https from "https";
import fs from "fs";
import os from "os";
import path from "path";

const CLIENT_ID = process.env.EFI_CLIENT_ID!;
const CLIENT_SECRET = process.env.EFI_CLIENT_SECRET!;
const BASE_URL = "https://pix.api.efipay.com.br";

let httpsAgent: https.Agent | null = null;

function getHttpsAgent(): https.Agent {
  if (httpsAgent) return httpsAgent;

  const certBase64 = process.env.EFI_CERT_BASE64;
  if (certBase64) {
    try {
      const certBuffer = Buffer.from(certBase64, "base64");
      const tmpPath = path.join(os.tmpdir(), "efi-cert.p12");
      fs.writeFileSync(tmpPath, certBuffer);
      httpsAgent = new https.Agent({
        pfx: certBuffer,
        passphrase: "",
        rejectUnauthorized: true,
      });
      return httpsAgent;
    } catch (err) {
      httpsAgent = new https.Agent({ rejectUnauthorized: false });
      return httpsAgent;
    }
  }
  httpsAgent = new https.Agent({ rejectUnauthorized: false });
  return httpsAgent;
}

let accessToken: string | null = null;
let tokenExpiry = 0;

async function getAccessToken(): Promise<string> {
  if (accessToken && Date.now() < tokenExpiry) {
    return accessToken;
  }

  const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
  const response = await axios.post(
    `${BASE_URL}/oauth/token`,
    { grant_type: "client_credentials" },
    {
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/json",
      },
      httpsAgent: getHttpsAgent(),
    }
  );

  accessToken = response.data.access_token;
  tokenExpiry = Date.now() + (response.data.expires_in - 60) * 1000;
  return accessToken!;
}

export async function createPixCharge(txid: string, valor: number, pixKey: string): Promise<{
  qrCodeBase64: string;
  copiaCola: string;
  txid: string;
  expiresAt: string;
}> {
  const token = await getAccessToken();
  const agent = getHttpsAgent();

  const expiracao = 3600;
  const expiresAt = new Date(Date.now() + expiracao * 1000).toISOString();

  await axios.put(
    `${BASE_URL}/v2/cob/${txid}`,
    {
      calendario: { expiracao },
      valor: { original: valor.toFixed(2) },
      chave: pixKey,
      infoAdicionais: [{ nome: "Plataforma", valor: "DIME PRIVY" }],
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      httpsAgent: agent,
    }
  );

  const qrResponse = await axios.get(
    `${BASE_URL}/v2/cob/${txid}/qrcode`,
    {
      headers: { Authorization: `Bearer ${token}` },
      httpsAgent: agent,
    }
  );

  return {
    qrCodeBase64: qrResponse.data.imagemQrcode || "",
    copiaCola: qrResponse.data.pixCopiaECola || qrResponse.data.qrcode || "",
    txid,
    expiresAt,
  };
}

export async function checkPixPayment(txid: string): Promise<{ paid: boolean; status: string }> {
  try {
    const token = await getAccessToken();
    const response = await axios.get(
      `${BASE_URL}/v2/cob/${txid}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        httpsAgent: getHttpsAgent(),
      }
    );
    const status = response.data.status;
    return { paid: status === "CONCLUIDA", status };
  } catch {
    return { paid: false, status: "ERROR" };
  }
}

export async function sendPix(pixKey: string, valor: number, txid: string): Promise<{ success: boolean; efiTxid?: string }> {
  try {
    const token = await getAccessToken();
    const response = await axios.post(
      `${BASE_URL}/v2/gn/pix`,
      {
        valor: valor.toFixed(2),
        chave: pixKey,
        descricao: `Saque DIME PRIVY - ${txid}`,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        httpsAgent: getHttpsAgent(),
      }
    );
    return { success: true, efiTxid: response.data.endToEndId };
  } catch {
    return { success: false };
  }
}

export async function registerWebhook(webhookUrl: string): Promise<{ success: boolean; message: string }> {
  try {
    const token = await getAccessToken();
    const pixKey = process.env.EFI_PIX_KEY!;

    await axios.put(
      `${BASE_URL}/v2/webhook/${encodeURIComponent(pixKey)}`,
      { webhookUrl },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        httpsAgent: getHttpsAgent(),
      }
    );
    return { success: true, message: "Webhook registrado com sucesso na Efí Bank" };
  } catch (err: any) {
    const msg = err?.response?.data?.mensagem || err?.response?.data?.message || err?.message || "Erro desconhecido";
    return { success: false, message: msg };
  }
}
