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
    makeCacheableSignalKeyStore
} = require('@whiskeysockets/baileys');

const router = express.Router();

router.get('/', async (req, res) => {
    const id = makeid();
    const tempDir = path.join('/tmp', id); // Vercel safe directory
    const phoneNumber = (req.query.number || '').replace(/\D/g, '');

    if (!phoneNumber) return res.status(400).send({ error: "Invalid Number" });

    async function startPairing() {
        const { state, saveCreds } = await useMultiFileAuthState(tempDir);
        const sock = makeWASocket({
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }))
            },
            printQRInTerminal: false,
            logger: pino({ level: "fatal" }),
            browser: ["Ubuntu", "Chrome", "20.0.04"] // Standard browser fix
        });

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on("connection.update", async (update) => {
            const { connection } = update;
            if (connection === "open") {
                await delay(3000);
                const sessionData = fs.readFileSync(path.join(tempDir, 'creds.json'), 'utf8');
                const sessionId = "AWAIS-MAYO-MD~" + Buffer.from(sessionData).toString('base64');

                const successMsg = `🚀 *AWAIS-MAYO-MD CONNECTED!*\n\n*ID:* \`${sessionId}\`\n\n▸ *Channel:* https://whatsapp.com/channel/0029VbBzlMlIt5rzSeMBE922\n▸ *Admin:* +923295533214\n\n*Powered by Awais Mayo*`;
                
                await sock.sendMessage(sock.user.id, { text: successMsg });
                console.log("Session Saved Successfully");
                process.exit(0);
            }
        });

        if (!sock.authState.creds.registered) {
            await delay(1000);
            try {
                const code = await sock.requestPairingCode(phoneNumber);
                if (!res.headersSent) res.send({ code });
            } catch (err) {
                if (!res.headersSent) res.status(500).send({ error: "Service Busy" });
            }
        }
    }
    startPairing();
});

module.exports = router;
