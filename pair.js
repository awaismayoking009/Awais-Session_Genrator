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

router.get('/', async (req, res) => {
    const id = makeid();
    const tempDir = path.join(__dirname, 'temp', id);
    const phoneNumber = (req.query.number || '').replace(/\D/g, '');

    async function createSocketSession() {
        const { state, saveCreds } = await useMultiFileAuthState(tempDir);
        const sock = makeWASocket({
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }))
            },
            printQRInTerminal: false,
            logger: pino({ level: "fatal" }),
            browser: Browsers.ubuntu("Chrome") // Fixes the link connection issue
        });

        sock.ev.on('creds.update', saveCreds);
        sock.ev.on("connection.update", async (update) => {
            const { connection } = update;
            if (connection === "open") {
                await delay(5000);
                const sessionData = fs.readFileSync(path.join(tempDir, 'creds.json'), 'utf8');
                const sessionId = "AWAIS-MAYO-MD~" + Buffer.from(sessionData).toString('base64');

                const msgText = `🚀 *AWAIS-MAYO-MD SESSION CONNECTED!*\n\n` +
                                `*SESSION ID:* \`${sessionId}\`\n\n` +
                                `⚠️ *Note:* Copy this ID and use it in your bot config.\n\n` +
                                `🔗 *CONTACT LINKS:*\n` +
                                `▸ *WhatsApp Channel:* https://whatsapp.com/channel/0029VbBzlMlIt5rzSeMBE922\n` +
                                `▸ *Admin:* +923295533214\n` +
                                `▸ *Telegram:* https://t.me/awaishacking009\n` +
                                `▸ *YouTube:* https://youtube.com/@awaismayohacker009\n\n` +
                                `*Powered by Awais Mayo Hacker*`;

                await sock.sendMessage(sock.user.id, { text: msgText });
                await delay(2000);
                process.exit();
            }
        });

        if (!sock.authState.creds.registered) {
            await delay(1500);
            const pairingCode = await sock.requestPairingCode(phoneNumber);
            if (!res.headersSent) res.send({ code: pairingCode });
        }
    }
    createSocketSession();
});
module.exports = router;

