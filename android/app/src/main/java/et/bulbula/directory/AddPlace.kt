package et.bulbula.directory

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.spring
import androidx.compose.animation.expandVertically
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.scaleIn
import androidx.compose.animation.shrinkVertically
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CheckboxDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

/**
 * "Add a place": the website's add form, shortened for a phone. It goes to the same pending
 * queue; points come when it's sent, and the place shows after an admin checks it.
 */
@OptIn(ExperimentalLayoutApi::class, ExperimentalFoundationApi::class)
@Composable
fun AddPlaceScreen(categories: List<Category>, onBack: () -> Unit) {
    val progress = LocalProgress.current
    val colors = MaterialTheme.colorScheme
    val scope = rememberCoroutineScope()
    var name by rememberSaveable { mutableStateOf("") }
    var category by rememberSaveable { mutableStateOf<String?>(null) }
    var phone by rememberSaveable { mutableStateOf("") }
    var landmark by rememberSaveable { mutableStateOf("") }
    var hours by rememberSaveable { mutableStateOf("") }
    var about by rememberSaveable { mutableStateOf("") }
    var yourName by rememberSaveable { mutableStateOf(progress.name) }
    var yourPhone by rememberSaveable { mutableStateOf("") }
    var relationship by rememberSaveable { mutableStateOf(if (progress.why == Why.Owner) "owner" else "customer") }
    var consent by rememberSaveable { mutableStateOf(false) }
    var sending by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    var sent by rememberSaveable { mutableStateOf(false) }
    var pointsLater by rememberSaveable { mutableStateOf(false) }
    val ready = name.isNotBlank() && category != null && phone.isNotBlank() && yourName.isNotBlank() && yourPhone.isNotBlank() && consent

    fun submit() {
        sending = true
        error = null
        scope.launch {
            val result = sendPlace(NewPlace(name.trim(), category!!, phone.trim(), landmark.trim(), hours.trim(), about.trim(), yourName.trim(), yourPhone.trim(), relationship), progress.cloudCode)
            sending = false
            if (result == null) {
                sent = true
                pointsLater = !progress.addedPlace()
            } else {
                error = result
            }
        }
    }

    AnimatedContent(sent, transitionSpec = { (fadeIn() + scaleIn(initialScale = 0.92f)) togetherWith fadeOut() }, label = "add") { done ->
        if (done) {
            Sent(pointsLater, onDone = onBack, onAnother = {
                name = ""; category = null; phone = ""; landmark = ""; hours = ""; about = ""; consent = false; sent = false
            })
            return@AnimatedContent
        }
        Column(Modifier.fillMaxSize().background(colors.background).statusBarsPadding().navigationBarsPadding().imePadding()) {
            Column(Modifier.weight(1f).verticalScroll(rememberScrollState())) {
                ScreenTitle(stringResource(R.string.add_place), onBack)
                BulbieSays(stringResource(R.string.add_intro), Modifier.padding(horizontal = 16.dp), size = 70.dp)
                Spacer(Modifier.height(18.dp))

                Section(stringResource(R.string.section_place)) {
                    Input(name, { name = it }, stringResource(R.string.place_name), capitalize = true)
                    Text(stringResource(R.string.category), style = MaterialTheme.typography.labelLarge, color = colors.onSurfaceVariant, modifier = Modifier.padding(top = 4.dp))
                    FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        categories.forEach { c -> CategoryChip(c, c.slug == category) { category = c.slug } }
                    }
                    Input(phone, { phone = it }, stringResource(R.string.phone), keyboard = KeyboardType.Phone)
                    Input(landmark, { landmark = it }, stringResource(R.string.landmark), hint = stringResource(R.string.landmark_hint))
                    Input(hours, { hours = it }, stringResource(R.string.hours_optional), hint = stringResource(R.string.hours_hint))
                    Input(about, { about = it }, stringResource(R.string.about_optional), single = false)
                }
                Section(stringResource(R.string.section_you)) {
                    Input(yourName, { yourName = it }, stringResource(R.string.your_name), capitalize = true)
                    Input(yourPhone, { yourPhone = it }, stringResource(R.string.your_phone), keyboard = KeyboardType.Phone)
                    Text(stringResource(R.string.relationship), style = MaterialTheme.typography.labelLarge, color = colors.onSurfaceVariant, modifier = Modifier.padding(top = 4.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        listOf("owner" to R.string.owner, "manager" to R.string.manager, "customer" to R.string.customer).forEach { (value, label) ->
                            Pill(stringResource(label), relationship == value) { relationship = value }
                        }
                    }
                    Row(Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).clickable { consent = !consent }.padding(vertical = 4.dp), verticalAlignment = Alignment.CenterVertically) {
                        Checkbox(consent, { consent = it }, colors = CheckboxDefaults.colors(checkedColor = colors.primary))
                        Text(stringResource(R.string.consent), style = MaterialTheme.typography.bodyMedium)
                    }
                }
                AnimatedVisibility(error != null, enter = expandVertically() + fadeIn(), exit = shrinkVertically() + fadeOut()) {
                    Text(
                        stringResource(errorText(error)),
                        color = closedColor,
                        fontWeight = FontWeight.SemiBold,
                        modifier = Modifier.padding(horizontal = 20.dp, vertical = 4.dp),
                    )
                }
            }
            ChunkyButton(
                stringResource(if (sending) R.string.sending else R.string.send_for_review),
                ::submit,
                Modifier.fillMaxWidth().padding(16.dp),
                enabled = ready && !sending,
                color = Marigold,
                contentColor = Color(0xFF3A2600),
            )
        }
    }
}

fun errorText(code: String?): Int = when (code) {
    "rating" -> R.string.error_rating
    "name" -> R.string.error_name
    "links" -> R.string.error_links
    "already" -> R.string.error_already
    "required" -> R.string.error_required
    "contact" -> R.string.error_contact
    "consent" -> R.string.error_consent
    "offline" -> R.string.offline
    else -> R.string.error_failed
}

@Composable
private fun Section(title: String, content: @Composable () -> Unit) {
    Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.ExtraBold, modifier = Modifier.padding(start = 20.dp, bottom = 8.dp))
    Column(
        Modifier.padding(start = 16.dp, end = 16.dp, bottom = 18.dp).fillMaxWidth().clip(RoundedCornerShape(22.dp)).background(MaterialTheme.colorScheme.surface).padding(14.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) { content() }
}

@Composable
private fun Input(value: String, onChange: (String) -> Unit, label: String, hint: String? = null, keyboard: KeyboardType = KeyboardType.Text, capitalize: Boolean = false, single: Boolean = true) {
    val colors = MaterialTheme.colorScheme
    OutlinedTextField(
        value = value,
        onValueChange = { onChange(it.take(if (single) 120 else 1200)) },
        label = { Text(label) },
        placeholder = hint?.let { { Text(it) } },
        singleLine = single,
        minLines = if (single) 1 else 3,
        keyboardOptions = KeyboardOptions(
            keyboardType = keyboard,
            capitalization = if (capitalize) KeyboardCapitalization.Words else KeyboardCapitalization.Sentences,
            imeAction = if (single) ImeAction.Next else ImeAction.Default,
        ),
        shape = RoundedCornerShape(14.dp),
        colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = colors.primary, unfocusedBorderColor = colors.outlineVariant),
        modifier = Modifier.fillMaxWidth(),
    )
}

@Composable
private fun CategoryChip(category: Category, selected: Boolean, onClick: () -> Unit) {
    val colors = MaterialTheme.colorScheme
    val bg by animateColorAsState(if (selected) Teal else colors.surfaceVariant, label = "chip")
    val ink by animateColorAsState(if (selected) Color.White else colors.onSurface, label = "ink")
    val interaction = remember { MutableInteractionSource() }
    Row(
        Modifier.pressScale(interaction, 0.92f).clip(CircleShape).background(bg).clickable(interaction, indication = null, onClick = onClick).padding(start = 10.dp, end = 14.dp, top = 8.dp, bottom = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(painterResource(categoryIcon(category.icon)), contentDescription = null, tint = ink, modifier = Modifier.size(16.dp))
        Spacer(Modifier.width(6.dp))
        Text(category.name, color = ink, style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.SemiBold)
    }
}

@Composable
private fun Pill(label: String, selected: Boolean, onClick: () -> Unit) {
    val colors = MaterialTheme.colorScheme
    val bg by animateColorAsState(if (selected) Teal else colors.surfaceVariant, label = "pill")
    Text(
        label,
        color = if (selected) Color.White else colors.onSurface,
        style = MaterialTheme.typography.labelLarge,
        fontWeight = FontWeight.SemiBold,
        modifier = Modifier.clip(CircleShape).background(bg).clickable(onClick = onClick).padding(horizontal = 14.dp, vertical = 9.dp),
    )
}

@Composable
private fun Sent(pointsLater: Boolean, onDone: () -> Unit, onAnother: () -> Unit) {
    val pop = remember { Animatable(0.4f) }
    LaunchedEffect(Unit) {
        delay(100)
        pop.animateTo(1f, spring(dampingRatio = 0.4f, stiffness = 260f))
    }
    Column(
        Modifier.fillMaxSize().background(MaterialTheme.colorScheme.background).statusBarsPadding().navigationBarsPadding().padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Spacer(Modifier.weight(1f))
        Box(Modifier.scale(pop.value)) { Bulbie(size = 170.dp, happy = true) }
        Spacer(Modifier.height(16.dp))
        Text(stringResource(R.string.thank_you), style = MaterialTheme.typography.headlineLarge, textAlign = TextAlign.Center)
        Spacer(Modifier.height(8.dp))
        Text(stringResource(R.string.added_body), style = MaterialTheme.typography.bodyLarge, color = MaterialTheme.colorScheme.onSurfaceVariant, textAlign = TextAlign.Center)
        if (pointsLater) {
            Spacer(Modifier.height(10.dp))
            Text(stringResource(R.string.points_on_approval, Xp.ADDED), fontWeight = FontWeight.Bold, color = MarigoldDeep, textAlign = TextAlign.Center)
        }
        Spacer(Modifier.weight(1f))
        ChunkyButton(stringResource(R.string.done), onDone, Modifier.fillMaxWidth())
        Spacer(Modifier.height(10.dp))
        ChunkyButton(stringResource(R.string.add_another), onAnother, Modifier.fillMaxWidth(), outlined = true)
    }
}
