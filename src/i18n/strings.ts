/**
 * Every user-facing string, in one place, keyed by meaning rather than by
 * component — several keys are read from more than one screen.
 *
 * `en` is the source of truth: `StringKey` is derived from it, and `fr` is typed
 * as a total record over those keys, so a forgotten translation is a compile
 * error rather than a French word surfacing in the English UI.
 *
 * What is deliberately NOT here: anything persisted. Emotion ids, check-in slot
 * ids (`matin` / `apresmidi` / `soir`) and mood values 1–5 are database values
 * that happen to look like French words. They keep their spelling forever; only
 * their labels live below, keyed by the id.
 */
export const en = {
  'nav.today': 'Today',
  'nav.summary': 'Summary',
  'nav.week': 'Week',
  'nav.habits': 'Habits',
  'nav.stats': 'Stats',
  'nav.signOut': 'Sign out',
  'nav.signOutShort': 'Out',

  'theme.toLight': 'Switch to light',
  'theme.toDark': 'Switch to dark',
  'theme.light': 'Light',
  'theme.dark': 'Dark',

  /** Names the language you would switch TO, not the current one. */
  'lang.switchTo': 'Passer en français',

  'app.loading': 'Loading…',
  'app.loadingData': 'Loading your data…',

  'auth.welcomeBack': 'Welcome back',
  'auth.createAccount': 'Create your account',
  'auth.email': 'Email',
  'auth.password': 'Password',
  'auth.signIn': 'Sign in',
  'auth.signUp': 'Sign up',
  'auth.submitCreate': 'Create account',
  'auth.noAccount': "Don't have an account? ",
  'auth.hasAccount': 'Already have an account? ',

  'common.delete': 'Delete',
  'common.rename': 'Rename',
  'common.today': 'Today',
  'common.yesterday': 'Yesterday',
  'common.tasks': 'tasks',
  'common.days': 'days',

  'today.placeholder': 'Write an entry…',
  'today.add': '+ Add an entry',
  'today.empty': 'Nothing written today.',
  'today.delete': '× Delete',
  'today.streak': '· streak {n}d',
  'today.markDone': '{name} — mark as done',
  'today.moved': '{name} — moved',
  'today.actions': 'Actions for {name}',

  'week.range': 'Week of {from} to {to}',
  'week.past': 'Past week',
  'week.ahead': 'Week ahead',
  'week.taskPlaceholder': 'Task name…',
  'week.addTask': '+ Add a task',
  'week.movedElsewhere': 'Moved to another day',
  'week.deleteTask': 'Delete task {name}',

  'backlog.title': 'Backlog',
  'backlog.add': '+ Add',
  'backlog.placeholder': 'New task…',
  'backlog.empty': 'No tasks — tap "+ Add"',
  'backlog.deleteItem': 'Delete {name}',

  'habits.habit': 'Habit',
  'habits.week': 'Week',
  'habits.streak': 'Streak',
  'habits.add': '+ Add a habit',
  'habits.deleteHabit': 'Delete habit {name}',

  'dash.weekProgress': 'Week progress',
  'dash.tasksPerDay': 'Tasks done per day',
  'dash.tasksDone': 'Tasks done',
  'dash.quote': 'Quote of the day',
  'dash.habitStreaks': 'Habit streaks',
  'dash.mood': 'Mood',

  'checkin.title': 'Emotional check-in',
  'slot.matin': 'Morning',
  'slot.apresmidi': 'Afternoon',
  'slot.soir': 'Evening',

  'stats.thisWeek': 'This week',
  'stats.vsLastWeek': 'vs last week',
  'stats.bestWeek': 'Best week',
  'stats.tasksInAWeek': 'tasks in one week',
  'stats.allTime': 'All time',
  'stats.tasksDoneSub': 'tasks done',
  'stats.longestStreak': 'Longest streak',
  'stats.dayPerformance': 'Daily performance — current week',
  'stats.habitRegularity': 'Habit consistency',
  'stats.weekHistory': 'Week by week',
  'stats.habitsAndMood': 'Habits and mood',
  'stats.currentStreaks': 'Current streaks',
  'stats.noHabits': 'No habits tracked yet.',

  'chart.day': 'Day:',
  'chart.avg7d': '7-day avg:',
  'chart.pctOfDay': '% of day',
  'chart.avg7dLegend': '7-day average',
  'chart.showingDone': 'Showing: days done',
  'chart.showingNotDone': 'Showing: days NOT done',
  'chart.invert': '↕ Invert',
  'chart.inverted': '↕ Inverted',
  'chart.invertedSuffix': '(inverted)',
  'chart.noDataHabit': 'No data for this habit.',
  'chart.noHabitData': 'No habit data.',
  'chart.week': 'Week {n}',
  'chart.activeDays': 'active days',

  'cmp.howToRead': 'Your mood, averaged over 7 days, minus your own average of {v}. Above the line is a stretch better than your normal, below it a worse one — the further from the line, the bigger the gap.',
  'cmp.above': 'better than your normal',
  'cmp.below': 'worse than your normal',
  'cmp.baseline': 'your average · {v}',
  'cmp.habitsPane': 'habits done, % of the day',
  'cmp.moodPane': 'mood, 1–5',

  'level.none': 'Nothing',
  'level.slow': 'Starting',
  'level.mid': 'On track',
  'level.fire': 'Heating up',
  'level.beast': 'All in',

  'mood.1': 'rough',
  'mood.2': 'meh',
  'mood.3': 'okay',
  'mood.4': 'good',
  'mood.5': 'great',

  'emotion.heureux': 'Happy',
  'emotion.energise': 'Energised',
  'emotion.blase': 'Jaded',
  'emotion.bien': 'Good',
  'emotion.embarrasse': 'Embarrassed',
  'emotion.malaaise': 'Uneasy',
  'emotion.tendu': 'Tense',
  'emotion.en-colere': 'Angry',
  'emotion.apeure': 'Scared',
  'emotion.enjoleur': 'Flirty',
  'emotion.joueur': 'Playful',
  'emotion.hebete': 'Dazed',
  'emotion.concentre': 'Focused',
  'emotion.triste': 'Sad',
  'emotion.confiant': 'Confident',
  'emotion.inspire': 'Inspired',
} as const;

export type StringKey = keyof typeof en;

export const fr: Record<StringKey, string> = {
  'nav.today': "Aujourd'hui",
  'nav.summary': 'Résumé',
  'nav.week': 'Semaine',
  'nav.habits': 'Habitudes',
  'nav.stats': 'Stats',
  'nav.signOut': 'Se déconnecter',
  'nav.signOutShort': 'Sortir',

  'theme.toLight': 'Passer en clair',
  'theme.toDark': 'Passer en sombre',
  'theme.light': 'Clair',
  'theme.dark': 'Sombre',

  'lang.switchTo': 'Switch to English',

  'app.loading': 'Chargement…',
  'app.loadingData': 'Chargement de tes données…',

  'auth.welcomeBack': 'Content de te revoir',
  'auth.createAccount': 'Crée ton compte',
  'auth.email': 'Email',
  'auth.password': 'Mot de passe',
  'auth.signIn': 'Se connecter',
  'auth.signUp': "S'inscrire",
  'auth.submitCreate': 'Créer le compte',
  'auth.noAccount': 'Pas encore de compte ? ',
  'auth.hasAccount': 'Déjà un compte ? ',

  'common.delete': 'Supprimer',
  'common.rename': 'Renommer',
  'common.today': "Aujourd'hui",
  'common.yesterday': 'Hier',
  'common.tasks': 'tâches',
  'common.days': 'jours',

  'today.placeholder': 'Écrire une entrée…',
  'today.add': '+ Ajouter une entrée',
  'today.empty': "Rien d'écrit aujourd'hui.",
  'today.delete': '× Supprimer',
  'today.streak': '· série {n}j',
  'today.markDone': '{name} — marquer comme fait',
  'today.moved': '{name} — migrée',
  'today.actions': 'Actions pour {name}',

  'week.range': 'Semaine du {from} au {to}',
  'week.past': 'Semaine passée',
  'week.ahead': 'Semaine à venir',
  'week.taskPlaceholder': 'Nom de la tâche…',
  'week.addTask': '+ Ajouter une tâche',
  'week.movedElsewhere': 'Migrée vers un autre jour',
  'week.deleteTask': 'Supprimer la tâche {name}',

  'backlog.title': 'Backlog',
  'backlog.add': '+ Ajouter',
  'backlog.placeholder': 'Nouvelle tâche…',
  'backlog.empty': 'Aucune tâche — clique sur "+ Ajouter"',
  'backlog.deleteItem': 'Supprimer {name}',

  'habits.habit': 'Habitude',
  'habits.week': 'Semaine',
  'habits.streak': 'Série',
  'habits.add': '+ Ajouter une habitude',
  'habits.deleteHabit': "Supprimer l'habitude {name}",

  'dash.weekProgress': 'Progression de la semaine',
  'dash.tasksPerDay': 'Tâches faites par jour',
  'dash.tasksDone': 'Tâches faites',
  'dash.quote': 'Citation du jour',
  'dash.habitStreaks': "Séries d'habitudes",
  'dash.mood': 'Humeur',

  'checkin.title': 'Check-in émotionnel',
  'slot.matin': 'Matin',
  'slot.apresmidi': 'Après-midi',
  'slot.soir': 'Soir',

  'stats.thisWeek': 'Cette semaine',
  'stats.vsLastWeek': 'vs semaine dernière',
  'stats.bestWeek': 'Meilleure semaine',
  'stats.tasksInAWeek': 'tâches en une semaine',
  'stats.allTime': 'Depuis le début',
  'stats.tasksDoneSub': 'tâches faites',
  'stats.longestStreak': 'Plus longue série',
  'stats.dayPerformance': 'Performance du jour — semaine en cours',
  'stats.habitRegularity': 'Régularité des habitudes',
  'stats.weekHistory': 'Historique par semaine',
  'stats.habitsAndMood': 'Habitudes et humeur',
  'stats.currentStreaks': 'Séries en cours',
  'stats.noHabits': "Aucune habitude suivie pour l'instant.",

  'chart.day': 'Jour :',
  'chart.avg7d': 'Moy. 7j :',
  'chart.pctOfDay': '% du jour',
  'chart.avg7dLegend': 'moyenne 7j',
  'chart.showingDone': 'Affiché : jours faits',
  'chart.showingNotDone': 'Affiché : jours NON faits',
  'chart.invert': '↕ Inverser',
  'chart.inverted': '↕ Inversé',
  'chart.invertedSuffix': '(inversé)',
  'chart.noDataHabit': 'Aucune donnée pour cette habitude.',
  'chart.noHabitData': "Aucune donnée d'habitude.",
  'chart.week': 'Semaine {n}',
  'chart.activeDays': 'jours actifs',

  'cmp.howToRead': "Ton humeur, moyennée sur 7 jours, moins ta propre moyenne de {v}. Au-dessus du trait, une période meilleure que ta normale ; en dessous, moins bonne — plus c'est loin du trait, plus l'écart est grand.",
  'cmp.above': 'meilleur que ta normale',
  'cmp.below': 'moins bon que ta normale',
  'cmp.baseline': 'ta moyenne · {v}',
  'cmp.habitsPane': 'habitudes faites, % du jour',
  'cmp.moodPane': 'humeur, 1–5',

  'level.none': 'Rien',
  'level.slow': 'Démarrage',
  'level.mid': 'En route',
  'level.fire': 'Ça chauffe',
  'level.beast': 'À fond',

  'mood.1': 'pas ouf',
  'mood.2': 'bof',
  'mood.3': 'normal',
  'mood.4': 'ok',
  'mood.5': 'super',

  'emotion.heureux': 'Heureux',
  'emotion.energise': 'Énergisé',
  'emotion.blase': 'Blasé',
  'emotion.bien': 'Bien',
  'emotion.embarrasse': 'Embarrassé',
  'emotion.malaaise': "Mal à l'aise",
  'emotion.tendu': 'Tendu',
  'emotion.en-colere': 'En colère',
  'emotion.apeure': 'Apeuré',
  'emotion.enjoleur': 'Enjôleur',
  'emotion.joueur': 'Joueur',
  'emotion.hebete': 'Hébété',
  'emotion.concentre': 'Concentré',
  'emotion.triste': 'Triste',
  'emotion.confiant': 'Confiant',
  'emotion.inspire': 'Inspiré',
};

/** Fills `{name}` placeholders. Unknown placeholders are left as-is on purpose:
 *  a visible `{foo}` in the UI is a louder bug report than a silent empty gap. */
export function interpolate(s: string, vars?: Record<string, string | number>): string {
  if (!vars) return s;
  return Object.entries(vars).reduce(
    (acc, [k, v]) => acc.replaceAll(`{${k}}`, String(v)),
    s,
  );
}
