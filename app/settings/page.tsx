'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Moon, Sun, SettingsIcon, Mic, AlertTriangle, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useUIStore } from '@/lib/store';

export default function SettingsPage() {
  const router = useRouter();
  const {
    theme,
    setTheme,
    selectedDatabase,
    setSelectedDatabase,
    language,
    setLanguage,
    voiceEnabled,
    setVoiceEnabled,
    showUnsafeWarnings,
    setShowUnsafeWarnings,
  } = useUIStore();

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Apply theme to document
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <SettingsIcon className="w-6 h-6 text-primary" />
            <div>
              <h1 className="text-xl font-bold">Settings</h1>
              <p className="text-xs text-muted-foreground">Customize your experience</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => router.push('/')}>
            Back to Workspace
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Appearance Section */}
        <Card className="overflow-hidden">
          <div className="p-4 border-b bg-accent/50">
            <h2 className="font-semibold">Appearance</h2>
            <p className="text-xs text-muted-foreground mt-1">Customize how the app looks</p>
          </div>
          <div className="p-4 space-y-4">
            {/* Theme Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Theme</label>
              <div className="grid grid-cols-2 gap-3 max-w-xs">
                <button
                  onClick={() => handleThemeChange('light')}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    theme === 'light'
                      ? 'border-primary bg-accent'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <Sun className="w-5 h-5 mb-2" />
                  <p className="text-sm font-medium">Light</p>
                  <p className="text-xs text-muted-foreground">Bright and clean</p>
                </button>
                <button
                  onClick={() => handleThemeChange('dark')}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    theme === 'dark'
                      ? 'border-primary bg-accent'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <Moon className="w-5 h-5 mb-2" />
                  <p className="text-sm font-medium">Dark</p>
                  <p className="text-xs text-muted-foreground">Easy on eyes</p>
                </button>
              </div>
            </div>
          </div>
        </Card>

        {/* Database & Language Section */}
        <Card className="overflow-hidden">
          <div className="p-4 border-b bg-accent/50">
            <h2 className="font-semibold">Defaults</h2>
            <p className="text-xs text-muted-foreground mt-1">Set your preferred defaults</p>
          </div>
          <div className="p-4 space-y-4">
            {/* Database Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Default Database</label>
              <Select value={selectedDatabase} onValueChange={setSelectedDatabase}>
                <SelectTrigger className="w-full max-w-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default DB</SelectItem>
                  <SelectItem value="analytics">Analytics</SelectItem>
                  <SelectItem value="warehouse">Warehouse</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                This database will be pre-selected when you open the workspace
              </p>
            </div>

            {/* Language Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Language
              </label>
              <Select value={language} onValueChange={(v) => setLanguage(v as 'en' | 'es' | 'fr')}>
                <SelectTrigger className="w-full max-w-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Language preference for explanations and UI
              </p>
            </div>
          </div>
        </Card>

        {/* Features Section */}
        <Card className="overflow-hidden">
          <div className="p-4 border-b bg-accent/50">
            <h2 className="font-semibold">Features</h2>
            <p className="text-xs text-muted-foreground mt-1">Enable or disable optional features</p>
          </div>
          <div className="p-4 space-y-4">
            {/* Voice Input */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium flex items-center gap-2 mb-1">
                  <Mic className="w-4 h-4" />
                  Voice Input
                </label>
                <p className="text-xs text-muted-foreground">
                  Enable voice-to-text for natural language queries
                </p>
              </div>
              <Switch
                checked={voiceEnabled}
                onCheckedChange={setVoiceEnabled}
                aria-label="Enable voice input"
              />
            </div>

            {/* Safety Warnings */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4" />
                  Safety Warnings
                </label>
                <p className="text-xs text-muted-foreground">
                  Show warnings for potentially unsafe SQL queries
                </p>
              </div>
              <Switch
                checked={showUnsafeWarnings}
                onCheckedChange={setShowUnsafeWarnings}
                aria-label="Show safety warnings"
              />
            </div>
          </div>
        </Card>

        {/* About Section */}
        <Card className="overflow-hidden">
          <div className="p-4 border-b bg-accent/50">
            <h2 className="font-semibold">About</h2>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <label className="text-sm font-medium block mb-1">Version</label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground font-mono">1.0.0</span>
                <Badge variant="secondary" className="text-xs">Latest</Badge>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Build</label>
              <span className="text-sm text-muted-foreground font-mono">build-2024-q4</span>
            </div>
            <div className="pt-2 border-t space-y-2">
              <Button variant="outline" className="w-full justify-start text-sm">
                Documentation
              </Button>
              <Button variant="outline" className="w-full justify-start text-sm">
                Report an Issue
              </Button>
              <Button variant="outline" className="w-full justify-start text-sm">
                Privacy Policy
              </Button>
            </div>
          </div>
        </Card>

        {/* Reset Button */}
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            className="text-destructive hover:text-destructive"
            onClick={() => {
              if (confirm('Are you sure you want to reset all settings to defaults?')) {
                setTheme('light');
                setSelectedDatabase('default');
                setLanguage('en');
                setVoiceEnabled(false);
                setShowUnsafeWarnings(true);
                document.documentElement.classList.remove('dark');
              }
            }}
          >
            Reset All Settings
          </Button>
        </div>
      </main>
    </div>
  );
}
