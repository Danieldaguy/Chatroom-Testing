import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Chatroom() {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [username, setUsername] = useState('');

    useEffect(() => {
        fetchMessages();
        const subscription = supabase
            .from('messages')
            .on('INSERT', (payload) => {
                setMessages((prev) => [...prev, payload.new]);
            })
            .subscribe();

        return () => supabase.removeSubscription(subscription);
    }, []);

    const fetchMessages = async () => {
        const { data } = await supabase
            .from('messages')
            .select('*')
            .order('created_at', { ascending: true });
        setMessages(data);
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !username.trim()) return;

        await supabase
            .from('messages')
            .insert([{ username, message: newMessage }]);
        setNewMessage('');
    };

    return (
        <div style={{ padding: '20px' }}>
            <h1>Chatroom</h1>
            <form onSubmit={sendMessage}>
                <input
                    type="text"
                    placeholder="Your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />
                <input
                    type="text"
                    placeholder="Type a message"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    required
                />
                <button type="submit">Send</button>
            </form>
            <div style={{ marginTop: '20px' }}>
                {messages.map((msg) => (
                    <div key={msg.id}>
                        <strong>{msg.username}:</strong> {msg.message}
                    </div>
                ))}
            </div>
        </div>
    );
}
