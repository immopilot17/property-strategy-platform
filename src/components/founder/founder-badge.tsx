import React from 'react';
import { Crown } from 'lucide-react';

export interface FounderBadgeProps {
  isFounder: boolean;
  className?: string;
  showText?: boolean;
}

/**
 * Displays a founder badge if user is a founder
 */
export function FounderBadge({
  isFounder,
  className = '',
  showText = true,
}: FounderBadgeProps) {
  if (!isFounder) {
    return null;
  }

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-yellow-50 to-amber-50 px-3 py-1 border border-yellow-200 ${className}`}
    >
      <Crown className="w-4 h-4 text-amber-600" />
      {showText && <span className="text-sm font-semibold text-amber-700">Gründer</span>}
    </div>
  );
}

/**
 * Displays founder benefits banner
 */
export function FounderBenefitsBanner() {
  return (
    <div className="rounded-lg bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 p-4">
      <div className="flex items-start gap-3">
        <Crown className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-amber-900">Gründer-Vorteile</h3>
          <ul className="mt-2 text-sm text-amber-800 space-y-1">
            <li>✓ Unbegrenzte Analysen und Nutzung</li>
            <li>✓ Alle Plattform-Features kostenlos</li>
            <li>✓ Prioritärer Support</li>
            <li>✓ Beta-Features und neue Funktionen</li>
            <li>✓ Admin-Dashboard</li>
            <li>✓ Export und Reports</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

/**
 * Tier indicator showing current access level
 */
export interface AccessTierIndicatorProps {
  tier: 'free' | 'starter' | 'plus' | 'pro' | 'premium' | 'founder';
  className?: string;
}

export function AccessTierIndicator({
  tier,
  className = '',
}: AccessTierIndicatorProps) {
  const tierConfig = {
    free: {
      label: 'Kostenlos',
      color: 'bg-gray-100 text-gray-700 border-gray-200',
      icon: null,
    },
    starter: {
      label: 'Analyse',
      color: 'bg-blue-100 text-blue-700 border-blue-200',
      icon: null,
    },
    plus: {
      label: 'Finanzierung',
      color: 'bg-green-100 text-green-700 border-green-200',
      icon: null,
    },
    pro: {
      label: 'Strategie',
      color: 'bg-purple-100 text-purple-700 border-purple-200',
      icon: null,
    },
    premium: {
      label: 'Premium',
      color: 'bg-rose-100 text-rose-700 border-rose-200',
      icon: null,
    },
    founder: {
      label: 'Gründer',
      color: 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 border-amber-200',
      icon: Crown,
    },
  };

  const config = tierConfig[tier];
  const Icon = config.icon;

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 border ${config.color} ${className}`}
    >
      {Icon && <Icon className="w-4 h-4" />}
      <span className="text-sm font-medium">{config.label}</span>
    </div>
  );
}

/**
 * Display tier name and features
 */
export function TierFeatures({
  tier,
}: {
  tier: 'free' | 'starter' | 'plus' | 'pro' | 'premium' | 'founder';
}) {
  const features = {
    free: ['Kostenlose Basis-Features'],
    starter: [
      'Deterministische Immobilienanalyse',
      'KI-Erklärungen',
      'Exposé-Texterkennung',
      'Objektvergleich',
    ],
    plus: [
      'Alle Analyse-Funktionen',
      'Finanzierungsalternativen',
      'Restschuld- und Zinsszenarien',
      'KfW- und Landesförderprüfung',
    ],
    pro: [
      'Alle Finanzierungsfunktionen',
      'Steuerliche Orientierung',
      'Agenten- und Supervisor-Prüfung',
      'Persönlicher Maßnahmenplan',
    ],
    premium: [
      'Alle Plattform-Funktionen',
      'Vollständige KfW- und Förderanalyse',
      'Finanzierungs- und Steueroptimierung',
      'Downloadbarer Gesamtbericht als PDF',
    ],
    founder: [
      'Unbegrenzte Analysen und Nutzung',
      'Alle Plattform-Features kostenlos',
      'Prioritärer Support',
      'Beta-Features und neue Funktionen',
      'Admin-Dashboard',
      'Export und Reports',
    ],
  };

  const tierFeatures = features[tier];

  return (
    <ul className="space-y-2">
      {tierFeatures.map((feature) => (
        <li key={feature} className="flex items-center gap-2 text-sm">
          <span className="text-lg">✓</span>
          {feature}
        </li>
      ))}
    </ul>
  );
}
