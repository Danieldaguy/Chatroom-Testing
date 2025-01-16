import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Chatroom() {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [username, setUsername] = useState('');

    useEffect(() => {
        fetchMessages();

        const channel = supabase
            .channel('realtime:messages') // Create a new channel
            .on(
                'postgres_changes', // Listen to changes
                { event: 'INSERT', schema: 'public', table: 'messages' }, // Subscribe to insert events
                (payload) => {
                    setMessages((prev) => [...prev, payload.new]);
                }
            )
            .subscribe(); // Subscribe to real-time updates

        // Cleanup on component unmount
        return () => {
            supabase.removeChannel(channel); // Remove the channel when component unmounts
        };
    }, []);

    const fetchMessages = async () => {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching messages:', error);
            return;
        }

        setMessages(data || []);
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