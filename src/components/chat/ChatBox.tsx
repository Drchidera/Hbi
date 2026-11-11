import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import type { Conversation, ChatMessage, MessageAttachment } from '../../types';
import {
  MessageSquare,
  Send,
  Paperclip,
  X,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  User,
  ShieldCheck,
  Search,
  Check,
  RotateCcw,
} from 'lucide-react';

interface ChatBoxProps {
  isOpen: boolean;
  onClose: () => void;
  // If admin, can optionally view all conversations or specific
  isAdminMode?: boolean;
}

export const ChatBox: React.FC<ChatBoxProps> = ({
  isOpen,
  onClose,
  isAdminMode = false,
}) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);

  const [messageText, setMessageText] = useState('');
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Poll conversation every 5 seconds while open
  useEffect(() => {
    if (!isOpen) return;
    loadConversations();
    const interval = setInterval(() => {
      if (selectedConvId) {
        loadConversation(selectedConvId, true);
      } else {
        loadConversations();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [isOpen, selectedConvId]);

  const loadConversations = async () => {
    try {
      const res = await api.getConversations(searchQuery);
      setConversations(res.conversations);

      if (!selectedConvId && res.conversations.length > 0) {
        setSelectedConvId(res.conversations[0].id);
        loadConversation(res.conversations[0].id);
      }
    } catch (e) {
      console.error('Failed to load conversations', e);
    }
  };

  const loadConversation = async (convId: string, silent: boolean = false) => {
    try {
      const res = await api.getConversation(convId);
      setActiveConv(res.conversation);
      if (!silent) {
        setTimeout(scrollToBottom, 100);
      }
    } catch (e) {
      console.error('Failed to load conversation details', e);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      alert('Attachment size limit is 15MB.');
      return;
    }

    setUploadingFile(true);
    try {
      const res = await api.uploadFile(file, 'supporting_doc');
      const newAttachment: MessageAttachment = {
        id: `att-${Date.now()}`,
        name: file.name,
        url: res.url,
        size: res.fileSize,
        mimeType: res.mimeType,
      };
      setAttachments((prev) => [...prev, newAttachment]);
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConv || (!messageText.trim() && attachments.length === 0)) return;

    setSending(true);
    try {
      const res = await api.sendMessage(activeConv.id, messageText.trim(), attachments);
      setActiveConv(res.conversation);
      setMessageText('');
      setAttachments([]);
      setTimeout(scrollToBottom, 100);
    } catch (err: any) {
      alert('Failed to send message: ' + err.message);
    } finally {
      setSending(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!activeConv) return;
    const nextStatus = activeConv.status === 'open' ? 'resolved' : 'open';
    try {
      const res = await api.updateConversationStatus(activeConv.id, nextStatus);
      setActiveConv(res.conversation);
      loadConversations();
    } catch (err: any) {
      alert('Failed to update conversation status: ' + err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl h-[85vh] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto">
        {/* Main Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-amber-500/20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isAdminMode ? 'Advisory Communications Center' : 'Consular Advisory Support Desk'}
              </h3>
              <p className="text-xs text-slate-300">
                Direct encrypted channel between applicants and authorized visa officers.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Split if Admin, or single pane if Applicant */}
        <div className="flex-1 flex overflow-hidden">
          {/* Admin Conversation List Sidebar */}
          {isAdminMode && (
            <div className="w-72 sm:w-80 border-r border-slate-200 bg-slate-50 flex flex-col">
              <div className="p-3 border-b border-slate-200">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && loadConversations()}
                    placeholder="Search applicant / ref..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                {conversations.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      setSelectedConvId(c.id);
                      loadConversation(c.id);
                    }}
                    className={`p-3 text-left cursor-pointer transition-colors ${
                      activeConv?.id === c.id
                        ? 'bg-white font-medium border-l-4 border-slate-900 shadow-xs'
                        : 'hover:bg-slate-100/70'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-900 truncate max-w-[150px]">
                        {c.applicantName}
                      </span>
                      {c.unreadByAdmin > 0 && (
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mb-1">
                      {c.lastMessageText || 'No messages'}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>{new Date(c.lastMessageAt).toLocaleDateString()}</span>
                      <span
                        className={`px-1.5 py-0.2 rounded font-semibold ${
                          c.status === 'resolved'
                            ? 'bg-slate-200 text-slate-700'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {c.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Chat Thread */}
          <div className="flex-1 flex flex-col bg-white">
            {activeConv ? (
              <>
                {/* Conversation Sub-header */}
                <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900">
                      {isAdminMode ? activeConv.applicantName : 'Beacon & Harbor Senior Advisory Desk'}
                    </span>
                    <span className="text-slate-400 ml-2">
                      ({activeConv.status === 'open' ? 'Active Inquiries' : 'Resolved'})
                    </span>
                  </div>

                  {isAdminMode && (
                    <button
                      onClick={handleToggleStatus}
                      className="px-2.5 py-1 text-xs font-semibold rounded bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 flex items-center gap-1 cursor-pointer"
                    >
                      {activeConv.status === 'open' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Mark Resolved</span>
                        </>
                      ) : (
                        <>
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Reopen Inquiry</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Messages Timeline */}
                <div className="flex-1 p-6 overflow-y-auto space-y-4">
                  {activeConv.messages.map((msg) => {
                    const isMe = msg.senderId === user?.id;
                    const isAdminSender = msg.senderRole === 'admin';

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 text-[11px] text-slate-400">
                          {isAdminSender && <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />}
                          <span className="font-semibold text-slate-700">{msg.senderName}</span>
                          <span>·</span>
                          <time className="tabular-nums font-mono">
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </time>
                        </div>

                        <div
                          className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed ${
                            isMe
                              ? 'bg-slate-900 text-white rounded-br-xs'
                              : 'bg-slate-100 text-slate-900 rounded-bl-xs border border-slate-200'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.text}</p>

                          {/* Attachments */}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="mt-2.5 space-y-1.5 pt-2 border-t border-white/20">
                              {msg.attachments.map((att) => (
                                <a
                                  key={att.id}
                                  href={att.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className={`flex items-center gap-2 p-1.5 rounded text-[11px] underline ${
                                    isMe ? 'text-amber-300' : 'text-slate-800'
                                  }`}
                                >
                                  {att.mimeType.includes('image') ? (
                                    <ImageIcon className="w-3.5 h-3.5" />
                                  ) : (
                                    <FileText className="w-3.5 h-3.5" />
                                  )}
                                  <span className="truncate max-w-[200px]">{att.name}</span>
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Staged Attachments */}
                {attachments.length > 0 && (
                  <div className="px-6 py-2 bg-slate-50 border-t border-slate-200 flex flex-wrap gap-2 text-xs">
                    {attachments.map((att) => (
                      <span
                        key={att.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded text-slate-800"
                      >
                        <Paperclip className="w-3 h-3 text-slate-500" />
                        <span className="truncate max-w-[150px]">{att.name}</span>
                        <button
                          onClick={() =>
                            setAttachments((prev) => prev.filter((a) => a.id !== att.id))
                          }
                          className="text-slate-400 hover:text-rose-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Input Bar */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-4 bg-white border-t border-slate-200 flex items-center gap-2"
                >
                  <label
                    className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                    title="Attach Picture or PDF"
                  >
                    <Paperclip className="w-5 h-5" />
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={uploadingFile}
                    />
                  </label>

                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type message or procedural question..."
                    className="flex-1 px-4 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                  />

                  <button
                    type="submit"
                    disabled={sending || (!messageText.trim() && attachments.length === 0)}
                    className="p-2 text-white bg-slate-900 hover:bg-slate-800 rounded-lg disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-8 text-xs text-slate-400">
                Select an applicant thread to open communications.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
