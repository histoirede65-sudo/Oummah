import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Href, router } from 'expo-router';
import { useMemo, useState, type ReactNode } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { CATALOGUE_NAMES, MUSLIM_NAMES, NAME_TAG_LABELS, normalizeNameSearch } from '../../features/muslim-names/data';
import type { NameGender, NameTag } from '../../features/muslim-names/types';
import { ChoiceChip, NameRow, ScreenHeader, prenomTheme } from '../../features/muslim-names/ui';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

const STYLE_TAGS: NameTag[]=['court','rare','classique','facile-france'];
const VALUE_TAGS: NameTag[]=['foi','sagesse','force','doux'];
const HISTORY_TAGS: NameTag[]=['coranique','prophete','compagnon','sahabiyya'];
const ORIGINS=['Toutes','Arabe','Perse','Turc','Sémitique'] as const;
const MAX_LENGTHS=[0,4,5,6,8] as const;

export default function ChooseNameScreen(){
  const [gender,setGender]=useState<NameGender>('boy');
  const [tags,setTags]=useState<NameTag[]>([]);
  const [origin,setOrigin]=useState<(typeof ORIGINS)[number]>('Toutes');
  const [maxLength,setMaxLength]=useState<(typeof MAX_LENGTHS)[number]>(0);
  const [letter,setLetter]=useState('');
  const [verifiedOnly,setVerifiedOnly]=useState(true);
  const [show,setShow]=useState(false);
  const toggle=(tag:NameTag)=>{setShow(false);setTags(x=>x.includes(tag)?x.filter(v=>v!==tag):[...x,tag]);};
  const results=useMemo(()=>MUSLIM_NAMES.filter(item=>{
    if(item.gender!==gender)return false;
    if(verifiedOnly&&item.editorialLevel==='catalogue')return false;
    if(origin!=='Toutes'&&!item.origin.some(x=>normalizeNameSearch(x).includes(normalizeNameSearch(origin))))return false;
    const letters=item.name.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ]/g,'').length;
    if(maxLength&&letters>maxLength)return false;
    if(letter.trim()&&!normalizeNameSearch(item.name).startsWith(normalizeNameSearch(letter.trim().slice(0,1))))return false;
    if(tags.length&&!tags.every(t=>item.tags.includes(t)))return false;
    return true;
  }).sort((a,b)=>(a.editorialLevel==='catalogue'?1:0)-(b.editorialLevel==='catalogue'?1:0)||a.name.localeCompare(b.name,'fr')).slice(0,30),[gender,tags,origin,maxLength,letter,verifiedOnly]);

  const criteria=[gender==='boy'?'Garçon':'Fille',origin!=='Toutes'?origin:null,maxLength?`≤ ${maxLength} lettres`:null,letter.trim()?`Commence par ${letter.trim().slice(0,1).toUpperCase()}`:null,...tags.map(t=>NAME_TAG_LABELS[t]),verifiedOnly?'Fiches vérifiées':null].filter(Boolean).join(' · ');

  return <LinearGradient colors={[colors.background,colors.backgroundSecondary,colors.background]} style={styles.screen}><SafeAreaView style={styles.safe}><ScreenHeader title="Aidez-nous à choisir" onBack={()=>router.back()}/><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <View style={styles.hero}><Text style={styles.eyebrow}>SÉLECTION PERSONNALISÉE</Text><Text style={styles.title}>Trouvez le prénom qui vous ressemble</Text><Text style={styles.subtitle}>Combinez plusieurs critères. OUMMAH n’affiche que les prénoms qui correspondent à tous vos choix, puis place les fiches les plus fiables en premier.</Text></View>
    <Step number="1" title="Pour qui ?"><View style={styles.row}><ChoiceChip label="Garçon" icon="male-outline" active={gender==='boy'} onPress={()=>{setGender('boy');setShow(false)}}/><ChoiceChip label="Fille" icon="female-outline" active={gender==='girl'} onPress={()=>{setGender('girl');setShow(false)}}/></View></Step>
    <Step number="2" title="Origine"><View style={styles.wrap}>{ORIGINS.map(o=><ChoiceChip key={o} label={o} active={origin===o} onPress={()=>{setOrigin(o);setShow(false)}}/>)}</View></Step>
    <Step number="3" title="Longueur & première lettre"><View style={styles.wrap}>{MAX_LENGTHS.map(v=><ChoiceChip key={v} label={v?`≤ ${v} lettres`:'Peu importe'} active={maxLength===v} onPress={()=>{setMaxLength(v);setShow(false)}}/>)}</View><View style={styles.letterBox}><Text style={styles.letterLabel}>PREMIÈRE LETTRE</Text><TextInput value={letter} onChangeText={v=>{setLetter(v.slice(0,1));setShow(false)}} maxLength={1} autoCapitalize="characters" placeholder="A" placeholderTextColor={colors.textMuted} style={styles.letterInput}/></View></Step>
    <Step number="4" title="Style pratique"><Wrap tags={STYLE_TAGS} selected={tags} toggle={toggle}/></Step>
    <Step number="5" title="Sens & qualités"><Wrap tags={VALUE_TAGS} selected={tags} toggle={toggle}/></Step>
    <Step number="6" title="Repères historiques"><Wrap tags={HISTORY_TAGS} selected={tags} toggle={toggle}/><Text style={styles.helper}>« Coranique » signifie que le nom ou le mot apparaît dans le Coran. Cela ne crée pas automatiquement une recommandation religieuse.</Text></Step>
    {CATALOGUE_NAMES.length?<Step number="7" title="Niveau de vérification"><Pressable onPress={()=>{setVerifiedOnly(v=>!v);setShow(false)}} style={[styles.verify,verifiedOnly&&styles.verifyActive]}><Ionicons name={verifiedOnly?'shield-checkmark':'library-outline'} size={19} color={verifiedOnly?colors.background:colors.goldLight}/><View style={{flex:1}}><Text style={[styles.verifyTitle,verifiedOnly&&styles.verifyTitleActive]}>{verifiedOnly?'Fiches OUMMAH uniquement':'Inclure le catalogue culturel'}</Text><Text style={[styles.verifyText,verifiedOnly&&styles.verifyTextActive]}>{verifiedOnly?'Sens et repères déjà relus.':'Plus de choix, avec les fiches catalogue clairement signalées.'}</Text></View></Pressable></Step>:null}
    <View style={styles.summary}><Text style={styles.summaryLabel}>VOS CRITÈRES</Text><Text style={styles.summaryText}>{criteria}</Text></View>
    <Pressable onPress={()=>setShow(true)} style={styles.cta}><Ionicons name="sparkles-outline" size={18} color={colors.background}/><Text style={styles.ctaText}>Voir ma sélection</Text></Pressable>
    {show?<View style={styles.results}><Text style={styles.eyebrow}>SÉLECTION OUMMAH</Text><Text style={styles.resultTitle}>{results.length?`${results.length} prénom${results.length>1?'s':''} à découvrir`:'Aucun résultat'}</Text><Text style={styles.resultSub}>{results.length===30?'Les 30 premiers résultats sont affichés. Affinez les critères si besoin.':'Tous les résultats correspondant aux critères sont affichés.'}</Text><View style={styles.list}>{results.map(item=><NameRow key={item.id} item={item} onPress={()=>router.push(`/prenoms/${item.id}` as Href)}/>)}</View>{!results.length?<Pressable onPress={()=>{setTags([]);setOrigin('Toutes');setMaxLength(0);setLetter('');setShow(false)}} style={styles.reset}><Text style={styles.resetText}>Réinitialiser les critères</Text></Pressable>:null}</View>:null}
  </ScrollView></SafeAreaView></LinearGradient>;
}
function Step({number,title,children}:{number:string;title:string;children:ReactNode}){return <View style={styles.step}><View style={styles.stepHead}><View style={styles.number}><Text style={styles.numberText}>{number}</Text></View><Text style={styles.stepTitle}>{title}</Text></View>{children}</View>}
function Wrap({tags,selected,toggle}:{tags:NameTag[];selected:NameTag[];toggle:(t:NameTag)=>void}){return <View style={styles.wrap}>{tags.map(t=><ChoiceChip key={t} label={NAME_TAG_LABELS[t]} active={selected.includes(t)} onPress={()=>toggle(t)}/>)}</View>}
const styles=StyleSheet.create({screen:{flex:1},safe:{flex:1},content:{padding:16,paddingBottom:54},hero:{padding:20,borderRadius:27,borderWidth:1,borderColor:prenomTheme.borderGold,backgroundColor:prenomTheme.cardStrong},eyebrow:{color:colors.goldLight,fontFamily:typography.sans,fontSize:9,fontWeight:'800',letterSpacing:1.4},title:{marginTop:7,color:colors.text,fontFamily:typography.sans,fontSize:25,fontWeight:'800',lineHeight:31},subtitle:{marginTop:7,color:colors.textSecondary,fontFamily:typography.sans,fontSize:12,lineHeight:19},step:{marginTop:12,padding:17,borderRadius:22,borderWidth:1,borderColor:colors.borderSoft,backgroundColor:prenomTheme.card},stepHead:{flexDirection:'row',alignItems:'center',gap:10,marginBottom:13},number:{width:29,height:29,borderRadius:10,alignItems:'center',justifyContent:'center',backgroundColor:prenomTheme.goldWash},numberText:{color:colors.goldLight,fontFamily:typography.sans,fontSize:10,fontWeight:'900'},stepTitle:{color:colors.text,fontFamily:typography.sans,fontSize:14,fontWeight:'800'},row:{flexDirection:'row',gap:8},wrap:{flexDirection:'row',flexWrap:'wrap',gap:8},helper:{marginTop:11,color:colors.textMuted,fontFamily:typography.sans,fontSize:9.5,lineHeight:15},letterBox:{marginTop:12,padding:12,borderRadius:16,backgroundColor:'rgba(255,255,255,.03)',flexDirection:'row',alignItems:'center',justifyContent:'space-between'},letterLabel:{color:colors.textMuted,fontFamily:typography.sans,fontSize:9,fontWeight:'800',letterSpacing:1},letterInput:{width:52,height:42,borderRadius:13,borderWidth:1,borderColor:prenomTheme.borderGold,color:colors.text,textAlign:'center',fontFamily:typography.sans,fontSize:20,fontWeight:'900',backgroundColor:prenomTheme.goldWash},verify:{padding:14,borderRadius:17,borderWidth:1,borderColor:prenomTheme.borderGold,backgroundColor:prenomTheme.goldWash,flexDirection:'row',alignItems:'center',gap:10},verifyActive:{backgroundColor:colors.goldLight},verifyTitle:{color:colors.text,fontFamily:typography.sans,fontSize:12.5,fontWeight:'800'},verifyTitleActive:{color:colors.background},verifyText:{marginTop:3,color:colors.textMuted,fontFamily:typography.sans,fontSize:9.5,lineHeight:14},verifyTextActive:{color:'rgba(8,7,19,.68)'},summary:{marginTop:14,padding:15,borderRadius:18,backgroundColor:'rgba(255,255,255,.03)'},summaryLabel:{color:colors.goldLight,fontFamily:typography.sans,fontSize:8.5,fontWeight:'800',letterSpacing:1.2},summaryText:{marginTop:5,color:colors.textSecondary,fontFamily:typography.sans,fontSize:10.5,lineHeight:16},cta:{marginTop:12,minHeight:52,borderRadius:17,backgroundColor:colors.goldLight,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:8},ctaText:{color:colors.background,fontFamily:typography.sans,fontSize:12,fontWeight:'900'},results:{marginTop:28},resultTitle:{marginTop:5,color:colors.text,fontFamily:typography.sans,fontSize:22,fontWeight:'800'},resultSub:{marginTop:4,color:colors.textMuted,fontFamily:typography.sans,fontSize:10.5,lineHeight:16},list:{marginTop:12,gap:9},reset:{marginTop:12,minHeight:46,borderRadius:15,borderWidth:1,borderColor:prenomTheme.borderGold,alignItems:'center',justifyContent:'center'},resetText:{color:colors.goldLight,fontFamily:typography.sans,fontSize:11,fontWeight:'800'}});
