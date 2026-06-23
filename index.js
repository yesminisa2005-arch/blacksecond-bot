const { default: makeWASocket, DisconnectReason, useMultiFileAuthState, getContentType } = require('@whiskeysockets/baileys')
const pino = require('pino')

const OWNER = ['2348137587041@s.whatsapp.net'] // Change to your WhatsApp number with country code, no +

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info')
    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        auth: state,
        printQRInTerminal: true
    })

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update
        if(connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode!== DisconnectReason.loggedOut
            if(shouldReconnect) startBot()
        } else if(connection === 'open') {
            console.log('Blacksecond-Bot connected ✅')
        }
    })

    // Welcome + Anti-link
    sock.ev.on('group-participants.update', async (update) => {
        const { id, participants, action } = update
        if(action === 'add'){
            await sock.sendMessage(id, { text: `Welcome @${participants[0].split('@')[0]}! 🎉` })
        }
    })

    sock.ev.on('messages.upsert', async m => {
        const msg = m.messages[0]
        if(!msg.message || msg.key.fromMe) return

        const from = msg.key.remoteJid
        const sender = msg.key.participant || from
        const isGroup = from.endsWith('@g.us')
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || ''
        const isOwner = OWNER.includes(sender)

        // Anti-link
        if(isGroup && text.includes('chat.whatsapp.com')){
            await sock.sendMessage(from, { text: 'Links not allowed here! ❌', delete: msg.key })
            // await sock.groupParticipantsUpdate(from, [sender], 'remove') // Uncomment to kick
        }

        // Commands
        if(text.startsWith('.')){
            const args = text.slice(1).split(' ')
            const cmd = args[0].toLowerCase()

            // Delete - reply to message with.delete
            if(cmd === 'delete' && msg.message.extendedTextMessage){
                await sock.sendMessage(from, { delete: msg.message.extendedTextMessage.contextInfo.stanzaId })
            }

            // Ban - reply with.ban
            if(cmd === 'ban' && isOwner && isGroup && msg.message.extendedTextMessage){
                const target = msg.message.extendedTextMessage.contextInfo.participant
                await sock.groupParticipantsUpdate(from, [target], 'remove')
                await sock.sendMessage(from, { text: 'Banned ❌' })
            }

            // Kick - reply with.kick
            if(cmd === 'kick' && isOwner && isGroup && msg.message.extendedTextMessage){
                const target = msg.message.extendedTextMessage.contextInfo.participant
                await sock.groupParticipantsUpdate(from, [target], 'remove')
                await sock.sendMessage(from, { text: 'Kicked 👢' })
            }

            // Promote - reply with.promote
            if(cmd === 'promote' && isOwner && isGroup && msg.message.extendedTextMessage){
                const target = msg.message.extendedTextMessage.contextInfo.participant
                await sock.groupParticipantsUpdate(from, [target], 'promote')
                await sock.sendMessage(from, { text: 'Promoted to admin ⭐' })
            }

            // Demote - reply with.demote
            if(cmd === 'demote' && isOwner && isGroup && msg.message.extendedTextMessage){
                const target = msg.message.extendedTextMessage.contextInfo.participant
                await sock.groupParticipantsUpdate(from, [target], 'demote')
                await sock.sendMessage(from, { text: 'Demoted ⬇️' })
            }

            // Mute - deletes any message after.mute
            if(cmd === 'mute' && isOwner && isGroup){
                // You can add mute logic here
                await sock.sendMessage(from, { text: 'Mute mode ON 🔇' })
            }

            // Quiz game
            if(cmd === 'quiz'){
                await sock.sendMessage(from, { text: 'Quiz: What is 5 +
}

startBot()
