const fetch = require('node-fetch');

const BACKEND_URL = 'https://fashion-backend-93lh.onrender.com';

async function createTestChat() {
    console.log("Creating test session for Hau Phuc...");
    
    // 1. Create Session
    const sessionRes = await fetch(`${BACKEND_URL}/api/chats/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            customer_name: 'Hau Phuc',
            phone: '0987654321'
        })
    });
    
    const sessionData = await sessionRes.json();
    if (!sessionData.success) {
        console.error("Failed to create session:", sessionData);
        return;
    }
    const sessionId = sessionData.session.id;
    console.log(`Session created! ID: ${sessionId}`);
    
    // 2. Send Message 1
    console.log("Sending first message from customer...");
    await fetch(`${BACKEND_URL}/api/chats/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            session_id: sessionId,
            sender_type: 'user',
            message: 'Chào shop, áo thun màu đen size L còn hàng không ạ?'
        })
    });
    
    // 3. Send AI Reply
    console.log("Simulating AI bot reply...");
    await fetch(`${BACKEND_URL}/api/chats/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            session_id: sessionId,
            sender_type: 'bot',
            message: 'Dạ chào bạn Hau Phuc! Mình là trợ lý AI của cửa hàng. Áo thun màu đen size L hiện vẫn đang còn hàng ạ. Bạn có muốn mình hỗ trợ đặt hàng luôn không ạ?'
        })
    });
    
    // 4. Send Message 2
    console.log("Sending second message from customer...");
    await fetch(`${BACKEND_URL}/api/chats/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            session_id: sessionId,
            sender_type: 'user',
            message: 'Để mình xem thêm đã nha. Cảm ơn shop!'
        })
    });

    console.log("Done! You should now see 'Hau Phuc' in the Admin panel.");
}

createTestChat();
