import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const STORAGE_KEY = '@oummah/zakat/history/v1';
const ZAKAT_RATES = { lunar: 0.025, gregorian: 0.02577 } as const;

type CalculationMode = 'quick' | 'complete';
type ZakatYearType = 'lunar' | 'gregorian';
type FormState = {
  bank: string;
  cash: string;
  gold: string;
  silver: string;
  investments: string;
  crypto: string;
  business: string;
  receivables: string;
  debts: string;
};

type HistoryEntry = {
  id: string;
  createdAt: string;
  mode: CalculationMode;
  nisab: number;
  assets: number;
  debts: number;
  zakatableWealth: number;
  zakat: number;
  yearType?: ZakatYearType;
  rate?: number;
};

const EMPTY_FORM: FormState = {
  bank: '',
  cash: '',
  gold: '',
  silver: '',
  investments: '',
  crypto: '',
  business: '',
  receivables: '',
  debts: '',
};

const COMPLETE_FIELDS: ReadonlyArray<{
  key: keyof FormState;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = [
  { key: 'bank', label: 'Comptes et épargne', description: 'Soldes disponibles sur vos comptes', icon: 'card-outline' },
  { key: 'cash', label: 'Espèces', description: 'Argent liquide conservé', icon: 'wallet-outline' },
  { key: 'gold', label: 'Or', description: 'Valeur de l’or concerné par votre calcul', icon: 'diamond-outline' },
  { key: 'silver', label: 'Argent métal', description: 'Valeur de l’argent concerné', icon: 'ellipse-outline' },
  { key: 'investments', label: 'Investissements', description: 'Actions, fonds et placements concernés', icon: 'trending-up-outline' },
  { key: 'crypto', label: 'Cryptomonnaies', description: 'Valeur détenue à la date du calcul', icon: 'logo-bitcoin' },
  { key: 'business', label: 'Biens commerciaux', description: 'Marchandises destinées à la vente', icon: 'storefront-outline' },
  { key: 'receivables', label: 'Créances récupérables', description: 'Sommes que l’on doit vous rembourser', icon: 'receipt-outline' },
];

function parseAmount(value: string): number {
  const normalized = value.replace(/\s/g, '').replace(',', '.').replace(/[^0-9.]/g, '');
  const amount = Number(normalized);
  return Number.isFinite(amount) ? Math.max(0, amount) : 0;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value));
}

export default function ZakatScreen() {
  const [mode, setMode] = useState<CalculationMode>('quick');
  const [nisab, setNisab] = useState<number | null>(null);
  const [nisabUpdatedAt, setNisabUpdatedAt] = useState<string | null>(null);
  const [nisabLoading, setNisabLoading] = useState(true);
  const [nisabError, setNisabError] = useState(false);
  const [yearType, setYearType] = useState<ZakatYearType>('lunar');
  const [hawlConfirmed, setHawlConfirmed] = useState<boolean | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [showResult, setShowResult] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!raw) return;
        const parsed = JSON.parse(raw) as HistoryEntry[];
        if (Array.isArray(parsed)) setHistory(parsed);
      })
      .catch(() => undefined);
  }, []);

  const loadNisab = async () => {
    setNisabLoading(true);
    setNisabError(false);
    try {
      const [goldResponse, fxResponse] = await Promise.all([
        fetch('https://api.gold-api.com/price/XAU'),
        fetch('https://api.frankfurter.dev/v1/latest?base=USD&symbols=EUR'),
      ]);
      if (!goldResponse.ok || !fxResponse.ok) throw new Error('Nisab unavailable');
      const goldData = await goldResponse.json() as { price?: number };
      const fxData = await fxResponse.json() as { rates?: { EUR?: number } };
      const ounceUsd = Number(goldData.price);
      const usdToEur = Number(fxData.rates?.EUR);
      if (!Number.isFinite(ounceUsd) || !Number.isFinite(usdToEur) || ounceUsd <= 0 || usdToEur <= 0) {
        throw new Error('Invalid market data');
      }
      const value = (ounceUsd / 31.1034768) * 85 * usdToEur;
      setNisab(Math.round(value));
      setNisabUpdatedAt(new Date().toISOString());
      await AsyncStorage.setItem('@oummah/zakat/nisab-cache/v1', JSON.stringify({ value: Math.round(value), updatedAt: new Date().toISOString() }));
    } catch {
      const cached = await AsyncStorage.getItem('@oummah/zakat/nisab-cache/v1').catch(() => null);
      if (cached) {
        const parsed = JSON.parse(cached) as { value?: number; updatedAt?: string };
        if (Number.isFinite(parsed.value) && Number(parsed.value) > 0) {
          setNisab(Number(parsed.value));
          setNisabUpdatedAt(parsed.updatedAt ?? null);
        } else {
          setNisabError(true);
        }
      } else {
        setNisabError(true);
      }
    } finally {
      setNisabLoading(false);
    }
  };

  useEffect(() => { void loadNisab(); }, []);

  const totals = useMemo(() => {
    const keys: Array<keyof FormState> = mode === 'quick'
      ? ['bank', 'cash']
      : COMPLETE_FIELDS.map((field) => field.key);
    const assets = keys.reduce((sum, key) => sum + parseAmount(form[key]), 0);
    const debts = parseAmount(form.debts);
    const currentNisab = nisab ?? 0;
    const zakatableWealth = Math.max(0, assets - debts);
    const eligible = currentNisab > 0 && zakatableWealth >= currentNisab && hawlConfirmed === true;
    const rate = ZAKAT_RATES[yearType];
    const zakat = eligible ? zakatableWealth * rate : 0;
    return { assets, debts, nisab: currentNisab, zakatableWealth, eligible, zakat, rate };
  }, [form, mode, nisab, hawlConfirmed, yearType]);

  const updateField = (key: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setShowResult(false);
    setHawlConfirmed(null);
  };

  const calculate = async () => {
    if (nisabLoading || totals.nisab <= 0) {
      Alert.alert('Nisab indisponible', 'La valeur actuelle du nisab doit être chargée avant le calcul. Réessayez dans un instant.');
      return;
    }

    if (hawlConfirmed === null) {
      Alert.alert('Une dernière question', `Indiquez si ce patrimoine est resté au-dessus du nisab pendant une année ${yearType === 'lunar' ? 'lunaire' : 'grégorienne'} complète.`);
      return;
    }

    if (totals.assets <= 0) {
      Alert.alert('Montants manquants', 'Ajoutez au moins un montant pour effectuer votre estimation.');
      return;
    }

    const entry: HistoryEntry = {
      id: `${Date.now()}`,
      createdAt: new Date().toISOString(),
      mode,
      nisab: totals.nisab,
      assets: totals.assets,
      debts: totals.debts,
      zakatableWealth: totals.zakatableWealth,
      zakat: totals.zakat,
      yearType,
      rate: totals.rate,
    };
    const nextHistory = [entry, ...history].slice(0, 12);
    setHistory(nextHistory);
    setShowResult(true);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextHistory)).catch(() => undefined);
  };

  const reset = () => {
    setForm(EMPTY_FORM);
    setShowResult(false);
    setHawlConfirmed(null);
  };

  const clearHistory = () => {
    Alert.alert('Effacer l’historique ?', 'Tous les calculs enregistrés sur cet appareil seront supprimés.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Effacer',
        style: 'destructive',
        onPress: () => {
          setHistory([]);
          void AsyncStorage.removeItem(STORAGE_KEY);
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        <LinearGradient colors={['#123C36', '#0A2926', '#071F1D']} style={styles.hero}>
          <SafeAreaView edges={['top']} style={styles.safeHeader}>
            <Pressable onPress={() => router.back()} style={styles.backButton} accessibilityLabel="Retour">
              <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
            </Pressable>
            <Pressable onPress={() => setShowHistory((value) => !value)} style={styles.historyButton}>
              <Ionicons name="time-outline" size={18} color="#F2D89B" />
              <Text style={styles.historyButtonText}>Historique</Text>
            </Pressable>
          </SafeAreaView>

          <View style={styles.heroIcon}>
            <Ionicons name="moon" size={26} color="#16312D" />
          </View>
          <Text style={styles.heroEyebrow}>UN ACTE D’ADORATION</Text>
          <Text style={styles.heroTitle}>Ma Zakat</Text>
          <Text style={styles.heroText}>Estimez votre zakat simplement, comprenez chaque étape et conservez vos calculs.</Text>

          <View style={styles.verseCard}>
            <Ionicons name="sparkles" size={16} color="#D8B767" />
            <Text style={styles.verseText}>« Accomplissez la prière et acquittez la zakat. »</Text>
            <Text style={styles.verseReference}>Al-Baqara · 2:43</Text>
          </View>
        </LinearGradient>

        <View style={styles.body}>
          {showHistory ? (
            <View style={styles.historyPanel}>
              <View style={styles.sectionHeaderRow}>
                <View>
                  <Text style={styles.sectionEyebrow}>VOTRE SUIVI</Text>
                  <Text style={styles.sectionTitle}>Calculs précédents</Text>
                </View>
                {history.length > 0 ? (
                  <Pressable onPress={clearHistory} style={styles.clearButton}>
                    <Ionicons name="trash-outline" size={17} color="#C8897A" />
                  </Pressable>
                ) : null}
              </View>
              {history.length === 0 ? (
                <View style={styles.emptyHistory}>
                  <Ionicons name="document-text-outline" size={30} color="#8FA7A2" />
                  <Text style={styles.emptyHistoryTitle}>Aucun calcul enregistré</Text>
                  <Text style={styles.emptyHistoryText}>Votre prochain résultat apparaîtra ici automatiquement.</Text>
                </View>
              ) : (
                history.map((item) => (
                  <View key={item.id} style={styles.historyItem}>
                    <View style={styles.historyIcon}>
                      <Ionicons name={item.zakat > 0 ? 'checkmark' : 'remove'} size={18} color="#17312E" />
                    </View>
                    <View style={styles.historyCopy}>
                      <Text style={styles.historyDate}>{formatDate(item.createdAt)}</Text>
                      <Text style={styles.historyMeta}>{item.mode === 'quick' ? 'Calcul rapide' : 'Calcul complet'} · {item.yearType === 'gregorian' ? 'Grégorien 2,577 %' : 'Lunaire 2,5 %'} · Patrimoine {formatCurrency(item.zakatableWealth)}</Text>
                    </View>
                    <Text style={styles.historyAmount}>{formatCurrency(item.zakat)}</Text>
                  </View>
                ))
              )}
              <Pressable onPress={() => setShowHistory(false)} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Revenir au calcul</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <View style={styles.introCard}>
                <View style={styles.introIcon}>
                  <Ionicons name="information-circle-outline" size={22} color="#D8B767" />
                </View>
                <View style={styles.introCopy}>
                  <Text style={styles.introTitle}>Avant de commencer</Text>
                  <Text style={styles.introText}>Cette estimation applique 2,5 % pour une année lunaire ou 2,577 % pour une année grégorienne, après déduction des dettes immédiates renseignées.</Text>
                </View>
              </View>

              <Text style={styles.sectionEyebrow}>CHOISISSEZ VOTRE PARCOURS</Text>
              <Text style={styles.sectionTitle}>Comment souhaitez-vous calculer ?</Text>
              <View style={styles.modeRow}>
                <ModeCard
                  active={mode === 'quick'}
                  icon="flash-outline"
                  title="Calcul rapide"
                  subtitle="Épargne, espèces et dettes"
                  onPress={() => { setMode('quick'); setShowResult(false); }}
                />
                <ModeCard
                  active={mode === 'complete'}
                  icon="options-outline"
                  title="Calcul complet"
                  subtitle="Tous vos biens concernés"
                  onPress={() => { setMode('complete'); setShowResult(false); }}
                />
              </View>

              <View style={styles.divider} />
              <Text style={styles.sectionEyebrow}>ÉTAPE 1</Text>
              <Text style={styles.sectionTitle}>Votre patrimoine</Text>
              <Text style={styles.sectionDescription}>Indiquez les montants en euros. Laissez un champ vide lorsqu’il ne vous concerne pas.</Text>

              {mode === 'quick' ? (
                <>
                  <AmountField icon="card-outline" label="Comptes et épargne" description="Solde de vos comptes et livrets" value={form.bank} onChangeText={(value) => updateField('bank', value)} />
                  <AmountField icon="wallet-outline" label="Espèces" description="Argent liquide que vous possédez" value={form.cash} onChangeText={(value) => updateField('cash', value)} />
                </>
              ) : (
                COMPLETE_FIELDS.map(({ key, label, description, icon }) => (
                  <View key={key}>
                    <AmountField label={label} description={description} icon={icon} value={form[key]} onChangeText={(value) => updateField(key, value)} />
                  </View>
                ))
              )}

              <View style={styles.divider} />
              <Text style={styles.sectionEyebrow}>ÉTAPE 2</Text>
              <Text style={styles.sectionTitle}>Dettes immédiates</Text>
              <Text style={styles.sectionDescription}>Renseignez uniquement les sommes exigibles à court terme que vous choisissez de déduire selon l’avis que vous suivez.</Text>
              <AmountField icon="remove-circle-outline" label="Dettes à déduire" description="Échéances et sommes dues prochainement" value={form.debts} onChangeText={(value) => updateField('debts', value)} />

              <View style={styles.divider} />
              <Text style={styles.sectionEyebrow}>ÉTAPE 3</Text>
              <Text style={styles.sectionTitle}>Votre année de référence</Text>
              <Text style={styles.sectionDescription}>Choisissez le calendrier utilisé pour votre échéance annuelle. Le taux est ajusté automatiquement.</Text>
              <View style={styles.yearRow}>
                <Pressable
                  onPress={() => { setYearType('lunar'); setHawlConfirmed(null); setShowResult(false); }}
                  style={[styles.yearChoice, yearType === 'lunar' && styles.yearChoiceActive]}
                >
                  <View style={[styles.yearIcon, yearType === 'lunar' && styles.yearIconActive]}>
                    <Ionicons name="moon-outline" size={20} color={yearType === 'lunar' ? '#17312E' : '#D8B767'} />
                  </View>
                  <Text style={[styles.yearChoiceTitle, yearType === 'lunar' && styles.yearChoiceTitleActive]}>Lunaire</Text>
                  <Text style={styles.yearChoiceRate}>2,5 %</Text>
                  <Text style={styles.yearChoiceHint}>Environ 354 jours</Text>
                </Pressable>
                <Pressable
                  onPress={() => { setYearType('gregorian'); setHawlConfirmed(null); setShowResult(false); }}
                  style={[styles.yearChoice, yearType === 'gregorian' && styles.yearChoiceActive]}
                >
                  <View style={[styles.yearIcon, yearType === 'gregorian' && styles.yearIconActive]}>
                    <Ionicons name="sunny-outline" size={20} color={yearType === 'gregorian' ? '#17312E' : '#D8B767'} />
                  </View>
                  <Text style={[styles.yearChoiceTitle, yearType === 'gregorian' && styles.yearChoiceTitleActive]}>Grégorienne</Text>
                  <Text style={styles.yearChoiceRate}>2,577 %</Text>
                  <Text style={styles.yearChoiceHint}>365 jours</Text>
                </Pressable>
              </View>
              <Text style={styles.hawlQuestion}>Ce patrimoine est-il resté au-dessus du nisab pendant une année {yearType === 'lunar' ? 'lunaire' : 'grégorienne'} complète ?</Text>
              <View style={styles.hawlRow}>
                <Pressable onPress={() => { setHawlConfirmed(true); setShowResult(false); }} style={[styles.hawlChoice, hawlConfirmed === true && styles.hawlChoiceActive]}>
                  <Ionicons name="checkmark-circle-outline" size={21} color={hawlConfirmed === true ? '#17312E' : '#D8B767'} />
                  <Text style={[styles.hawlChoiceText, hawlConfirmed === true && styles.hawlChoiceTextActive]}>Oui, une année complète</Text>
                </Pressable>
                <Pressable onPress={() => { setHawlConfirmed(false); setShowResult(false); }} style={[styles.hawlChoice, hawlConfirmed === false && styles.hawlChoiceActive]}>
                  <Ionicons name="time-outline" size={21} color={hawlConfirmed === false ? '#17312E' : '#D8B767'} />
                  <Text style={[styles.hawlChoiceText, hawlConfirmed === false && styles.hawlChoiceTextActive]}>Non, pas encore</Text>
                </Pressable>
              </View>

              <View style={styles.nisabAutoCard}>
                <View style={styles.nisabAutoIcon}><Ionicons name="scale-outline" size={22} color="#D8B767" /></View>
                <View style={styles.nisabAutoCopy}>
                  <Text style={styles.nisabAutoLabel}>Nisab actuel automatique</Text>
                  {nisabLoading ? (
                    <View style={styles.nisabLoadingRow}><ActivityIndicator size="small" color="#D8B767" /><Text style={styles.nisabAutoHint}>Mise à jour du cours de l’or…</Text></View>
                  ) : nisabError || !nisab ? (
                    <Text style={styles.nisabErrorText}>Impossible de charger la valeur actuelle.</Text>
                  ) : (
                    <>
                      <Text style={styles.nisabAutoValue}>{formatCurrency(nisab)}</Text>
                      <Text style={styles.nisabAutoHint}>Calculé automatiquement selon 85 g d’or{nisabUpdatedAt ? ` · actualisé le ${formatDate(nisabUpdatedAt)}` : ''}</Text>
                    </>
                  )}
                </View>
                {nisabError ? <Pressable onPress={() => void loadNisab()} style={styles.retryNisab}><Ionicons name="refresh" size={18} color="#17312E" /></Pressable> : null}
              </View>

              <View style={styles.summaryCard}>
                <SummaryLine label="Total des biens" value={formatCurrency(totals.assets)} />
                <SummaryLine label="Dettes déduites" value={`− ${formatCurrency(totals.debts)}`} />
                <View style={styles.summaryDivider} />
                <SummaryLine label="Patrimoine zakatable" value={formatCurrency(totals.zakatableWealth)} emphasized />
                <SummaryLine label={`Taux · ${yearType === 'lunar' ? 'année lunaire' : 'année grégorienne'}`} value={`${(totals.rate * 100).toLocaleString('fr-FR', { maximumFractionDigits: 3 })} %`} />
              </View>

              <Pressable onPress={calculate} style={({ pressed }) => [styles.calculateButton, pressed && styles.buttonPressed]}>
                <LinearGradient colors={['#E6C978', '#CFA64F']} style={styles.calculateGradient}>
                  <Ionicons name="calculator-outline" size={20} color="#17312E" />
                  <Text style={styles.calculateText}>Calculer ma zakat</Text>
                </LinearGradient>
              </Pressable>

              {showResult ? (
                <View style={[styles.resultCard, !totals.eligible && styles.resultCardNeutral]}>
                  <View style={styles.resultTopline}>
                    <View style={styles.resultIcon}>
                      <Ionicons name={totals.eligible ? 'checkmark-circle' : 'information-circle'} size={29} color={totals.eligible ? '#D8B767' : '#86A49E'} />
                    </View>
                    <View style={styles.resultCopy}>
                      <Text style={styles.resultEyebrow}>{totals.eligible ? 'ESTIMATION DE VOTRE ZAKAT' : 'RÉSULTAT DU CALCUL'}</Text>
                      <Text style={styles.resultAmount}>{formatCurrency(totals.zakat)}</Text>
                    </View>
                  </View>
                  <Text style={styles.resultText}>
                    {totals.eligible
                      ? `Votre patrimoine zakatable dépasse le nisab actuel. L’estimation correspond à ${(totals.rate * 100).toLocaleString('fr-FR', { maximumFractionDigits: 3 })} % de ${formatCurrency(totals.zakatableWealth)}, selon une année ${yearType === 'lunar' ? 'lunaire' : 'grégorienne'}.`
                      : hawlConfirmed === false
                        ? `Votre patrimoine n’a pas encore été détenu pendant une année ${yearType === 'lunar' ? 'lunaire' : 'grégorienne'} complète. Aucune zakat n’est estimée pour le moment.`
                        : `Votre patrimoine zakatable de ${formatCurrency(totals.zakatableWealth)} ne dépasse pas le nisab actuel de ${formatCurrency(totals.nisab)}.`}
                  </Text>
                  <View style={styles.resultNotice}>
                    <Ionicons name="shield-checkmark-outline" size={18} color="#D8B767" />
                    <Text style={styles.resultNoticeText}>Conservez ce résultat comme estimation. Pour une situation complexe, demandez l’avis d’une personne de science qualifiée.</Text>
                  </View>
                  <Pressable onPress={reset} style={styles.resetButton}>
                    <Ionicons name="refresh-outline" size={17} color="#EBD79F" />
                    <Text style={styles.resetText}>Faire un nouveau calcul</Text>
                  </Pressable>
                </View>
              ) : null}

              <View style={styles.educationCard}>
                <Text style={styles.educationEyebrow}>À RETENIR</Text>
                <Text style={styles.educationTitle}>Les bases de la zakat</Text>
                <EducationRow icon="calendar-outline" title="Lunaire ou grégorienne" text="Le taux est de 2,5 % sur une année lunaire et de 2,577 % sur une année grégorienne." />
                <EducationRow icon="pie-chart-outline" title="Un taux adapté à la durée" text="Le taux grégorien est légèrement supérieur car l’année solaire compte davantage de jours." />
                <EducationRow icon="people-outline" title="Huit catégories" text="Le Coran précise les catégories de bénéficiaires de la zakat dans At-Tawbah 9:60." />
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ModeCard({ active, icon, title, subtitle, onPress }: { active: boolean; icon: keyof typeof Ionicons.glyphMap; title: string; subtitle: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.modeCard, active && styles.modeCardActive]}>
      <View style={[styles.modeIcon, active && styles.modeIconActive]}>
        <Ionicons name={icon} size={21} color={active ? '#17312E' : '#D8B767'} />
      </View>
      <Text style={styles.modeTitle}>{title}</Text>
      <Text style={styles.modeSubtitle}>{subtitle}</Text>
      <View style={[styles.radio, active && styles.radioActive]}>{active ? <View style={styles.radioDot} /> : null}</View>
    </Pressable>
  );
}

function AmountField({ icon, label, description, value, onChangeText }: { icon: keyof typeof Ionicons.glyphMap; label: string; description: string; value: string; onChangeText: (value: string) => void }) {
  return (
    <View style={styles.amountCard}>
      <View style={styles.amountIcon}><Ionicons name={icon} size={20} color="#D8B767" /></View>
      <View style={styles.amountCopy}>
        <Text style={styles.amountLabel}>{label}</Text>
        <Text style={styles.amountDescription}>{description}</Text>
      </View>
      <View style={styles.inputWrap}>
        <TextInput value={value} onChangeText={onChangeText} keyboardType="decimal-pad" placeholder="0" placeholderTextColor="#718682" style={styles.input} selectTextOnFocus />
        <Text style={styles.currency}>€</Text>
      </View>
    </View>
  );
}

function SummaryLine({ label, value, emphasized = false }: { label: string; value: string; emphasized?: boolean }) {
  return (
    <View style={styles.summaryLine}>
      <Text style={[styles.summaryLabel, emphasized && styles.summaryLabelStrong]}>{label}</Text>
      <Text style={[styles.summaryValue, emphasized && styles.summaryValueStrong]}>{value}</Text>
    </View>
  );
}

function EducationRow({ icon, title, text }: { icon: keyof typeof Ionicons.glyphMap; title: string; text: string }) {
  return (
    <View style={styles.educationRow}>
      <View style={styles.educationIcon}><Ionicons name={icon} size={19} color="#D8B767" /></View>
      <View style={styles.educationCopy}><Text style={styles.educationRowTitle}>{title}</Text><Text style={styles.educationText}>{text}</Text></View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#071F1D' },
  content: { paddingBottom: 50 },
  hero: { paddingBottom: 28, borderBottomLeftRadius: 34, borderBottomRightRadius: 34, overflow: 'hidden' },
  safeHeader: { paddingHorizontal: 18, paddingBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.09)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.13)' },
  historyButton: { height: 40, paddingHorizontal: 14, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(242,216,155,0.22)' },
  historyButtonText: { color: '#F2D89B', fontSize: 12, fontWeight: '700' },
  heroIcon: { width: 52, height: 52, borderRadius: 18, backgroundColor: '#E2C574', alignItems: 'center', justifyContent: 'center', marginTop: 12, marginLeft: 22 },
  heroEyebrow: { marginTop: 16, marginHorizontal: 22, color: '#D8B767', fontSize: 10, letterSpacing: 1.8, fontWeight: '800' },
  heroTitle: { marginHorizontal: 22, marginTop: 2, color: '#FFFFFF', fontSize: 40, fontFamily: 'CormorantGaramond-SemiBold' },
  heroText: { marginHorizontal: 22, marginTop: 4, color: '#C9D6D3', fontSize: 14, lineHeight: 21, maxWidth: 350 },
  verseCard: { marginHorizontal: 22, marginTop: 22, padding: 15, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(216,183,103,0.18)' },
  verseText: { color: '#F4EFE3', fontFamily: 'CormorantGaramond-Medium', fontSize: 17, lineHeight: 23, marginTop: 8 },
  verseReference: { color: '#D8B767', fontSize: 11, fontWeight: '700', marginTop: 7 },
  body: { paddingHorizontal: 18, paddingTop: 22 },
  introCard: { flexDirection: 'row', gap: 12, padding: 16, backgroundColor: '#0D2A27', borderRadius: 20, borderWidth: 1, borderColor: '#183B37', marginBottom: 28 },
  introIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#173A35', alignItems: 'center', justifyContent: 'center' },
  introCopy: { flex: 1 },
  introTitle: { color: '#F5F1E8', fontSize: 15, fontWeight: '700' },
  introText: { color: '#AFC0BC', fontSize: 12.5, lineHeight: 19, marginTop: 4 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionEyebrow: { color: '#CDAE63', fontSize: 9.5, letterSpacing: 1.6, fontWeight: '800' },
  sectionTitle: { color: '#F5F1E8', fontFamily: 'CormorantGaramond-SemiBold', fontSize: 25, marginTop: 2 },
  sectionDescription: { color: '#93AAA5', fontSize: 12.5, lineHeight: 19, marginTop: 4, marginBottom: 15 },
  modeRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  modeCard: { flex: 1, minHeight: 155, padding: 14, borderRadius: 22, backgroundColor: '#0D2A27', borderWidth: 1, borderColor: '#1A3C38' },
  modeCardActive: { borderColor: '#D8B767', backgroundColor: '#12332F' },
  modeIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: '#173A35', alignItems: 'center', justifyContent: 'center' },
  modeIconActive: { backgroundColor: '#D8B767' },
  modeTitle: { color: '#F5F1E8', fontSize: 14, fontWeight: '800', marginTop: 12 },
  modeSubtitle: { color: '#91A7A2', fontSize: 11.5, lineHeight: 16, marginTop: 4, paddingRight: 14 },
  radio: { position: 'absolute', right: 13, top: 13, width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: '#59706C', alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: '#D8B767' },
  radioDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#D8B767' },
  divider: { height: 1, backgroundColor: '#153532', marginVertical: 27 },
  amountCard: { minHeight: 76, flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 18, backgroundColor: '#0D2A27', borderWidth: 1, borderColor: '#183936', marginBottom: 9 },
  amountIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#173A35', alignItems: 'center', justifyContent: 'center' },
  amountCopy: { flex: 1, paddingHorizontal: 11 },
  amountLabel: { color: '#F2EEE5', fontSize: 13.5, fontWeight: '700' },
  amountDescription: { color: '#7F9994', fontSize: 10.5, lineHeight: 14, marginTop: 2 },
  inputWrap: { width: 86, height: 44, borderRadius: 13, backgroundColor: '#071F1D', borderWidth: 1, borderColor: '#244540', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 9 },
  input: { flex: 1, color: '#FFFFFF', textAlign: 'right', fontSize: 15, fontWeight: '700', paddingVertical: 0 },
  currency: { color: '#D8B767', fontSize: 13, fontWeight: '700', marginLeft: 4 },
  nisabOptions: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  nisabChoice: { flex: 1, paddingVertical: 12, paddingHorizontal: 8, borderRadius: 15, backgroundColor: '#0D2A27', borderWidth: 1, borderColor: '#183936', alignItems: 'center' },
  nisabChoiceActive: { borderColor: '#D8B767', backgroundColor: '#173A35' },
  nisabTitle: { color: '#C5D0CD', fontSize: 13, fontWeight: '800' },
  nisabTitleActive: { color: '#F0D895' },
  nisabSubtitle: { color: '#78908B', fontSize: 9.5, marginTop: 3 },
  yearRow: { flexDirection: 'row', gap: 9, marginBottom: 16 },
  yearChoice: { flex: 1, minHeight: 142, padding: 13, borderRadius: 19, borderWidth: 1, borderColor: '#1A3C38', backgroundColor: '#0D2A27' },
  yearChoiceActive: { borderColor: '#D8B767', backgroundColor: '#12332F' },
  yearIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: '#173A35', alignItems: 'center', justifyContent: 'center' },
  yearIconActive: { backgroundColor: '#D8B767' },
  yearChoiceTitle: { color: '#E9EEE9', fontSize: 13.5, fontWeight: '800', marginTop: 10 },
  yearChoiceTitleActive: { color: '#F2D893' },
  yearChoiceRate: { color: '#F5F1E8', fontFamily: 'CormorantGaramond-SemiBold', fontSize: 25, marginTop: 1 },
  yearChoiceHint: { color: '#819A95', fontSize: 10, marginTop: 1 },
  hawlQuestion: { color: '#C6D2CF', fontSize: 12.5, lineHeight: 19, fontWeight: '700', marginBottom: 11 },
  hawlRow: { flexDirection: 'row', gap: 9, marginBottom: 14 },
  hawlChoice: { flex: 1, minHeight: 72, paddingHorizontal: 12, borderRadius: 17, borderWidth: 1, borderColor: '#1A3C38', backgroundColor: '#0D2A27', alignItems: 'center', justifyContent: 'center', gap: 7 },
  hawlChoiceActive: { backgroundColor: '#D8B767', borderColor: '#D8B767' },
  hawlChoiceText: { color: '#E9EEE9', fontSize: 11.5, fontWeight: '700', textAlign: 'center' },
  hawlChoiceTextActive: { color: '#17312E' },
  nisabAutoCard: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 20, backgroundColor: '#12332F', borderWidth: 1, borderColor: '#D8B767', marginTop: 5 },
  nisabAutoIcon: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#0B2724', alignItems: 'center', justifyContent: 'center' },
  nisabAutoCopy: { flex: 1, paddingHorizontal: 12 },
  nisabAutoLabel: { color: '#F3EEE4', fontSize: 12.5, fontWeight: '800' },
  nisabAutoValue: { color: '#F2D893', fontFamily: 'CormorantGaramond-SemiBold', fontSize: 25, marginTop: 2 },
  nisabAutoHint: { color: '#91A7A2', fontSize: 9.5, lineHeight: 14, marginTop: 2 },
  nisabLoadingRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 6 },
  nisabErrorText: { color: '#D8A89C', fontSize: 10.5, marginTop: 4 },
  retryNisab: { width: 36, height: 36, borderRadius: 13, backgroundColor: '#D8B767', alignItems: 'center', justifyContent: 'center' },
  summaryCard: { padding: 17, borderRadius: 20, backgroundColor: '#0B2724', borderWidth: 1, borderColor: '#1A3D38', marginTop: 22 },
  summaryLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5 },
  summaryLabel: { color: '#98ADA8', fontSize: 12.5 },
  summaryValue: { color: '#E5E9E7', fontSize: 13, fontWeight: '700' },
  summaryLabelStrong: { color: '#F4EFE4', fontWeight: '800' },
  summaryValueStrong: { color: '#E2C574', fontSize: 16 },
  summaryDivider: { height: 1, backgroundColor: '#1B3A36', marginVertical: 7 },
  calculateButton: { marginTop: 14, borderRadius: 18, overflow: 'hidden' },
  calculateGradient: { height: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  calculateText: { color: '#17312E', fontSize: 15, fontWeight: '900' },
  buttonPressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  resultCard: { marginTop: 20, borderRadius: 24, padding: 18, backgroundColor: '#12342F', borderWidth: 1, borderColor: '#C8A95E' },
  resultCardNeutral: { borderColor: '#41625C' },
  resultTopline: { flexDirection: 'row', alignItems: 'center' },
  resultIcon: { width: 46, height: 46, borderRadius: 16, backgroundColor: '#0D2926', alignItems: 'center', justifyContent: 'center' },
  resultCopy: { marginLeft: 12 },
  resultEyebrow: { color: '#AABCB8', fontSize: 9, letterSpacing: 1.2, fontWeight: '800' },
  resultAmount: { color: '#F2D893', fontFamily: 'CormorantGaramond-SemiBold', fontSize: 33, marginTop: 1 },
  resultText: { color: '#D3DDDA', fontSize: 13, lineHeight: 20, marginTop: 14 },
  resultNotice: { flexDirection: 'row', gap: 9, padding: 12, borderRadius: 15, backgroundColor: '#0B2824', marginTop: 14 },
  resultNoticeText: { flex: 1, color: '#9DB0AC', fontSize: 11, lineHeight: 16 },
  resetButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, height: 43, marginTop: 13 },
  resetText: { color: '#EBD79F', fontSize: 12.5, fontWeight: '700' },
  educationCard: { marginTop: 28, padding: 18, borderRadius: 24, backgroundColor: '#0D2A27', borderWidth: 1, borderColor: '#173A36' },
  educationEyebrow: { color: '#CDAE63', fontSize: 9, fontWeight: '800', letterSpacing: 1.5 },
  educationTitle: { color: '#F4EFE5', fontFamily: 'CormorantGaramond-SemiBold', fontSize: 24, marginTop: 3, marginBottom: 8 },
  educationRow: { flexDirection: 'row', gap: 11, paddingVertical: 11, borderTopWidth: 1, borderTopColor: '#173835' },
  educationIcon: { width: 36, height: 36, borderRadius: 13, backgroundColor: '#173A35', alignItems: 'center', justifyContent: 'center' },
  educationCopy: { flex: 1 },
  educationRowTitle: { color: '#EDEAE2', fontSize: 13, fontWeight: '700' },
  educationText: { color: '#8FA5A0', fontSize: 11.5, lineHeight: 17, marginTop: 2 },
  historyPanel: { paddingTop: 4 },
  clearButton: { width: 38, height: 38, borderRadius: 14, backgroundColor: '#2B302C', alignItems: 'center', justifyContent: 'center' },
  emptyHistory: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 28 },
  emptyHistoryTitle: { color: '#EDEAE2', fontSize: 15, fontWeight: '700', marginTop: 13 },
  emptyHistoryText: { color: '#829A95', fontSize: 12, textAlign: 'center', lineHeight: 18, marginTop: 5 },
  historyItem: { flexDirection: 'row', alignItems: 'center', padding: 13, borderRadius: 17, backgroundColor: '#0D2A27', borderWidth: 1, borderColor: '#173936', marginTop: 9 },
  historyIcon: { width: 36, height: 36, borderRadius: 13, backgroundColor: '#D8B767', alignItems: 'center', justifyContent: 'center' },
  historyCopy: { flex: 1, paddingHorizontal: 10 },
  historyDate: { color: '#EDEAE2', fontSize: 12.5, fontWeight: '700' },
  historyMeta: { color: '#7E9691', fontSize: 9.5, marginTop: 3 },
  historyAmount: { color: '#E2C574', fontSize: 14, fontWeight: '800' },
  secondaryButton: { marginTop: 20, height: 49, borderRadius: 16, borderWidth: 1, borderColor: '#31504B', alignItems: 'center', justifyContent: 'center' },
  secondaryButtonText: { color: '#D9E1DF', fontSize: 13, fontWeight: '700' },
});
