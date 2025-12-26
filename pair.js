const { makeid } = require('./gen-id');
const express = require('express');
const fs = require('fs');
const path = require('path');
const pino = require("pino");
const {
    default: makeWASocket,
    useMultiFileAuthState,
    delay,
    Browsers,
    makeCacheableSignalKeyStore,
    isJidGroup 
} = require('@whiskeysockets/baileys');

const router = express.Router();

function removeFolder(folderPath) {
    if (fs.existsSync(folderPath)) {
        fs.rmSync(folderPath, { recursive: true, force: true });
    }
}

router.get('/', async (req, res) => {
    const id = makeid();
    const tempDir = path.join(__dirname, 'temp', id);
    const phoneNumber = (req.query.number || '').replace(/\D/g, '');

    if (!phoneNumber) {
        return res.status(400).send({ error: "Please provide a valid phone number" });
    }

    async function createSocketSession() {
        const { state, saveCreds } = await useMultiFileAuthState(tempDir);
        const logger = pino({ level: "fatal" });

        const sock = makeWASocket({
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, logger)
            },
            printQRInTerminal: false,
            logger,
            browser: Browsers.macOS("Safari")
        });

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on("connection.update", async (update) => {
            const { connection, lastDisconnect } = update;

            if (connection === "open") {
                await delay(5000);
                try {
                    const credsPath = path.join(tempDir, 'creds.json');
                    const sessionData = fs.readFileSync(credsPath, 'utf8');
                    const base64 = Buffer.from(sessionData).toString('base64');
                    const sessionId = "AWAIS-MAYO-MD~" + base64;

                    await sock.sendMessage(sock.user.id, { text: sessionId });

                    const successMsg = {
                        text: `🚀 *AWAIS-MAYO-MD SESSION CONNECTED!*\n\n` +
                              `*SESSION ID:* \`${sessionId}\`\n\n` +
                              `⚠️ *Warning:* Never share your session ID with anyone.\n\n` +
                              `🔗 *USEFUL LINKS:*\n` +
                              `▸ *YouTube:* https://youtube.com/@awaismayohacker009\n` +
                              `▸ *WhatsApp:* https://whatsapp.com/channel/0029VbBzlMlIt5rzSeMBE922\n` +
                              `▸ *Telegram:* https://t.me/awaishacking009\n` +
                              `▸ *GitHub:* https://github.com/awaismayoking009/AWAIS_MANO_CYBER_BTZ\n\n` +
                              `*Powered by Awais Mayo Hacker*`,
                        contextInfo: {
                            externalAdReply: {
                                title: "SYSTEM SECURED BY AWAIS",
                                body: "Session ID Generated Successfully",
                                mediaType: 1,
                                sourceUrl: "https://whatsapp.com/channel/0029VbBzlMlIt5rzSeMBE922"
                            }
                        }
                    };

                    await sock.sendMessage(sock.user.id, successMsg);

                } catch (err) {
                    console.error("Session Error:", err.message);
                } finally {
                    await delay(2000);
                    await sock.ws.close();
                    removeFolder(tempDir);
                    process.exit();
                }

            } else if (connection === "close" && lastDisconnect?.error?.output?.statusCode !== 401) {
                await delay(100);
                createSocketSession();
            }
        });

        if (!sock.authState.creds.registered) {
            await delay(1500);
            const pairingCode = await sock.requestPairingCode(phoneNumber);
            if (!res.headersSent) {
                return res.send({ code: pairingCode });
            }
        }
    }

    try {
        await createSocketSession();
    } catch (err) {
        console.error("Fatal Error:", err.message);
        removeFolder(tempDir);
        if (!res.headersSent) {
            res.status(500).send({ error: "Internal Server Error" });
        }
    }
});

module.exports = router;
