import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import type { Href } from "expo-router";
import { router } from "expo-router";
import { SafeAreaView, ScrollView, StyleSheet, Text, Pressable, View } from "react-native";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";

const WOMEN = [
  { name:"Maryam bint ‘Imrân", arabic:"مريم بنت عمران", tag:"CHOISIE ET PURIFIÉE", text:"Le Coran raconte sa consécration, sa confiance en Allah et la naissance miraculeuse de ‘Îsâ عليه السلام. Elle est explicitement choisie et purifiée.", quran:[3,42], source:"Âl ‘Imrân 3:42–47" },
  { name:"Âsiyah, épouse de Pharaon", arabic:"آسية امرأة فرعون", tag:"FOI SOUS L’ÉPREUVE", text:"Le Coran donne son invocation en exemple aux croyants : elle demanda à Allah une demeure auprès de Lui au Paradis, malgré la tyrannie qui l’entourait.", quran:[66,11], source:"At-Tahrîm 66:11" },
  { name:"Khadîjah bint Khuwaylid", arabic:"خديجة بنت خويلد", tag:"FIDÉLITÉ ET SOUTIEN", text:"Première épouse du Prophète ﷺ et soutien majeur au commencement de la Révélation. Des hadiths authentiques rapportent son immense mérite et l’annonce d’une demeure au Paradis.", hadith:"Sahih Muslim 2430 · Jâmi‘ at-Tirmidhî 3876" },
  { name:"Fâtimah bint Muhammad", arabic:"فاطمة بنت محمد", tag:"FILLE DU PROPHÈTE ﷺ", text:"Fille bien-aimée du Messager d’Allah ﷺ, elle possède un rang éminent dans la Sunna et fait partie des quatre femmes citées dans le hadith de référence.", hadith:"Jâmi‘ at-Tirmidhî 3878" },
  { name:"‘Â’ishah bint Abî Bakr", arabic:"عائشة بنت أبي بكر", tag:"SCIENCE ET TRANSMISSION", text:"Mère des croyants et grande transmettrice de la Sunna. Le Prophète ﷺ a explicitement souligné son mérite dans un hadith authentique.", hadith:"Jâmi‘ at-Tirmidhî 3887" },
  { name:"Hâjar", arabic:"هاجر", tag:"CONFIANCE EN ALLAH", text:"Mère d’Ismâ‘îl عليه السلام. Son histoire à La Mecque, sa recherche d’eau et Zamzam sont rapportées dans la Sunna authentique.", hadith:"Sahih al-Bukhârî 3364" },
  { name:"La mère de Mûsâ", arabic:"أم موسى", tag:"UNE CONFIANCE INÉBRANLABLE", text:"Allah lui inspira de déposer son enfant dans le fleuve et lui promit de le lui rendre. Son récit est une histoire exceptionnelle de peur, de confiance et de promesse divine.", quran:[28,7], source:"Al-Qasas 28:7–13" },
  { name:"Umm Salamah", arabic:"أم سلمة", tag:"SAGESSE ET PATIENCE", text:"Mère des croyants, connue pour sa sagesse, sa patience dans l’épreuve et sa place dans la transmission de la Sunna.", hadith:"Sahih Muslim · récits authentiques des Mères des croyants" },
  { name:"Asmâ’ bint Abî Bakr", arabic:"أسماء بنت أبي بكر", tag:"COURAGE ET SERVICE", text:"Compagne connue pour son rôle lors de l’Hijra et pour sa fermeté. Son parcours appartient à l’histoire des premières générations musulmanes.", hadith:"Sahih al-Bukhârî · récits de l’Hijra" },
];

export default function WomenOfHistoryScreen() {
 return <LinearGradient colors={[colors.background, colors.backgroundSecondary, colors.background]} style={styles.screen}>
  <SafeAreaView style={styles.safe}>
   <View style={styles.header}><Pressable onPress={()=>router.back()} style={styles.back}><Ionicons name="chevron-back" size={23} color={colors.text}/></Pressable><Text style={styles.headerTitle}>Femmes d’exception</Text><View style={{width:44}}/></View>
   <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <LinearGradient colors={["#1E1730","#151022"]} style={styles.hero}>
      <View style={styles.heroIcon}><Ionicons name="sparkles" size={26} color={colors.goldLight}/></View>
      <Text style={styles.kicker}>FOI · PATIENCE · SCIENCE · COURAGE</Text>
      <Text style={styles.heroTitle}>Des femmes qui ont marqué l’histoire</Text>
      <Text style={styles.heroText}>Le Coran et la Sunna ont conservé le souvenir de femmes dont la foi, la patience, le courage ou la science éclairent encore les croyants.</Text>
      <View style={styles.hadithBox}><Text style={styles.hadithLabel}>HADITH DE RÉFÉRENCE</Text><Text style={styles.hadithText}>Le Prophète ﷺ a cité Maryam bint ‘Imrân, Khadîjah bint Khuwaylid, Fâtimah bint Muhammad et Âsiyah, épouse de Pharaon, parmi les femmes éminentes.</Text><Text style={styles.hadithSource}>Jâmi‘ at-Tirmidhî 3878 · authentifié sahîh</Text></View>
    </LinearGradient>
    <Text style={styles.sectionTitle}>Parcours remarquables</Text>
    <Text style={styles.sectionIntro}>Il ne s’agit pas d’inventer un classement. Chaque carte distingue ce qui est établi par le Coran, la Sunna authentique ou l’histoire transmise.</Text>
    {WOMEN.map((w,i)=><View key={w.name} style={styles.card}>
      <View style={styles.cardTop}><View style={styles.num}><Text style={styles.numText}>{String(i+1).padStart(2,"0")}</Text></View><Text style={styles.tag}>{w.tag}</Text></View>
      <Text style={styles.name}>{w.name}</Text><Text style={styles.arabic}>{w.arabic}</Text><Text style={styles.body}>{w.text}</Text>
      {w.quran ? <Pressable onPress={()=>router.push(`/surah/${w.quran[0]}?verse=${w.quran[1]}` as Href)} style={styles.source}><Ionicons name="book-outline" size={17} color={colors.goldLight}/><View style={{flex:1}}><Text style={styles.sourceType}>CORAN</Text><Text style={styles.sourceText}>{w.source}</Text></View><Ionicons name="chevron-forward" size={16} color={colors.textMuted}/></Pressable> :
      <View style={styles.source}><Ionicons name="shield-checkmark-outline" size={17} color={colors.goldLight}/><View style={{flex:1}}><Text style={styles.sourceType}>SUNNA / SOURCE</Text><Text style={styles.sourceText}>{w.hadith}</Text></View></View>}
    </View>)}
    <View style={styles.note}><Ionicons name="shield-checkmark-outline" size={21} color={colors.goldLight}/><Text style={styles.noteText}>Aucun portrait n’est nécessaire pour transmettre leur grandeur : le module privilégie les récits, les sources et les enseignements.</Text></View>
   </ScrollView>
  </SafeAreaView>
 </LinearGradient>
}
const styles=StyleSheet.create({
 screen:{flex:1},safe:{flex:1},header:{minHeight:74,paddingHorizontal:16,flexDirection:"row",alignItems:"center"},back:{width:44,height:44,borderRadius:22,borderWidth:1,borderColor:"#2B2238",alignItems:"center",justifyContent:"center",backgroundColor:"rgba(255,255,255,.04)"},headerTitle:{flex:1,textAlign:"center",color:colors.text,fontFamily:typography.serifSemibold,fontSize:22},content:{padding:16,paddingBottom:60},
 hero:{padding:23,borderRadius:30,borderWidth:1,borderColor:"rgba(227,181,90,.30)"},heroIcon:{width:52,height:52,borderRadius:18,alignItems:"center",justifyContent:"center",backgroundColor:"rgba(227,181,90,.11)",marginBottom:18},kicker:{color:colors.goldLight,fontFamily:typography.sans,fontSize:9,fontWeight:"900",letterSpacing:1.4},heroTitle:{marginTop:8,color:colors.text,fontFamily:typography.serifSemibold,fontSize:31,lineHeight:36},heroText:{marginTop:11,color:colors.textSecondary,fontFamily:typography.sans,fontSize:14,lineHeight:22},hadithBox:{marginTop:20,padding:16,borderRadius:20,backgroundColor:"rgba(8,7,19,.42)",borderWidth:1,borderColor:"rgba(227,181,90,.18)"},hadithLabel:{color:colors.goldLight,fontSize:9,fontWeight:"900",letterSpacing:1.2},hadithText:{marginTop:8,color:colors.text,fontSize:13.5,lineHeight:21,fontFamily:typography.sans},hadithSource:{marginTop:8,color:colors.textMuted,fontSize:10.5,fontFamily:typography.sans},
 sectionTitle:{marginTop:28,color:colors.text,fontFamily:typography.serifSemibold,fontSize:26},sectionIntro:{marginTop:6,marginBottom:12,color:colors.textSecondary,fontFamily:typography.sans,fontSize:13,lineHeight:20},card:{marginTop:10,padding:18,borderRadius:24,borderWidth:1,borderColor:"rgba(227,181,90,.20)",backgroundColor:"#151022"},cardTop:{flexDirection:"row",alignItems:"center",gap:10},num:{width:30,height:30,borderRadius:15,alignItems:"center",justifyContent:"center",backgroundColor:"rgba(227,181,90,.12)"},numText:{color:colors.goldLight,fontWeight:"900",fontSize:9},tag:{color:colors.goldLight,fontSize:8.5,fontWeight:"900",letterSpacing:1.1},name:{marginTop:13,color:colors.text,fontFamily:typography.serifSemibold,fontSize:22},arabic:{marginTop:2,color:colors.textMuted,fontFamily:typography.arabic,fontSize:19},body:{marginTop:9,color:colors.textSecondary,fontFamily:typography.sans,fontSize:13.5,lineHeight:21},source:{marginTop:14,padding:12,borderRadius:16,flexDirection:"row",alignItems:"center",gap:10,backgroundColor:"rgba(227,181,90,.06)",borderWidth:1,borderColor:"rgba(227,181,90,.12)"},sourceType:{color:colors.goldLight,fontSize:8,fontWeight:"900",letterSpacing:1},sourceText:{marginTop:2,color:colors.textSecondary,fontSize:11.5},note:{marginTop:18,padding:17,borderRadius:22,flexDirection:"row",gap:11,borderWidth:1,borderColor:"#2B2238"},noteText:{flex:1,color:colors.textSecondary,fontSize:12.5,lineHeight:19}
});