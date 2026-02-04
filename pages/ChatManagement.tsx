import React, { useState, useEffect, useRef } from 'react';
import { Conversation, ChatMessage } from '../src/types';

interface ChatManagementProps {
    conversations: Conversation[];
    onSendMessage: (text: string, sender: 'agent', userId: number | string) => void;
    onMarkAsRead: (conversationId: number | string) => void;
}

const ChatManagement: React.FC<ChatManagementProps> = ({ conversations, onSendMessage, onMarkAsRead }) => {
    const [selectedConversationId, setSelectedConversationId] = useState<number | string | null>(null);
    const [searchText, setSearchText] = useState('');
    const [replyText, setReplyText] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Filter conversations
    const filteredConversations = conversations.filter(c => {
        const userName = c.userName || '';
        return userName.toLowerCase().includes(searchText.toLowerCase());
    });

    const activeConversation = conversations.find(c => c.id === selectedConversationId);

    // Scroll to bottom on new message
    useEffect(() => {
        if (messagesEndRef.current) {
            // Usar 'nearest' evita que a página inteira pule, rolando apenas o container
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, [activeConversation?.messages]);

    // Mark as read when opening conversation
    useEffect(() => {
        if (selectedConversationId) {
            onMarkAsRead(selectedConversationId);
        }
    }, [selectedConversationId]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyText.trim() || !activeConversation) return;

        onSendMessage(replyText, 'agent', activeConversation.userId);
        setReplyText('');
    };

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'owner': return 'bg-purple-100 text-purple-700';
            case 'client': return 'bg-blue-100 text-blue-700';
            default: return 'bg-amber-100 text-amber-700';
        }
    };

    return (
        // Alterado de h-screen para h-full para respeitar o layout pai
        <div className="flex h-full bg-slate-100 dark:bg-background-dark overflow-hidden font-display relative">

            {/* --- LEFT SIDEBAR (List) --- */}
            {/* Responsividade: Oculta em mobile se houver conversa selecionada */}
            <div className={`
                w-full md:w-96 flex flex-col bg-white dark:bg-[#111318] border-r border-slate-200 dark:border-slate-800
                ${activeConversation ? 'hidden md:flex' : 'flex'}
            `}>
                {/* Header Sidebar */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#1a1d23] flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">chat</span> Atendimento
                    </h2>
                    <div className="flex gap-2">
                        <button className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500">
                            <span className="material-symbols-outlined text-[20px]">more_vert</span>
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="p-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
                        <input
                            type="text"
                            placeholder="Buscar conversa..."
                            className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-sm focus:ring-1 focus:ring-primary text-slate-900 dark:text-white"
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                        />
                    </div>
                </div>

                {/* Conversation List */}
                <div className="flex-1 overflow-y-auto">
                    {filteredConversations.map(conv => (
                        <div
                            key={conv.id}
                            onClick={() => setSelectedConversationId(conv.id)}
                            className={`flex items-center gap-3 p-4 cursor-pointer transition-colors border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 ${selectedConversationId === conv.id ? 'bg-blue-50 dark:bg-blue-900/10 border-l-4 border-l-primary' : ''}`}
                        >
                            <div className="relative">
                                <div className="size-12 rounded-full bg-cover bg-center border border-slate-200 dark:border-slate-700" style={{ backgroundImage: `url("${conv.userAvatar}")` }}></div>
                                {conv.userRole === 'owner' && <div className="absolute -bottom-1 -right-1 bg-purple-500 size-4 rounded-full border-2 border-white flex items-center justify-center"><span className="material-symbols-outlined text-[10px] text-white">key</span></div>}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline mb-1">
                                    <h4 className={`text-sm font-bold truncate ${selectedConversationId === conv.id ? 'text-primary' : 'text-slate-900 dark:text-white'}`}>{conv.userName}</h4>
                                    <span className="text-[10px] text-slate-400">{conv.lastMessageTime}</span>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{conv.lastMessage}</p>
                            </div>
                            {conv.unreadCount > 0 && (
                                <div className="size-5 rounded-full bg-green-500 text-white flex items-center justify-center text-[10px] font-bold shadow-sm">
                                    {conv.unreadCount}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* --- RIGHT SIDE (Chat Window) --- */}
            {/* Responsividade: Oculta em mobile se não houver conversa */}
            <div className={`
                flex-1 flex flex-col bg-[#eef2f6] dark:bg-[#0b0e14] relative h-full
                ${!activeConversation ? 'hidden md:flex' : 'flex'}
            `}>
                {activeConversation ? (
                    <>
                        {/* Header Chat */}
                        <div className="flex-none h-16 bg-white dark:bg-[#1a1d23] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 shadow-sm z-10">
                            <div className="flex items-center gap-3">
                                {/* Botão Voltar Mobile */}
                                <button
                                    onClick={() => setSelectedConversationId(null)}
                                    className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
                                >
                                    <span className="material-symbols-outlined">arrow_back</span>
                                </button>

                                <div className="size-10 rounded-full bg-cover bg-center cursor-pointer" style={{ backgroundImage: `url("${activeConversation.userAvatar}")` }}></div>
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm md:text-base">
                                        {activeConversation.userName}
                                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${getRoleBadge(activeConversation.userRole)}`}>
                                            {activeConversation.userRole}
                                        </span>
                                    </h3>
                                    {activeConversation.propertyInterest && (
                                        <p className="text-xs text-slate-500 flex items-center gap-1 truncate max-w-[150px] md:max-w-none">
                                            <span className="material-symbols-outlined text-[12px]">home</span> {activeConversation.propertyInterest}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-1 md:gap-3 text-slate-400">
                                <button className="p-2 hover:bg-slate-100 rounded-full hover:text-primary"><span className="material-symbols-outlined">phone</span></button>
                                <button className="p-2 hover:bg-slate-100 rounded-full hover:text-primary hidden md:block"><span className="material-symbols-outlined">videocam</span></button>
                                <button className="p-2 hover:bg-slate-100 rounded-full hover:text-primary"><span className="material-symbols-outlined">search</span></button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
                            {activeConversation.messages.map((msg, idx) => {
                                const isAgent = msg.sender === 'agent';
                                return (
                                    <div key={msg.id} className={`flex ${isAgent ? 'justify-end' : 'justify-start'} group`}>
                                        <div className={`
                                            max-w-[85%] md:max-w-[70%] p-3 rounded-xl shadow-sm text-sm relative
                                            ${isAgent
                                                ? 'bg-primary text-white rounded-tr-none'
                                                : 'bg-white dark:bg-[#1a1d23] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-tl-none'}
                                        `}>
                                            <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>
                                            <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${isAgent ? 'text-blue-100' : 'text-slate-400'}`}>
                                                <span>{msg.time}</span>
                                                {isAgent && (
                                                    <span className={`material-symbols-outlined text-[14px] ${msg.read ? 'text-green-300' : 'text-blue-200'}`}>done_all</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} className="h-1" />
                        </div>

                        {/* Input Area */}
                        <div className="flex-none p-3 md:p-4 bg-white dark:bg-[#1a1d23] border-t border-slate-200 dark:border-slate-800">
                            <form onSubmit={handleSend} className="flex items-center gap-2 md:gap-3">
                                <button type="button" className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                    <span className="material-symbols-outlined text-[24px]">attach_file</span>
                                </button>
                                <input
                                    type="text"
                                    className="flex-1 bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary text-slate-900 dark:text-white placeholder:text-slate-400"
                                    placeholder="Digite sua mensagem..."
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                />
                                <button
                                    type="submit"
                                    disabled={!replyText.trim()}
                                    className="p-3 bg-primary text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 transition-colors shadow-lg shadow-primary/20"
                                >
                                    <span className="material-symbols-outlined text-[24px]">send</span>
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    /* Empty State */
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50 dark:bg-[#0b0e14]">
                        <div className="size-24 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center mb-4">
                            <span className="material-symbols-outlined text-5xl opacity-50">forum</span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-600 dark:text-slate-300">Nenhuma conversa selecionada</h3>
                        <p className="text-sm px-4 text-center">Selecione um cliente ou proprietário para iniciar o atendimento.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatManagement;