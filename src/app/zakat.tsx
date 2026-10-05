import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WasilContextButton } from '../components/wasil/WasilContextButton';
import { useI18n, type LanguageCode, type TranslationKey } from '../i18n';
import { colors } from '../theme/colors';

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

const COMPLETE_FIELDS: readonly {
  key: keyof FormState;
  label: TranslationKey;
  description: TranslationKey;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { key: 'bank', label: 'zakat.fieldBank', description: 'zakat.fieldBankText', icon: 'card-outline' },
  { key: 'cash', label: 'zakat.fieldCash', description: 'zakat.fieldCashText', icon: 'wallet-outline' },
  { key: 'gold', label: 'zakat.fieldGold', description: 'zakat.fieldGoldText', icon: 'diamond-outline' },
  { key: 'silver', label: 'zakat.fieldSilver', description: 'zakat.fieldSilverText', icon: 'ellipse-outline' },
  { key: 'investments', label: 'zakat.fieldInvestments', description: 'zakat.fieldInvestmentsText', icon: 'trending-up-outline' },
  { key: 'crypto', label: 'zakat.fieldCrypto', description: 'zakat.fieldCryptoText', icon: 'logo-bitcoin' },
  { key: 'business', label: 'zakat.fieldBusiness', description: 'zakat.fieldBusinessText', icon: 'storefront-outline' },
  { key: 'receivables', label: 'zakat.fieldReceivables', description: 'zakat.fieldReceivablesText', icon: 'receipt-outline' },
];

function parseAmount(value: string): number {
  const normalized = value.replace(/\s/g, '').replace(',', '.').replace(/[^0-9.]/g, '');
  const amount = Number(normalized);
  return Number.isFinite(amount) ? Math.max(0, amount) : 0;
}

function localeOf(language: LanguageCode) {
  return language === 'fr' ? 'fr-FR' : 'en-GB';
}

function formatCurrency(value: number, language: LanguageCode): string {
  return new Intl.NumberFormat(localeOf(language), {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string, language: LanguageCode): string {
  return new Intl.DateTimeFormat(localeOf(language), {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value));
}

export default function ZakatScreen() {
  const { language, t } = useI18n();
  const money = (value: number) => formatCurrency(value, language);
  const percent = (rate: number) =>
    `${(rate * 100).toLocaleString(localeOf(language), { maximumFractionDigits: 3 })} %`;
  const yearWord = (type: ZakatYearType) => (type === 'lunar' ? t('zakat.yearLunarWord') : t('zakat.yearGregorianWord'));
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
  const [showZakatExplanation, setShowZakatExplanation] = useState(false);

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
  };

  const calculate = async () => {
    if (nisabLoading || totals.nisab <= 0) {
      Alert.alert(t('zakat.nisabUnavailableTitle'), t('zakat.nisabUnavailableText'));
      return;
    }

    if (hawlConfirmed === null) {
      Alert.alert(t('zakat.lastQuestionTitle'), t('zakat.lastQuestionText', { year: yearWord(yearType) }));
      return;
    }

    if (totals.assets <= 0) {
      Alert.alert(t('zakat.missingAmountsTitle'), t('zakat.missingAmountsText'));
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
    Alert.alert(t('zakat.clearHistoryTitle'), t('zakat.clearHistoryText'), [
      { text: t('zakat.cancel'), style: 'cancel' },
      {
        text: t('zakat.clear'),
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
      <SafeAreaView edges={['top']} style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        <LinearGradient colors={['#1E1730', '#151022', colors.background]} style={styles.hero}>
          <View style={styles.safeHeader}>
            <Pressable onPress={() => router.back()} style={styles.backButton} accessibilityLabel={t('common.back')}>
              <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
            </Pressable>
            <Pressable onPress={() => setShowHistory((value) => !value)} style={styles.historyButton}>
              <Ionicons name="time-outline" size={18} color="#F2D89B" />
              <Text style={styles.historyButtonText}>{t('zakat.history')}</Text>
            </Pressable>
          </View>

          <View style={styles.heroIcon}>
            <Ionicons name="moon" size={26} color={colors.background} />
          </View>
          <Text style={styles.heroEyebrow}>{t('zakat.eyebrow')}</Text>
          <Text style={styles.heroTitle}>{t('zakat.title')}</Text>
          <Text style={styles.heroText}>{t('zakat.subtitle')}</Text>

          <View style={styles.verseCard}>
            <Ionicons name="sparkles" size={16} color="#D8B767" />
            <Text style={styles.verseText}>{t('zakat.verse')}</Text>
            <Text style={styles.verseReference}>{t('zakat.verseReference')}</Text>
          </View>
        </LinearGradient>

        <View style={styles.body}>
          {showHistory ? (
            <View style={styles.historyPanel}>
              <View style={styles.sectionHeaderRow}>
                <View>
                  <Text style={styles.sectionEyebrow}>{t('zakat.historyEyebrow')}</Text>
                  <Text style={styles.sectionTitle}>{t('zakat.historyTitle')}</Text>
                </View>
                {history.length > 0 ? (
                  <Pressable accessibilityLabel={t('zakat.clearHistoryTitle')} onPress={clearHistory} style={styles.clearButton}>
                    <Ionicons name="trash-outline" size={17} color="#C8897A" />
                  </Pressable>
                ) : null}
              </View>
              {history.length === 0 ? (
                <View style={styles.emptyHistory}>
                  <Ionicons name="document-text-outline" size={30} color={colors.textMuted} />
                  <Text style={styles.emptyHistoryTitle}>{t('zakat.historyEmptyTitle')}</Text>
                  <Text style={styles.emptyHistoryText}>{t('zakat.historyEmptyText')}</Text>
                </View>
              ) : (
                history.map((item) => (
                  <View key={item.id} style={styles.historyItem}>
                    <View style={styles.historyIcon}>
                      <Ionicons name={item.zakat > 0 ? 'checkmark' : 'remove'} size={18} color={colors.background} />
                    </View>
                    <View style={styles.historyCopy}>
                      <Text style={styles.historyDate}>{formatDate(item.createdAt, language)}</Text>
                      <Text style={styles.historyMeta}>{t('zakat.historyMeta', { mode: item.mode === 'quick' ? t('zakat.modeQuick') : t('zakat.modeComplete'), year: item.yearType === 'gregorian' ? t('zakat.historyGregorian') : t('zakat.historyLunar'), wealth: money(item.zakatableWealth) })}</Text>
                    </View>
                    <Text style={styles.historyAmount}>{money(item.zakat)}</Text>
                  </View>
                ))
              )}
              <Pressable onPress={() => setShowHistory(false)} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>{t('zakat.backToCalculation')}</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <View style={[styles.educationCard, styles.educationCardFirst]}>
                <Text style={styles.educationEyebrow}>{t('zakat.understandEyebrow')}</Text>
                <Text style={styles.educationTitle}>{t('zakat.whatTitle')}</Text>
                <Text style={styles.educationText}>{t('zakat.whatText')}</Text>
                {showZakatExplanation ? (
                  <View style={styles.zakatExplanation}>
                    <EducationRow icon="scale-outline" title={t('zakat.nisabTitle')} text={t('zakat.nisabText')} />
                    <EducationRow icon="calendar-outline" title={t('zakat.hawlTitle')} text={t('zakat.hawlText')} />
                    <EducationRow icon="pie-chart-outline" title={t('zakat.rateTitle')} text={t('zakat.rateText')} />
                    <EducationRow icon="people-outline" title={t('zakat.recipientsTitle')} text={t('zakat.recipientsText')} />
                    <EducationRow icon="help-circle-outline" title={t('zakat.situationTitle')} text={t('zakat.situationText')} />
                    <WasilContextButton
                      prompt={t('zakat.wasilPrompt')}
                      largeLabel
                    />
                  </View>
                ) : null}
                <Pressable
                  onPress={() => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setShowZakatExplanation((value) => !value);
                  }}
                  style={showZakatExplanation ? styles.secondaryButton : styles.zakatCta}
                >
                  <Text style={showZakatExplanation ? styles.secondaryButtonText : styles.zakatCtaText}>{showZakatExplanation ? t('zakat.collapse') : t('zakat.learnMore')}</Text>
                </Pressable>
              </View>

              <View style={styles.introCard}>
                <View style={styles.introIcon}>
                  <Ionicons name="information-circle-outline" size={22} color="#D8B767" />
                </View>
                <View style={styles.introCopy}>
                  <Text style={styles.introTitle}>{t('zakat.beforeTitle')}</Text>
                  <Text style={styles.introText}>{t('zakat.beforeText')}</Text>
                </View>
              </View>

              <Text style={styles.sectionEyebrow}>{t('zakat.chooseEyebrow')}</Text>
              <Text style={styles.sectionTitle}>{t('zakat.chooseTitle')}</Text>
              <View style={styles.modeRow}>
                <ModeCard
                  active={mode === 'quick'}
                  icon="flash-outline"
                  title={t('zakat.modeQuick')}
                  subtitle={t('zakat.modeQuickText')}
                  onPress={() => { setMode('quick'); setShowResult(false); }}
                />
                <ModeCard
                  active={mode === 'complete'}
                  icon="options-outline"
                  title={t('zakat.modeComplete')}
                  subtitle={t('zakat.modeCompleteText')}
                  onPress={() => { setMode('complete'); setShowResult(false); }}
                />
              </View>

              <View style={styles.divider} />
              <Text style={styles.sectionEyebrow}>{t('zakat.step', { number: 1 })}</Text>
              <Text style={styles.sectionTitle}>{t('zakat.wealthTitle')}</Text>
              <Text style={styles.sectionDescription}>{t('zakat.wealthText')}</Text>

              {mode === 'quick' ? (
                <>
                  <AmountField icon="card-outline" label={t('zakat.fieldBank')} description={t('zakat.fieldBankQuickText')} value={form.bank} onChangeText={(value) => updateField('bank', value)} />
                  <AmountField icon="wallet-outline" label={t('zakat.fieldCash')} description={t('zakat.fieldCashQuickText')} value={form.cash} onChangeText={(value) => updateField('cash', value)} />
                </>
              ) : (
                COMPLETE_FIELDS.map(({ key, label, description, icon }) => (
                  <View key={key}>
                    <AmountField label={t(label)} description={t(description)} icon={icon} value={form[key]} onChangeText={(value) => updateField(key, value)} />
                  </View>
                ))
              )}

              <View style={styles.divider} />
              <Text style={styles.sectionEyebrow}>{t('zakat.step', { number: 2 })}</Text>
              <Text style={styles.sectionTitle}>{t('zakat.debtsTitle')}</Text>
              <Text style={styles.sectionDescription}>{t('zakat.debtsText')}</Text>
              <AmountField icon="remove-circle-outline" label={t('zakat.debtsField')} description={t('zakat.debtsFieldText')} value={form.debts} onChangeText={(value) => updateField('debts', value)} />

              <View style={styles.divider} />
              <Text style={styles.sectionEyebrow}>{t('zakat.step', { number: 3 })}</Text>
              <Text style={styles.sectionTitle}>{t('zakat.yearTitle')}</Text>
              <Text style={styles.sectionDescription}>{t('zakat.yearText')}</Text>
              <View style={styles.yearRow}>
                <Pressable
                  onPress={() => { setYearType('lunar'); setHawlConfirmed(null); setShowResult(false); }}
                  style={[styles.yearChoice, yearType === 'lunar' && styles.yearChoiceActive]}
                >
                  <View style={[styles.yearIcon, yearType === 'lunar' && styles.yearIconActive]}>
                    <Ionicons name="moon-outline" size={20} color={yearType === 'lunar' ? colors.background : '#D8B767'} />
                  </View>
                  <Text style={[styles.yearChoiceTitle, yearType === 'lunar' && styles.yearChoiceTitleActive]}>{t('zakat.lunar')}</Text>
                  <Text style={styles.yearChoiceRate}>{percent(ZAKAT_RATES.lunar)}</Text>
                  <Text style={styles.yearChoiceHint}>{t('zakat.lunarDays')}</Text>
                </Pressable>
                <Pressable
                  onPress={() => { setYearType('gregorian'); setHawlConfirmed(null); setShowResult(false); }}
                  style={[styles.yearChoice, yearType === 'gregorian' && styles.yearChoiceActive]}
                >
                  <View style={[styles.yearIcon, yearType === 'gregorian' && styles.yearIconActive]}>
                    <Ionicons name="sunny-outline" size={20} color={yearType === 'gregorian' ? colors.background : '#D8B767'} />
                  </View>
                  <Text style={[styles.yearChoiceTitle, yearType === 'gregorian' && styles.yearChoiceTitleActive]}>{t('zakat.gregorian')}</Text>
                  <Text style={styles.yearChoiceRate}>{percent(ZAKAT_RATES.gregorian)}</Text>
                  <Text style={styles.yearChoiceHint}>{t('zakat.gregorianDays')}</Text>
                </Pressable>
              </View>
              <Text style={styles.hawlQuestion}>{t('zakat.hawlQuestion', { year: yearWord(yearType) })}</Text>
              <View style={styles.hawlRow}>
                <Pressable onPress={() => { setHawlConfirmed(true); setShowResult(false); }} style={[styles.hawlChoice, hawlConfirmed === true && styles.hawlChoiceActive]}>
                  <Ionicons name="checkmark-circle-outline" size={21} color={hawlConfirmed === true ? colors.background : '#D8B767'} />
                  <Text style={[styles.hawlChoiceText, hawlConfirmed === true && styles.hawlChoiceTextActive]}>{t('zakat.hawlYes')}</Text>
                </Pressable>
                <Pressable onPress={() => { setHawlConfirmed(false); setShowResult(false); }} style={[styles.hawlChoice, hawlConfirmed === false && styles.hawlChoiceActive]}>
                  <Ionicons name="time-outline" size={21} color={hawlConfirmed === false ? colors.background : '#D8B767'} />
                  <Text style={[styles.hawlChoiceText, hawlConfirmed === false && styles.hawlChoiceTextActive]}>{t('zakat.hawlNo')}</Text>
                </Pressable>
              </View>

              <View style={styles.nisabAutoCard}>
                <View style={styles.nisabAutoIcon}><Ionicons name="scale-outline" size={22} color="#D8B767" /></View>
                <View style={styles.nisabAutoCopy}>
                  <Text style={styles.nisabAutoLabel}>{t('zakat.nisabCurrent')}</Text>
                  {nisabLoading ? (
                    <View style={styles.nisabLoadingRow}><ActivityIndicator size="small" color="#D8B767" /><Text style={styles.nisabAutoHint}>{t('zakat.nisabLoading')}</Text></View>
                  ) : nisabError || !nisab ? (
                    <Text style={styles.nisabErrorText}>{t('zakat.nisabError')}</Text>
                  ) : (
                    <>
                      <Text style={styles.nisabAutoValue}>{money(nisab)}</Text>
                      <Text style={styles.nisabAutoHint}>
                        {t('zakat.nisabBasis')}
                        {nisabUpdatedAt ? ` · ${t('zakat.nisabUpdated', { date: formatDate(nisabUpdatedAt, language) })}` : ''}
                      </Text>
                    </>
                  )}
                </View>
                {nisabError ? <Pressable accessibilityLabel={t('zakat.retry')} onPress={() => void loadNisab()} style={styles.retryNisab}><Ionicons name="refresh" size={18} color={colors.background} /></Pressable> : null}
              </View>

              <View style={styles.summaryCard}>
                <SummaryLine label={t('zakat.totalAssets')} value={money(totals.assets)} />
                <SummaryLine label={t('zakat.debtsDeducted')} value={`− ${money(totals.debts)}`} />
                <View style={styles.summaryDivider} />
                <SummaryLine label={t('zakat.zakatableWealth')} value={money(totals.zakatableWealth)} emphasized />
                <SummaryLine label={t('zakat.rateLine', { year: yearWord(yearType) })} value={percent(totals.rate)} />
              </View>

              <Pressable onPress={calculate} style={({ pressed }) => [styles.calculateButton, pressed && styles.buttonPressed]}>
                <LinearGradient colors={['#E6C978', '#CFA64F']} style={styles.calculateGradient}>
                  <Ionicons name="calculator-outline" size={20} color={colors.background} />
                  <Text style={styles.calculateText}>{t('zakat.calculate')}</Text>
                </LinearGradient>
              </Pressable>

              {showResult ? (
                <View style={[styles.resultCard, !totals.eligible && styles.resultCardNeutral]}>
                  <View style={styles.resultTopline}>
                    <View style={styles.resultIcon}>
                      <Ionicons name={totals.eligible ? 'checkmark-circle' : 'information-circle'} size={29} color={totals.eligible ? '#D8B767' : colors.textMuted} />
                    </View>
                    <View style={styles.resultCopy}>
                      <Text style={styles.resultEyebrow}>{totals.eligible ? t('zakat.resultEligibleEyebrow') : t('zakat.resultEyebrow')}</Text>
                      <Text style={styles.resultAmount}>{money(totals.zakat)}</Text>
                    </View>
                  </View>
                  <Text style={styles.resultText}>
                    {totals.eligible
                      ? t('zakat.resultEligible', { rate: percent(totals.rate), wealth: money(totals.zakatableWealth), year: yearWord(yearType) })
                      : hawlConfirmed === false
                        ? t('zakat.resultNoHawl', { year: yearWord(yearType) })
                        : t('zakat.resultBelowNisab', { wealth: money(totals.zakatableWealth), nisab: money(totals.nisab) })}
                  </Text>
                  <View style={styles.resultNotice}>
                    <Ionicons name="shield-checkmark-outline" size={18} color="#D8B767" />
                    <Text style={styles.resultNoticeText}>{t('zakat.resultNotice')}</Text>
                  </View>
                  <Pressable onPress={reset} style={styles.resetButton}>
                    <Ionicons name="refresh-outline" size={17} color="#EBD79F" />
                    <Text style={styles.resetText}>{t('zakat.newCalculation')}</Text>
                  </Pressable>
                </View>
              ) : null}

              <View style={styles.educationCard}>
                <Text style={styles.educationEyebrow}>{t('zakat.rememberEyebrow')}</Text>
                <Text style={styles.educationTitle}>{t('zakat.basicsTitle')}</Text>
                <EducationRow icon="calendar-outline" title={t('zakat.basicsYearTitle')} text={t('zakat.basicsYearText')} />
                <EducationRow icon="pie-chart-outline" title={t('zakat.basicsRateTitle')} text={t('zakat.basicsRateText')} />
                <EducationRow icon="people-outline" title={t('zakat.basicsRecipientsTitle')} text={t('zakat.basicsRecipientsText')} />
              </View>
            </>
          )}
        </View>
      </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

function ModeCard({ active, icon, title, subtitle, onPress }: { active: boolean; icon: keyof typeof Ionicons.glyphMap; title: string; subtitle: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.modeCard, active && styles.modeCardActive]}>
      <View style={[styles.modeIcon, active && styles.modeIconActive]}>
        <Ionicons name={icon} size={21} color={active ? colors.background : '#D8B767'} />
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
        <TextInput value={value} onChangeText={onChangeText} keyboardType="decimal-pad" placeholder="0" placeholderTextColor={colors.textMuted} style={styles.input} selectTextOnFocus />
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
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 50 },
  hero: { paddingBottom: 28, borderBottomLeftRadius: 34, borderBottomRightRadius: 34, overflow: 'hidden' },
  safeHeader: { paddingHorizontal: 18, paddingBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.09)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.13)' },
  historyButton: { height: 40, paddingHorizontal: 14, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(242,216,155,0.22)' },
  historyButtonText: { color: '#F2D89B', fontSize: 12, fontWeight: '700' },
  heroIcon: { width: 52, height: 52, borderRadius: 18, backgroundColor: colors.goldLight, alignItems: 'center', justifyContent: 'center', marginTop: 12, marginLeft: 22 },
  heroEyebrow: { marginTop: 16, marginHorizontal: 22, color: colors.goldLight, fontSize: 10, letterSpacing: 1.8, fontWeight: '800' },
  heroTitle: { marginHorizontal: 22, marginTop: 2, color: '#FFFFFF', fontSize: 40, fontFamily: 'CormorantGaramond-SemiBold' },
  heroText: { marginHorizontal: 22, marginTop: 4, color: colors.textSecondary, fontSize: 14, lineHeight: 21, maxWidth: 350 },
  verseCard: { marginHorizontal: 22, marginTop: 22, padding: 15, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(227,181,90,0.24)' },
  verseText: { color: colors.text, fontFamily: 'CormorantGaramond-Medium', fontSize: 17, lineHeight: 23, marginTop: 8 },
  verseReference: { color: colors.goldLight, fontSize: 11, fontWeight: '700', marginTop: 7 },
  body: { paddingHorizontal: 18, paddingTop: 22 },
  introCard: { flexDirection: 'row', gap: 12, padding: 16, backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.borderSoft, marginBottom: 28 },
  introIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  introCopy: { flex: 1 },
  introTitle: { color: '#F5F1E8', fontSize: 15, fontWeight: '700' },
  introText: { color: colors.textSecondary, fontSize: 12.5, lineHeight: 19, marginTop: 4 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionEyebrow: { color: '#CDAE63', fontSize: 9.5, letterSpacing: 1.6, fontWeight: '800' },
  sectionTitle: { color: '#F5F1E8', fontFamily: 'CormorantGaramond-SemiBold', fontSize: 25, marginTop: 2 },
  sectionDescription: { color: colors.textMuted, fontSize: 12.5, lineHeight: 19, marginTop: 4, marginBottom: 15 },
  modeRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  modeCard: { flex: 1, minHeight: 155, padding: 14, borderRadius: 22, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  modeCardActive: { borderColor: colors.goldLight, backgroundColor: colors.surfaceAlt },
  modeIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  modeIconActive: { backgroundColor: colors.goldLight },
  modeTitle: { color: '#F5F1E8', fontSize: 14, fontWeight: '800', marginTop: 12 },
  modeSubtitle: { color: colors.textMuted, fontSize: 11.5, lineHeight: 16, marginTop: 4, paddingRight: 14 },
  radio: { position: 'absolute', right: 13, top: 13, width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: '#2B2238', alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: '#D8B767' },
  radioDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#D8B767' },
  divider: { height: 1, backgroundColor: '#2B2238', marginVertical: 27 },
  amountCard: { minHeight: 76, flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, marginBottom: 9 },
  amountIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  amountCopy: { flex: 1, paddingHorizontal: 11 },
  amountLabel: { color: '#F2EEE5', fontSize: 13.5, fontWeight: '700' },
  amountDescription: { color: colors.textMuted, fontSize: 10.5, lineHeight: 14, marginTop: 2 },
  inputWrap: { width: 86, height: 44, borderRadius: 13, backgroundColor: colors.backgroundSecondary, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 9 },
  input: { flex: 1, color: '#FFFFFF', textAlign: 'right', fontSize: 15, fontWeight: '700', paddingVertical: 0 },
  currency: { color: '#D8B767', fontSize: 13, fontWeight: '700', marginLeft: 4 },
  yearRow: { flexDirection: 'row', gap: 9, marginBottom: 16 },
  yearChoice: { flex: 1, minHeight: 142, padding: 13, borderRadius: 19, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  yearChoiceActive: { borderColor: colors.goldLight, backgroundColor: colors.surfaceAlt },
  yearIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  yearIconActive: { backgroundColor: colors.goldLight },
  yearChoiceTitle: { color: colors.textSecondary, fontSize: 13.5, fontWeight: '800', marginTop: 10 },
  yearChoiceTitleActive: { color: '#F2D893' },
  yearChoiceRate: { color: '#F5F1E8', fontFamily: 'CormorantGaramond-SemiBold', fontSize: 25, marginTop: 1, fontVariant: ['lining-nums', 'tabular-nums'] },
  yearChoiceHint: { color: colors.textMuted, fontSize: 10, marginTop: 1 },
  hawlQuestion: { color: colors.textSecondary, fontSize: 12.5, lineHeight: 19, fontWeight: '700', marginBottom: 11 },
  hawlRow: { flexDirection: 'row', gap: 9, marginBottom: 14 },
  hawlChoice: { flex: 1, minHeight: 72, paddingHorizontal: 12, borderRadius: 17, borderWidth: 1, borderColor: '#2B2238', backgroundColor: '#151022', alignItems: 'center', justifyContent: 'center', gap: 7 },
  hawlChoiceActive: { backgroundColor: '#D8B767', borderColor: '#D8B767' },
  hawlChoiceText: { color: colors.textSecondary, fontSize: 11.5, fontWeight: '700', textAlign: 'center' },
  hawlChoiceTextActive: { color: colors.background },
  nisabAutoCard: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 20, backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.goldLight, marginTop: 5 },
  nisabAutoIcon: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#1E1730', alignItems: 'center', justifyContent: 'center' },
  nisabAutoCopy: { flex: 1, paddingHorizontal: 12 },
  nisabAutoLabel: { color: '#F3EEE4', fontSize: 12.5, fontWeight: '800' },
  nisabAutoValue: { color: '#F2D893', fontFamily: 'CormorantGaramond-SemiBold', fontSize: 25, marginTop: 2, fontVariant: ['lining-nums', 'tabular-nums'] },
  nisabAutoHint: { color: colors.textMuted, fontSize: 9.5, lineHeight: 14, marginTop: 2 },
  nisabLoadingRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 6 },
  nisabErrorText: { color: '#D8A89C', fontSize: 10.5, marginTop: 4 },
  retryNisab: { width: 36, height: 36, borderRadius: 13, backgroundColor: '#D8B767', alignItems: 'center', justifyContent: 'center' },
  summaryCard: { padding: 17, borderRadius: 20, backgroundColor: '#151022', borderWidth: 1, borderColor: '#2B2238', marginTop: 22 },
  summaryLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5 },
  summaryLabel: { color: colors.textMuted, fontSize: 12.5 },
  summaryValue: { color: colors.textSecondary, fontSize: 13, fontWeight: '700' },
  summaryLabelStrong: { color: '#F4EFE4', fontWeight: '800' },
  summaryValueStrong: { color: '#E2C574', fontSize: 16 },
  summaryDivider: { height: 1, backgroundColor: '#2B2238', marginVertical: 7 },
  calculateButton: { marginTop: 14, borderRadius: 18, overflow: 'hidden' },
  calculateGradient: { height: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  calculateText: { color: colors.background, fontSize: 15, fontWeight: '900' },
  buttonPressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  resultCard: { marginTop: 20, borderRadius: 24, padding: 18, backgroundColor: '#151022', borderWidth: 1, borderColor: '#C8A95E' },
  resultCardNeutral: { borderColor: '#2B2238' },
  resultTopline: { flexDirection: 'row', alignItems: 'center' },
  resultIcon: { width: 46, height: 46, borderRadius: 16, backgroundColor: '#151022', alignItems: 'center', justifyContent: 'center' },
  resultCopy: { marginLeft: 12 },
  resultEyebrow: { color: colors.textSecondary, fontSize: 9, letterSpacing: 1.2, fontWeight: '800' },
  resultAmount: { color: '#F2D893', fontFamily: 'CormorantGaramond-SemiBold', fontSize: 33, marginTop: 1, fontVariant: ['lining-nums', 'tabular-nums'] },
  resultText: { color: colors.textSecondary, fontSize: 13, lineHeight: 20, marginTop: 14 },
  resultNotice: { flexDirection: 'row', gap: 9, padding: 12, borderRadius: 15, backgroundColor: '#151022', marginTop: 14 },
  resultNoticeText: { flex: 1, color: colors.textMuted, fontSize: 11, lineHeight: 16 },
  resetButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, height: 43, marginTop: 13 },
  resetText: { color: '#EBD79F', fontSize: 12.5, fontWeight: '700' },
  educationCard: { marginTop: 28, padding: 18, borderRadius: 24, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSoft },
  educationEyebrow: { color: colors.goldLight, fontSize: 9, fontWeight: '800', letterSpacing: 1.5 },
  educationTitle: { color: colors.text, fontFamily: 'CormorantGaramond-SemiBold', fontSize: 24, marginTop: 3, marginBottom: 8 },
  zakatExplanation: { marginTop: 4 },
  educationRow: { flexDirection: 'row', gap: 11, paddingVertical: 13, borderTopWidth: 1, borderTopColor: colors.borderSoft },
  educationIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  educationCopy: { flex: 1 },
  educationRowTitle: { color: colors.text, fontSize: 15, lineHeight: 20, fontWeight: '700' },
  educationText: { color: colors.textSecondary, fontSize: 14, lineHeight: 21, marginTop: 4 },
  historyPanel: { paddingTop: 4 },
  clearButton: { width: 38, height: 38, borderRadius: 14, backgroundColor: '#2B302C', alignItems: 'center', justifyContent: 'center' },
  emptyHistory: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 28 },
  emptyHistoryTitle: { color: '#EDEAE2', fontSize: 15, fontWeight: '700', marginTop: 13 },
  emptyHistoryText: { color: colors.textMuted, fontSize: 12, textAlign: 'center', lineHeight: 18, marginTop: 5 },
  historyItem: { flexDirection: 'row', alignItems: 'center', padding: 13, borderRadius: 17, backgroundColor: '#151022', borderWidth: 1, borderColor: '#2B2238', marginTop: 9 },
  historyIcon: { width: 36, height: 36, borderRadius: 13, backgroundColor: '#D8B767', alignItems: 'center', justifyContent: 'center' },
  historyCopy: { flex: 1, paddingHorizontal: 10 },
  historyDate: { color: '#EDEAE2', fontSize: 12.5, fontWeight: '700' },
  historyMeta: { color: colors.textMuted, fontSize: 9.5, marginTop: 3 },
  historyAmount: { color: '#E2C574', fontSize: 14, fontWeight: '800' },
  secondaryButton: { marginTop: 20, height: 49, borderRadius: 16, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  secondaryButtonText: { color: colors.textSecondary, fontSize: 13, fontWeight: '700' },
  zakatCtaText: { color: '#1E1730', fontSize: 14, fontWeight: '800' },
  zakatCta: { marginTop: 22, minHeight: 54, borderRadius: 16, backgroundColor: colors.goldLight, alignItems: 'center', justifyContent: 'center', shadowColor: colors.goldLight, shadowOpacity: 0.22, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  educationCardFirst: { marginTop: 0 },
});
