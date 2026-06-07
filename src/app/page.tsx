import type { Metadata } from 'next'
import LandingClient from '@/components/landing/LandingClient'

export const metadata: Metadata = {
  title: {
    absolute: 'SkillForge — AI-Powered Skill Development Platform',
  },
  description:
    'Transform your skills and forge your future. SkillForge is a gamified, AI-powered learning platform for Sri Lankan university students.',
  openGraph: {
    title: 'SkillForge — AI-Powered Skill Development Platform',
    description:
      'Gamified, AI-powered learning with personalized roadmaps, expert sessions, and a vibrant community.',
    type: 'website',
  },
}

export default function LandingPage() {
  return <LandingClient />
}
