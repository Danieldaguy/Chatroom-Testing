import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import '../styles/globals.css';
import Modal from 'react-modal'; // Modal library for profile picture upload
import { sendFileToSupabase } from '../utils/uploadFile'; // File upload helper

Modal.setAppElement('#chat-container'); // Initialize Modal

export default function Chatroom() {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [username, setUsername] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [profilePic, setProfilePic] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [fileToUpload, setFileToUpload] = useState(null);
    const [roles, setRoles] = useState([]); // To store user roles
    const [status, setStatus] = useState(''); // Profile Status
    const [channelMessages, setChannelMessages] = useState([]); // For channel messages
    const [directMessages, setDirectMessages] = useState([]); // For direct messages
    const [onlineUsers, setOnlineUsers] = useState([]); // For online users management

    useEffect(() => {
        fetchMessages();
        fetchRoles();
        fetchDirectMessages();

        const channel = supabase
            .channel('realtime:messages')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
                setMessages((prev) => [...prev, payload.new]);
            })
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'direct_messages' }, (payload) => {
                setDirectMessages((prev) => [...prev, payload.new]);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchMessages = async () => {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .order('timestamp', { ascending: true });

        if (error) {
            console.error('Error fetching messages:', error);
            return;
        }

        setMessages(data || []);
    };

    const fetchRoles = async () => {
        const { data, error } = await supabase
            .from('roles')
            .select('*');

        if (error) {
            console.error('Error fetching roles:', error);
            return;
        }

        setRoles(data || []);
    };

    const fetchDirectMessages = async () => {
        const { data, error } = await supabase
            .from('direct_messages')
            .select('*')
            .order('timestamp', { ascending: true });

        if (error) {
            console.error('Error fetching direct messages:', error);
            return;
        }

        setDirectMessages(data || []);
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !username.trim()) return;

        await supabase
            .from('messages')
            .insert([{ username, message: newMessage, profile_pic: profilePic, role: 'user', status }]);
        setNewMessage('');
    };

    const sendDirectMessage = async (recipient, message) => {
        await supabase
            .from('direct_messages')
            .insert([{ sender: username, recipient, message }]);
    };

    const handleImageChange = (e) => {
        setImageUrl(e.target.value);
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        setFileToUpload(file);
    };

    const uploadFile = async () => {
        if (fileToUpload) {
            const fileUrl = await sendFileToSupabase(fileToUpload);
            setProfilePic(fileUrl);
            setModalIsOpen(false);
        }
    };

    const handleStatusChange = (e) => {
        setStatus(e.target.value);
    };

    return (
        <div id="chat-container">
            <h1>🔥•LitChat V1•🔥</h1>
            <h5>By 🔥•Ember Studios•🔥</h5>

            <div id="username-container">
                Username:
                <input
                    type="text"
                    id="username-input"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />
            </div>

            <div id="profile-container">
                Profile Picture:
                <input
                    type="text"
                    value={imageUrl}
                    onChange={handleImageChange}
                    placeholder="Image URL or Upload"
                />
                <button onClick={() => setModalIsOpen(true)}>Upload Profile Picture</button>
            </div>

            <div id="status-container">
                Status:
                <input
                    type="text"
                    placeholder="Set your status"
                    value={status}
                    onChange={handleStatusChange}
                />
            </div>

            <div id="messages">
                {messages.map((msg) => (
                    <div key={msg.id}>
                        {msg.profile_pic && <img src={msg.profile_pic} alt="Profile" className="profile-pic" />}
                        <strong>{msg.username}:</strong> {msg.message}
                    </div>
                ))}
            </div>

            <form id="send-form" onSubmit={sendMessage}>
                <input
                    type="text"
                    id="message-input"
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    required
                />
                <button type="submit">Send</button>
            </form>

            <button id="clear-chat-btn" onClick={() => setMessages([])}>
                Clear Chat
            </button>

            <Modal
                isOpen={modalIsOpen}
                onRequestClose={() => setModalIsOpen(false)}
                contentLabel="Upload Profile Picture"
            >
                <h2>Upload Profile Picture</h2>
                <input type="file" onChange={handleFileUpload} />
                <button onClick={uploadFile}>Upload</button>
            </Modal>

            <div id="typing-indicator">
                {isTyping && <span>Someone is typing...</span>}
            </div>

            <div id="roles">
                {roles.map((role) => (
                    <div key={role.id}>{role.name}</div>
                ))}
            </div>

            <div id="direct-messages">
                <h3>Direct Messages</h3>
                {directMessages.map((msg) => (
                    <div key={msg.id}>
                        <strong>{msg.sender} to {msg.recipient}:</strong> {msg.message}
                    </div>
                ))}
            </div>

            <div id="rules">
                <h3>Rules</h3>
                <ul>
                    <li>Be respectful to everyone.</li>
                    <li>No spamming or trolling.</li>
                    <li>Follow community guidelines.</li>
                </ul>
            </div>

            <div id="premade-channels">
                <h3>Channels</h3>
                <ul>
                    <li>Memes</li>
                    <li>Media</li>
                    <li>Self-Promo</li>
                    <li>Spam</li>
                    <li>Adult</li>
                </ul>
            </div>
        </div>
    );
}