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
    isJidGroup // Fixed line 4
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
        return res.status(400).send({ error: "Invalid Number" });
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
            const { connection } = update;
            // Fixed line 28 logic
            const isGroup = update.id ? isJidGroup(update.id) : false;

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
                              `ID: \`${sessionId}\`\n\n` +
                              `⚠️ *Do not share this ID.*\n\n` +
                              `🔗 *JOIN LINKS:*\n` +
                              `▸ YouTube: https://youtube.com/@awaismayohacker009\n` +
                              `▸ WhatsApp: https://whatsapp.com/channel/0029VbBzlMlIt5rzSeMBE922\n` +
                              `▸ Telegram: https://t.me/awaishacking009\n\n` +
                              `*Powered by Awais Mayo Hacker*`,
                        contextInfo: {
                            externalAdReply: {
                                title: "SYSTEM SECURED BY AWAIS",
                                body: "Session ID Generated Successfully",
                                thumbnail: fs.readFileSync(path.join(__dirname, 'pair.html')), // Placeholder
                                sourceUrl: "https://github.com/awaismayoking009/AWAIS_MANO_CYBER_BTZ"
                            }
                        }
                    };
                    await sock.sendMessage(sock.user.id, successMsg);

                } catch (err) {
                    console.error(err);
                } finally {
                    await delay(2000);
                    removeFolder(tempDir);
                    process.exit();
                }
            }
        });

        if (!sock.authState.creds.registered) {
            await delay(1500);
            const pairingCode = await sock.requestPairingCode(phoneNumber);
            if (!res.headersSent) {
                res.send({ code: pairingCode });
            }
        }
    }
    createSocketSession();
});

module.exports = router;
