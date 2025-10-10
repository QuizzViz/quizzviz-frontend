"use client";

import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Send, CheckCircle, AlertCircle, MessageCircle, ArrowRight, HelpCircle, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const Footer = dynamic(
  () => import('@/components/Footer').then((mod) => mod.Footer),
  { ssr: false, loading: () => <div className="h-16 bg-background" /> }
);

export default function ContactPage() {
  const { isLoaded, user, isSignedIn } = useUser();
  const router = useRouter();
  const [formData, setFormData] = useState({
{{ ... }
                  </motion.button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};