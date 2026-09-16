import { StyleSheet, Text, View } from "react-native";
import { colors } from "../../../theme/colors";
export function FiqhPersonalCaseNotice() { return <View style={styles.box}><Text style={styles.title}>CAS PERSONNEL</Text><Text style={styles.text}>Ce sujet peut dépendre de détails personnels. Pour une situation réelle, consulte une personne qualifiée.</Text></View>; }
const styles = StyleSheet.create({ box: { marginTop: 22, padding: 15, borderRadius: 15, backgroundColor: "rgba(200,148,58,0.13)", borderWidth: 1, borderColor: "rgba(227,181,90,0.38)" }, title: { color: colors.goldLight, fontSize: 11, fontWeight: "800", letterSpacing: 1 }, text: { color: colors.text, fontSize: 15, lineHeight: 22, marginTop: 7 } });
