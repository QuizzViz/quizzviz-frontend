'use client';

import { useEffect, useRef, useState } from 'react';
import { Mail, Search, Send, X, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

interface Suggestion {
  key: string;
  email: string;
  label: string;
  sublabel: string;
}

interface Recipient {
  email: string;
  label: string;
}

type SendState = 'idle' | 'sending' | 'sent';

export default function AdminEmailPage() {
  const { toast } = useToast();
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [recipientInput, setRecipientInput] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [sendState, setSendState] = useState<SendState>('idle');
  const [error, setError] = useState<string | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!recipientInput) {
      setSuggestions([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const [companiesRes, usersRes] = await Promise.all([
          fetch(`/api/admin/companies?q=${encodeURIComponent(recipientInput)}`),
          fetch(`/api/admin/users?q=${encodeURIComponent(recipientInput)}`),
        ]);
        const companies = await companiesRes.json();
        const users = await usersRes.json();

        const companySuggestions: Suggestion[] = (companies.companies || [])
          .filter((c: any) => c.owner_email)
          .slice(0, 5)
          .map((c: any) => ({ key: `c-${c.company_id}`, email: c.owner_email, label: c.name, sublabel: c.owner_email }));

        const userSuggestions: Suggestion[] = (users.users || [])
          .filter((u: any) => u.email)
          .slice(0, 5)
          .map((u: any) => ({ key: `u-${u.user_id}`, email: u.email, label: u.first_name || u.email, sublabel: u.company_name ? `${u.email} · ${u.company_name}` : u.email }));

        const merged = [...companySuggestions, ...userSuggestions];
        const seen = new Set<string>();
        setSuggestions(merged.filter((s) => (seen.has(s.email) ? false : (seen.add(s.email), true))));
      } catch {
        setSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [recipientInput]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const addRecipient = (recipient: Recipient) => {
    setRecipients((prev) => (prev.some((r) => r.email === recipient.email) ? prev : [...prev, recipient]));
    setRecipientInput('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const removeRecipient = (email: string) => setRecipients((prev) => prev.filter((r) => r.email !== email));

  const handleRecipientKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const value = recipientInput.trim().replace(/,$/, '');
      if (value && value.includes('@')) {
        addRecipient({ email: value, label: value });
      }
    }
  };

  const validate = (): string | null => {
    if (recipients.length === 0) return 'Add at least one recipient.';
    if (!subject.trim()) return 'Subject is required.';
    if (!message.trim()) return 'Message is required.';
    return null;
  };

  const handleReview = () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setSendState('idle');
    setShowConfirm(true);
  };

  const handleSend = async () => {
    setSendState('sending');
    const results = await Promise.allSettled(
      recipients.map((r) =>
        fetch('/api/admin/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recipient_email: r.email, subject: subject.trim(), message: message.trim() }),
        }).then(async (res) => {
          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body.error || `Failed for ${r.email}`);
          }
        })
      )
    );

    const failed = results
      .map((r, i) => (r.status === 'rejected' ? recipients[i].email : null))
      .filter((email): email is string => Boolean(email));

    if (failed.length === recipients.length) {
      setSendState('idle');
      setShowConfirm(false);
      toast({ title: 'Send failed', description: `Failed to send to all ${failed.length} recipient(s).`, variant: 'destructive' });
      return;
    }

    if (failed.length > 0) {
      toast({
        title: 'Sent with some failures',
        description: `Sent to ${recipients.length - failed.length} of ${recipients.length}. Failed: ${failed.join(', ')}`,
        variant: 'destructive',
      });
    }

    setSendState('sent');
    setTimeout(() => {
      setShowConfirm(false);
      setSendState('idle');
      setRecipients([]);
      setSubject('');
      setMessage('');
    }, 1500);
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold text-white mb-1">Email Customers</h1>
      <p className="text-sm text-zinc-500 mb-6">Send an email to one or many company owners, users, or any address.</p>

      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 space-y-4">
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</div>
        )}

        <div className="relative" ref={boxRef}>
          <label className="text-xs text-zinc-500 mb-1 block">To</label>
          {recipients.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {recipients.map((r) => (
                <span key={r.email} className="inline-flex items-center gap-1.5 text-xs rounded-full pl-2.5 pr-1.5 py-1 bg-green-500/10 border border-green-500/30 text-green-300">
                  {r.label !== r.email ? `${r.label} <${r.email}>` : r.email}
                  <button type="button" onClick={() => removeRecipient(r.email)} className="hover:text-white">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              value={recipientInput}
              onChange={(e) => {
                setRecipientInput(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={handleRecipientKeyDown}
              placeholder="Search by company/name, or type an email and press Enter..."
              className="w-full rounded-lg bg-zinc-900 border border-zinc-700 pl-9 pr-3 py-2 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-green-500/40"
            />
          </div>
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-30 mt-1 w-full max-h-60 overflow-y-auto rounded-lg border border-zinc-700 bg-zinc-900 shadow-xl">
              {suggestions.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => addRecipient({ email: s.email, label: s.label })}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-zinc-800"
                >
                  <div className="text-white">{s.label}</div>
                  <div className="text-xs text-zinc-500">{s.sublabel}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="text-xs text-zinc-500 mb-1 block">Subject</label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
            className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-green-500/40"
          />
        </div>

        <div>
          <label className="text-xs text-zinc-500 mb-1 block">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write your message..."
            rows={8}
            className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-green-500/40"
          />
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleReview}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white text-sm font-medium px-4 py-2"
          >
            <Send className="h-4 w-4" /> Review &amp; Send{recipients.length > 1 ? ` (${recipients.length})` : ''}
          </button>
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-green-500/20 rounded-2xl p-6 w-full max-w-lg shadow-2xl shadow-green-900/20 overflow-hidden">
            <AnimatePresence mode="wait">
              {sendState === 'sent' ? (
                <motion.div
                  key="sent"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-6 text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                    className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 mb-4"
                  >
                    <CheckCircle className="w-8 h-8 text-white" />
                  </motion.div>
                  <h3 className="text-2xl font-semibold bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
                    Sent
                  </h3>
                  <p className="text-sm text-zinc-400 mt-1">
                    {recipients.length > 1 ? `Delivered to ${recipients.length} recipients.` : `Delivered to ${recipients[0]?.email}.`}
                  </p>
                </motion.div>
              ) : (
                <motion.div key="confirm" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-11 h-11 rounded-full bg-gradient-to-br from-green-500 to-blue-500 shadow-lg shadow-green-500/30 flex-shrink-0">
                        <Mail className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-white leading-tight">
                        Send this email{recipients.length > 1 ? ` to ${recipients.length} recipients` : ''}?
                      </h3>
                    </div>
                    <button onClick={() => setShowConfirm(false)} disabled={sendState === 'sending'} className="text-zinc-500 hover:text-white flex-shrink-0">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="text-sm text-zinc-400 mb-6 space-y-2">
                    <div>
                      <span className="text-zinc-500">To:</span>{' '}
                      <span className="text-white">{recipients.map((r) => r.email).join(', ')}</span>
                    </div>
                    <p><span className="text-zinc-500">Subject:</span> <span className="text-white">{subject}</span></p>
                    <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 max-h-40 overflow-y-auto whitespace-pre-wrap text-zinc-300">{message}</div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setShowConfirm(false)}
                      disabled={sendState === 'sending'}
                      className="px-4 py-2 text-sm rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 disabled:opacity-50 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={handleSend}
                      disabled={sendState === 'sending'}
                      className="px-4 py-2 text-sm rounded-lg bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-medium disabled:opacity-60 shadow-lg shadow-green-600/20 transition-all"
                    >
                      {sendState === 'sending' ? 'Sending...' : 'Confirm & Send'}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
