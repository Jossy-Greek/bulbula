package et.bulbula.directory

import android.app.Activity
import android.app.LocaleManager
import android.content.Context
import android.content.res.Configuration
import android.os.Build
import android.os.LocaleList
import androidx.core.content.edit
import java.util.Locale

enum class Appearance { System, Light, Dark }

/** The site's languages; [System] follows the phone. */
enum class Language(val tag: String?) { System(null), English("en"), Amharic("am") }

/**
 * The two settings. Language uses Android's own per-app language on 13+ (also changeable in the
 * phone's settings); older phones keep it here and the activity applies it ([wrap]).
 */
class Settings(context: Context) {
    private val prefs = context.applicationContext.getSharedPreferences("settings", Context.MODE_PRIVATE)
    private val localeManager = if (Build.VERSION.SDK_INT >= 33) context.getSystemService(LocaleManager::class.java) else null

    var appearance: Appearance
        get() = prefs.getString("appearance", null)?.let { runCatching { Appearance.valueOf(it) }.getOrNull() } ?: Appearance.System
        set(value) = prefs.edit { putString("appearance", value.name) }

    val language: Language
        get() {
            val tag = if (Build.VERSION.SDK_INT >= 33) localeManager!!.applicationLocales.get(0)?.language else prefs.getString("language", null)
            return Language.entries.firstOrNull { it.tag != null && it.tag == tag } ?: Language.System
        }

    fun setLanguage(activity: Activity, value: Language) {
        if (Build.VERSION.SDK_INT >= 33) {
            // Android restarts the activity in the new language.
            localeManager!!.applicationLocales = value.tag?.let { LocaleList.forLanguageTags(it) } ?: LocaleList.getEmptyLocaleList()
        } else {
            prefs.edit(commit = true) { putString("language", value.tag) }
            activity.recreate()
        }
    }

    /** Before Android 13: the activity's context in the chosen language. */
    fun wrap(base: Context): Context {
        val tag = if (Build.VERSION.SDK_INT >= 33) null else prefs.getString("language", null)
        if (tag == null) return base
        val locale = Locale.forLanguageTag(tag).also { Locale.setDefault(it) }
        return base.createConfigurationContext(Configuration(base.resources.configuration).apply { setLocale(locale) })
    }
}
