import type { Problem, Source, Step } from "./pilgrimageTypes";

const ref = (step: Step, field: string, text: string) => ({ id: `${step.id}-${field}`, text, sources: sourceFor[step.id] ?? [] });
const sourceFor: Record<string, Source[]> = {
 miqat:[{kind:"AUTHENTIC_HADITH",reference:"Sahîh al-Bukhârî 1526"}], ihram:[{kind:"QURAN",reference:"Coran 2:196"}], talbiyah:[{kind:"AUTHENTIC_HADITH",reference:"Sahîh al-Bukhârî 1549"}], prohibitions:[{kind:"QURAN",reference:"Coran 2:197"}], tawaf:[{kind:"AUTHENTIC_HADITH",reference:"Sahîh Muslim 1218"}], "black-stone":[{kind:"AUTHENTIC_HADITH",reference:"Sahîh al-Bukhârî 1611"}], prayer:[{kind:"QURAN",reference:"Coran 2:125"}], sai:[{kind:"QURAN",reference:"Coran 2:158"},{kind:"AUTHENTIC_HADITH",reference:"Sahîh Muslim 1218"}], hair:[{kind:"AUTHENTIC_HADITH",reference:"Sahîh Muslim 1301"}], types:[{kind:"QURAN",reference:"Coran 2:196"}], "arafat-9":[{kind:"AUTHENTIC_HADITH",reference:"Sahîh Muslim 1218"}], muzdalifah:[{kind:"AUTHENTIC_HADITH",reference:"Sahîh Muslim 1218"}], "nahr-10":[{kind:"AUTHENTIC_HADITH",reference:"Sahîh Muslim 1218"}], "tashriq-11":[{kind:"AUTHENTIC_HADITH",reference:"Sahîh Muslim 1299"}], "tashriq-12":[{kind:"AUTHENTIC_HADITH",reference:"Sahîh Muslim 1299"}], "tashriq-13":[{kind:"AUTHENTIC_HADITH",reference:"Sahîh Muslim 1299"}], farewell:[{kind:"AUTHENTIC_HADITH",reference:"Sahîh Muslim 1327"}]
};const umrah: Record<string, Partial<Step>> = {
 preparation:{whatToDo:["Apprenez les rites, vérifiez l’itinéraire et préparez vos besoins de santé et de sécurité." as never],when:["Avant le mîqât." as never]},
 miqat:{whatToDo:["Entrez en ihrâm avant de franchir le mîqât si vous avez l’intention de la ‘Umra." as never],how:["En avion, préparez-vous avant le passage annoncé ; si le mîqât est dépassé, consultez rapidement." as never]},
 ihram:{whatToDo:["L’ihrâm est l’état rituel qui commence avec l’intention ; ce n’est pas seulement un vêtement." as never],men:["L’homme porte les deux pièces prévues et respecte les interdits de l’ihrâm." as never],women:["La femme porte une tenue pudique habituelle ; les détails du visage et des gants relèvent du fiqh." as never]},
 talbiyah:{whatToSay:["Labbayka Allâhumma labbayk, labbayka lâ sharîka laka labbayk, inna l-hamda wa-n-ni‘mata laka wa-l-mulk, lâ sharîka lak." as never],when:["Répétez-la après l’entrée en ihrâm jusqu’au rite qui met fin à cette récitation." as never]},
 prohibitions:{avoid:["Évitez les rapports conjugaux, le parfum intentionnel, la chasse et les autres interdits ; la conséquence dépend du cas." as never],commonMistakes:["Ne donnez pas automatiquement la même conséquence à l’oubli, la contrainte et l’acte volontaire." as never]},
 haram:{how:["Entrez avec recueillement et rejoignez le Tawâf sans bloquer les passages." as never]},
 "tawaf-prep":{how:["Repérez le départ, gardez la Kaaba à gauche et préservez les flux ; la purification est une question de fiqh distincte." as never],women:["Une femme menstruée peut entrer en ihrâm et accomplir les rites autres que le Tawâf ; le Tawâf est normalement différé jusqu’à la purification. Si elle doit partir avant, demandez rapidement un avis qualifié." as never],juristicDifferences:[{question:"Les ablutions sont-elles une condition de validité du Tawâf ?",establishedPoint:"La purification est la pratique recommandée et la précaution à suivre.",views:[{label:"Avis majoritaire",position:"La purification est une condition de validité du Tawâf.",consequence:"Renouveler les ablutions et demander la conduite à tenir si elles sont perdues.",evidences:[{kind:"FIQH",reference:"Al-Nawawî, Al-Majmû‘, chapitre du Tawâf"}]},{label:"Avis juridique différent",position:"Des juristes hanafites et une opinion rapportée d’Ahmad ne la considèrent pas comme une condition de validité.",consequence:"La conséquence dépend du cas et de l’école suivie ; ne pas recommencer seul.",evidences:[{kind:"FIQH",reference:"Ibn Qudâma, Al-Mughnî, chapitre du Tawâf"}]}],practicalNote:"Une situation en cours nécessite l’avis rapide d’une personne qualifiée."}]},
 tawaf:{whatToDo:["Accomplissez sept tours complets autour de la Kaaba, sans imposer une invocation à chaque tour." as never],commonMistakes:["Ne comptez pas les allers-retours comme des tours et ne poussez pas." as never]},
 "black-stone":{whatToDo:["Saluez la Pierre noire sans bousculer ; si l’accès est impossible, faites un signe au niveau du passage." as never],how:["Pour l’angle yéménite, touchez-le si possible sans danger ; ne le saluez pas à distance par un geste." as never]},
 ramal:{men:["Le ramal et l’idtibâ‘ sont des pratiques masculines dont les conditions relèvent du fiqh ; la sécurité prime." as never],women:["La femme marche normalement et privilégie pudeur et sécurité." as never]},
 prayer:{when:["Après les sept tours, priez deux rak‘ât dans un lieu autorisé sans bloquer les flux." as never]},
 zamzam:{whatToDo:["Buvez de Zamzam si possible sans gêner les autres ; invoquez Allah librement." as never]},
 sai:{whatToDo:["Faites sept trajets : Safâ vers Marwa compte un, puis retour deux, jusqu’à terminer à Marwa." as never],men:["L’homme accélère entre les repères si cela est sûr." as never],women:["La femme marche normalement." as never]},
 hair:{whatToDo:["Après les actes requis, l’homme rase ou raccourcit ; la femme raccourcit une partie des pointes." as never]},
 exit:{when:["Après les actes requis et la coupe, la sortie de l’ihrâm intervient selon le rite." as never]},
 complete:{whatToDo:["Vérifiez les actes accomplis ; le suivi local est une aide-mémoire et non un jugement de validité." as never]}
};
const hajj: Record<string, Partial<Step>> = {
 types:{whatToDo:["Tamattu‘ : ‘Umra puis sortie d’ihrâm avant le Hajj. Qirân : les deux rites dans un même ihrâm. Ifrâd : Hajj seul." as never]},
 "mina-8":{whatToDo:["Le 8 Dhul-Hijjah, rejoignez Mina selon l’organisation officielle et préparez ‘Arafât." as never]},
 "arafat-9":{whatToDo:["Soyez présent à ‘Arafât pendant le temps du wuqûf, station centrale du Hajj, et invoquez Allah." as never]},
 muzdalifah:{specialCases:["Le cas normal est de rester à Muzdalifah après ‘Arafât. Une permission de départ nocturne est rapportée pour certaines personnes vulnérables afin d’éviter la foule ; ce n’est pas une règle générale." as never],whatToDo:["Après ‘Arafât, rejoignez Muzdalifah et suivez les horaires et consignes officielles." as never]},
 "nahr-10":{whatToDo:["Le 10, accomplissez les rites qui vous incombent selon votre type de Hajj et votre encadrement." as never]},
 "tashriq-11":{specialCases:["Le séjour nocturne à Mina est le principe pour les jours concernés ; les dispenses et leurs conséquences dépendent de la nécessité et des avis juridiques." as never],whatToDo:["Le 11, lapidez les trois Jamarât dans l’ordre et aux horaires officiels." as never]},
 "tashriq-12":{whatToDo:["Le 12, accomplissez les Jamarât ; le départ anticipé est soumis à des conditions." as never]},
 "tashriq-13":{whatToDo:["Celui qui reste jusqu’au 13 accomplit les Jamarât prévues." as never]},
 farewell:{whatToDo:["Accomplissez le Tawâf al-Wadâ‘ avant de quitter La Mecque, sauf exemption établie." as never]},
 "complete-hajj":{whatToDo:["Vérifiez votre programme avec l’encadrement avant le départ." as never]}
};
function normalize(details: Partial<Step>, step: Step): Partial<Step> { const out: Partial<Step>={...details}; for (const key of Object.keys(out) as (keyof Step)[]) { const values=out[key]; if (Array.isArray(values)) out[key]=values.map((v,i)=>typeof v === "string" ? ref(step,`${String(key)}-${i}`,v) : v) as never; } return out; }
export function enrichStep(step: Step): Step { const details={ ...normalize(umrah[step.id] ?? {},step), ...normalize(hajj[step.id] ?? {},step) }; return { ...step, ...details, do: [...step.do, ...(details.whatToDo ?? [])] }; }

const problemAdvice = [
  ["Un doute pendant le Tawâf ou le Sa‘y ne se traite pas automatiquement de la même façon.", "Retenez le nombre certain et consultez si le doute affecte la validité du rite."],
  ["La purification pour le Tawâf fait l’objet d’une divergence juridique ; elle est distincte du Sa‘y.", "Renouvelez vos ablutions si possible et demandez un avis adapté à votre école et à votre situation."],
  ["Toucher la Pierre noire n’est pas une permission de pousser ou de blesser.", "Saluez-la à distance au niveau du passage et poursuivez votre tour."],
  ["La conséquence dépend de votre intention avant le mîqât, de l’itinéraire et de la possibilité de revenir.", "Contactez immédiatement un guide qualifié ; ne choisissez pas seul un dam ou une fidya."],
  ["Un acte oublié peut être un pilier, une obligation ou une recommandation : les conséquences diffèrent.", "Notez l’acte et le moment précis, puis demandez conseil avant de continuer au hasard."],
  ["L’oubli, la contrainte et l’acte volontaire ne reçoivent pas nécessairement le même traitement.", "Conservez le contexte exact et consultez si une compensation est envisagée."],
  ["Un produit parfumé, son intention et son usage médical doivent être distingués.", "Cessez l’usage si possible, gardez la composition du produit et demandez un avis."],
  ["La maladie ou le handicap peuvent nécessiter des aménagements officiels ; la sécurité reste prioritaire.", "Suivez les dispositifs autorisés et l’encadrement médical et religieux."],
  ["La grossesse et les menstruations sont deux situations distinctes et ne produisent pas automatiquement les mêmes effets.", "Demandez séparément un avis médical et religieux personnalisé."],
  ["Le lavage et l’hygiène ne sont pas identiques à l’usage intentionnel de parfum.", "Utilisez si possible des produits non parfumés et vérifiez leur composition."],
  ["Savon, crème solaire et médicament peuvent avoir des compositions et nécessités différentes.", "Privilégiez le non-parfumé ; ne cessez jamais un traitement sans médecin."],
  ["Le doute apparu pendant le rite doit être distingué du doute apparu après son achèvement.", "Notez le nombre certain et consultez avant de recommencer un rite complet."],
  ["La femme menstruée qui a achevé les autres rites bénéficie d’une exemption rapportée pour le Tawâf d’adieu.", "Vérifiez avec un guide qu’aucun autre rite ou départ obligatoire ne reste à traiter."],
  ["Arriver après le mîqât nécessite de distinguer l’intention formée avant ou après la limite.", "Exposez l’itinéraire et les horaires à une personne qualifiée sans improviser de compensation."],
  ["Une obligation, un pilier et une recommandation n’ont pas la même conséquence.", "Identifiez la qualification de l’acte auprès d’un référent fiable."],
  ["La déshydratation peut rendre dangereuse la poursuite immédiate du rite.", "Mettez-vous à l’abri, hydratez-vous et prévenez l’encadrement."],
  ["Se perdre dans la foule est d’abord une situation de sécurité, pas une faute rituelle.", "Rejoignez un point de rassemblement officiel et contactez votre groupe."],
  ["La nécessité d’un médicament parfumé doit être distinguée d’un usage de confort.", "Ne stoppez pas le traitement ; demandez un avis médical et juridique."],
  ["L’incapacité à marcher doit être évaluée selon l’état de santé et les moyens officiels disponibles.", "Utilisez les aménagements autorisés et demandez conseil si le rite est interrompu."],
  ["Le départ de Mina le 12 et le séjour jusqu’au 13 ont des conditions distinctes.", "Notez l’heure et les rites accomplis, puis consultez rapidement."],
  ["Le type de Hajj, notamment Tamattu‘, Qirân ou Ifrâd, peut déterminer le hady.", "Vérifiez votre type et votre situation avec une personne qualifiée avant de payer ou d’omettre un sacrifice."],
  ["Le Tawâf d’adieu comporte des exemptions et des cas particuliers documentés.", "Consultez avant le départ, surtout en cas de menstruations, maladie ou contrainte de transport."],
  ["La validité d’une intention dépend de ce qui a été voulu et du moment où le rite a été commencé.", "Décrivez les faits exactement ; ne tentez pas de reconstruire l’intention après coup."],
  ["La sortie de l’ihrâm intervient après les actes requis et la coupe adaptée au rite.", "Vérifiez votre étape et votre type de Hajj avant de lever les restrictions."],
] as const;
export function enrichProblems(problems: Problem[]): Problem[] { return problems.map((p,i)=>{ const [know,now]=problemAdvice[i] ?? ["La réponse dépend des circonstances précises.","Notez les faits et consultez une personne qualifiée."]; return { ...p, situation:p.question, shortAnswer:know, whatToKnow:know, whatToDoNow:now, whenToSeekHelp:"Consultez lorsqu’un pilier, une obligation, la validité ou une compensation peut être en jeu.", evidences:p.sources, id:p.id||`problem-${i}` }; }); }


