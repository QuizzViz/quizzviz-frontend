'use client';

import { useEffect, useRef, useState } from 'react';
import { Mail, Search, Send, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Suggestion {
  key: string;
  email: string;
  label: string;
  sublabel: string;
}

export default function AdminEmailPage() {
  const { toast } = useToast();
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!recipient || recipient.includes('@')) {
      setSuggestions([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const [companiesRes, usersRes] = await Promise.all([
          fetch(`/api/admin/companies?q=${encodeURIComponent(recipient)}`),
          fetch(`/api/admin/users?q=${encodeURIComponent(recipient)}`),
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
  }, [recipient]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const validate = (): string | null => {
    if (!recipient.trim() || !recipient.includes('@')) return 'Enter a valid recipient email address.';
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
    setShowConfirm(true);
  };

  const handleSend = async () => {
    setIsSending(true);
    try {
      const res = await fetch('/api/admin/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient_email: recipient.trim(), subject: subject.trim(), message: message.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({ title: 'Send failed', description: data.error || 'Failed to send email', variant: 'destructive' });
        setShowConfirm(false);
        return;
      }
      toast({
        title: 'Email sent',
        description: `Your message was sent to ${recipient.trim()}.`,
        className: 'border-green-600/60 bg-green-700 text-green-100 shadow-lg shadow-green-600/30',
      });
      setShowConfirm(false);
      setRecipient('');
      setSubject('');
      setMessage('');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold text-white mb-1">Email Customers</h1>
      <p className="text-sm text-zinc-500 mb-6">Send a one-off email directly to a company owner, user, or any address.</p>

      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 space-y-4">
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</div>
        )}

        <div className="relative" ref={boxRef}>
          <label className="text-xs text-zinc-500 mb-1 block">To</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              value={recipient}
              onChange={(e) => {
                setRecipient(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Search by company, name, or type an email..."
              className="w-full rounded-lg bg-zinc-900 border border-zinc-700 pl-9 pr-3 py-2 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-green-500/40"
            />
          </div>
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-30 mt-1 w-full max-h-60 overflow-y-auto rounded-lg border border-zinc-700 bg-zinc-900 shadow-xl">
              {suggestions.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => {
                    setRecipient(s.email);
                    setShowSuggestions(false);
                  }}
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
            <Send className="h-4 w-4" /> Review &amp; Send
          </button>
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-green-500/20 rounded-2xl p-6 w-full max-w-lg shadow-2xl shadow-green-900/20">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-11 h-11 rounded-full bg-gradient-to-br from-green-500 to-blue-500 shadow-lg shadow-green-500/30 flex-shrink-0">
                  <Mail className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white leading-tight">Send this email?</h3>
              </div>
              <button onClick={() => setShowConfirm(false)} disabled={isSending} className="text-zinc-500 hover:text-white flex-shrink-0">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="text-sm text-zinc-400 mb-6 space-y-2">
              <p><span className="text-zinc-500">To:</span> <span className="text-white">{recipient}</span></p>
              <p><span className="text-zinc-500">Subject:</span> <span className="text-white">{subject}</span></p>
              <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 max-h-40 overflow-y-auto whitespace-pre-wrap text-zinc-300">{message}</div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isSending}
                className="px-4 py-2 text-sm rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 disabled:opacity-50 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={handleSend}
                disabled={isSending}
                className="px-4 py-2 text-sm rounded-lg bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-medium disabled:opacity-60 shadow-lg shadow-green-600/20 transition-all"
              >
                {isSending ? 'Sending...' : 'Confirm & Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
