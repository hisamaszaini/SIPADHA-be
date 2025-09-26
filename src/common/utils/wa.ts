import axios from 'axios';
import { PrismaClient, Setting } from '@prisma/client';

const prisma = new PrismaClient();

let cachedSetting: Setting | null = null;
let cachedAt: number | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 menit

// Ambil setting desa dengan caching
async function getSetting(): Promise<Setting> {
  const now = Date.now();
  if (cachedSetting && cachedAt && now - cachedAt < CACHE_TTL) {
    return cachedSetting;
  }

  const setting = await prisma.setting.findUnique({ where: { id: 1 } });
  if (!setting) throw new Error('Setting desa tidak ditemukan');

  cachedSetting = setting;
  cachedAt = now;
  return setting;
}

export function formatNoHp(noHp: string): string {
  let formatted = noHp.trim();

  if (formatted.startsWith('08')) {
    formatted = '62' + formatted.slice(1);
  }

  if (formatted.startsWith('+62')) {
    formatted = formatted.slice(1);
  }

  formatted = formatted.replace(/[\s\-]/g, '');
  return formatted;
}

/**
 * Kirim pesan teks ke nomor WhatsApp melalui bot.
 * BOT_URL dibaca dari Setting (cached)
 */
export async function sendTextMessage(noHp: string, message: string) {
  try {
    const setting = await getSetting();
    const botUrl = setting.endPointWa;
    if (!botUrl) throw new Error('Endpoint WA belum dikonfigurasi di setting desa');

    const finalNoHp = formatNoHp(noHp) + '@s.whatsapp.net';

    await axios.post(botUrl, {
      jid: finalNoHp,
      type: 'text',
      text: message,
    });
  } catch (error: any) {
    console.error('Gagal mengirim pesan WA:', error.response?.data || error.message);
  }
}
