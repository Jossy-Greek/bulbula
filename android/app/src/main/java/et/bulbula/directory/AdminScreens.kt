package et.bulbula.directory

import android.Manifest
import android.annotation.SuppressLint
import android.content.Intent
import android.content.pm.PackageManager
import android.location.LocationManager
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import androidx.core.location.LocationManagerCompat
import androidx.core.net.toUri
import kotlinx.coroutines.launch
import kotlinx.coroutines.suspendCancellableCoroutine
import java.util.Locale
import kotlin.coroutines.resume

/** Back arrow and a large title, as on Settings. */
@Composable
fun ScreenTitle(title: String, onBack: () -> Unit, actions: @Composable () -> Unit = {}) {
    Row(Modifier.fillMaxWidth().padding(4.dp)) {
        IconButton(onClick = onBack) { Icon(painterResource(R.drawable.ic_back), contentDescription = stringResource(R.string.back)) }
        Spacer(Modifier.weight(1f))
        actions()
    }
    Text(title, style = MaterialTheme.typography.headlineLarge, modifier = Modifier.padding(start = 20.dp, end = 20.dp, bottom = 20.dp))
}

@Composable
private fun Field(value: String, onChange: (String) -> Unit, label: String, keyboard: KeyboardType = KeyboardType.Text, isError: Boolean = false, placeholder: String? = null, password: Boolean = false) {
    val colors = MaterialTheme.colorScheme
    OutlinedTextField(
        value = value,
        onValueChange = onChange,
        label = { Text(label) },
        placeholder = placeholder?.let { { Text(it) } },
        singleLine = true,
        isError = isError,
        visualTransformation = if (password) PasswordVisualTransformation() else androidx.compose.ui.text.input.VisualTransformation.None,
        keyboardOptions = KeyboardOptions(keyboardType = keyboard, imeAction = ImeAction.Next),
        shape = RoundedCornerShape(14.dp),
        colors = OutlinedTextFieldDefaults.colors(
            focusedContainerColor = colors.surface,
            unfocusedContainerColor = colors.surface,
            unfocusedBorderColor = colors.outlineVariant,
        ),
        modifier = Modifier.fillMaxWidth(),
    )
}

@Composable
fun SignInScreen(lastEmail: String, onSignIn: suspend (String, String) -> Boolean, onBack: () -> Unit) {
    var email by rememberSaveable { mutableStateOf(lastEmail) }
    var password by remember { mutableStateOf("") }
    var busy by remember { mutableStateOf(false) }
    var failed by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    Column(Modifier.fillMaxSize().background(MaterialTheme.colorScheme.background).statusBarsPadding().imePadding().verticalScroll(rememberScrollState())) {
        ScreenTitle(stringResource(R.string.sign_in), onBack)
        Column(Modifier.padding(horizontal = 16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Field(email, { email = it; failed = false }, stringResource(R.string.email), KeyboardType.Email)
            Field(password, { password = it; failed = false }, stringResource(R.string.password), KeyboardType.Password, isError = failed, password = true)
            if (failed) Text(stringResource(R.string.sign_in_failed), color = closedColor, style = MaterialTheme.typography.bodyMedium)
            Spacer(Modifier.height(4.dp))
            Button(
                onClick = {
                    busy = true
                    scope.launch {
                        failed = !onSignIn(email, password)
                        busy = false
                    }
                },
                enabled = !busy && email.isNotBlank() && password.isNotEmpty(),
                modifier = Modifier.fillMaxWidth().height(52.dp),
                shape = RoundedCornerShape(14.dp),
            ) { if (busy) CircularProgressIndicator(Modifier.size(20.dp), strokeWidth = 2.dp, color = MaterialTheme.colorScheme.onPrimary) else Text(stringResource(R.string.sign_in)) }
        }
    }
}

/** Pending submissions and leads, and published places not yet confirmed. */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ReviewScreen(
    state: AdminState,
    onRefresh: () -> Unit,
    onOpen: (AdminPlace) -> Unit,
    onModerate: suspend (PendingReview, Boolean) -> Boolean,
    onBack: () -> Unit,
) {
    // Start on the first tab with something in it.
    var tab by rememberSaveable { mutableIntStateOf(listOf(state.pending, state.unconfirmed, state.reviews).indexOfFirst { it.isNotEmpty() }.coerceAtLeast(0)) }
    val places = when (tab) {
        0 -> state.pending
        1 -> state.unconfirmed
        else -> emptyList()
    }

    PullToRefreshBox(isRefreshing = state.loading, onRefresh = onRefresh, modifier = Modifier.fillMaxSize().background(MaterialTheme.colorScheme.background)) {
        Column(Modifier.fillMaxSize().statusBarsPadding().verticalScroll(rememberScrollState()).navigationBarsPadding().padding(bottom = 32.dp)) {
            ScreenTitle(stringResource(R.string.review), onBack)
            Column(Modifier.padding(horizontal = 16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
                PillSwitch(
                    listOf(
                        0 to "${stringResource(R.string.pending)}  ${state.pending.size}",
                        1 to "${stringResource(R.string.unconfirmed_tab)}  ${state.unconfirmed.size}",
                        2 to "${stringResource(R.string.reviews)}  ${state.reviews.size}",
                    ),
                    tab,
                ) { tab = it }
                when {
                    tab == 2 && state.reviews.isEmpty() && !state.loading -> Muted(stringResource(R.string.nothing_to_review), Modifier.padding(horizontal = 4.dp))
                    tab == 2 -> state.reviews.forEach { ReviewCard(it, onModerate) }
                    places.isEmpty() && state.failed -> Muted(stringResource(R.string.offline), Modifier.padding(horizontal = 4.dp))
                    places.isEmpty() && !state.loading -> Muted(stringResource(R.string.nothing_to_review), Modifier.padding(horizontal = 4.dp))
                    else -> Card {
                        places.forEachIndexed { i, p ->
                            Row(
                                Modifier.fillMaxWidth().clickable { onOpen(p) }.padding(horizontal = 14.dp, vertical = 12.dp),
                                verticalAlignment = Alignment.CenterVertically,
                            ) {
                                p.category?.let { IconTile(it) }
                                Spacer(Modifier.width(14.dp))
                                Column(Modifier.weight(1f)) {
                                    Text(p.name, style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.SemiBold, maxLines = 2, overflow = TextOverflow.Ellipsis)
                                    // Who sent it, or how to reach it: what the reviewer acts on.
                                    val line = p.submitter?.name?.takeIf { it.isNotBlank() } ?: listOfNotNull(p.landmark, p.phone).joinToString(" · ").ifEmpty { p.category?.name }
                                    if (line != null) Muted(line, small = true)
                                }
                                Icon(painterResource(R.drawable.ic_chevron_right), contentDescription = null, tint = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.size(18.dp))
                            }
                            if (i < places.lastIndex) androidx.compose.material3.HorizontalDivider(Modifier.padding(start = 68.dp), color = MaterialTheme.colorScheme.outlineVariant)
                        }
                    }
                }
            }
        }
    }
}

/** A visitor's review: stars, who, where, what they wrote; publish or reject. */
@Composable
private fun ReviewCard(review: PendingReview, onModerate: suspend (PendingReview, Boolean) -> Boolean) {
    val scope = rememberCoroutineScope()
    var busy by remember { mutableStateOf(false) }
    var failed by remember { mutableStateOf(false) }
    fun decide(publish: Boolean) {
        busy = true
        scope.launch {
            failed = !onModerate(review, publish)
            busy = false
        }
    }
    Card {
        Column(Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("★".repeat(review.rating) + "☆".repeat(5 - review.rating), color = MaterialTheme.colorScheme.secondary, style = MaterialTheme.typography.titleMedium)
                Spacer(Modifier.width(10.dp))
                Text(review.author, style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.SemiBold)
            }
            review.business?.let { Muted(it.name, small = true) }
            review.text?.takeIf { it.isNotBlank() }?.let {
                Spacer(Modifier.height(8.dp))
                Text(it, style = MaterialTheme.typography.bodyLarge)
            }
            if (failed) Text(stringResource(R.string.not_saved), color = closedColor, style = MaterialTheme.typography.bodyMedium, modifier = Modifier.padding(top = 8.dp))
            Spacer(Modifier.height(12.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                Button(onClick = { decide(true) }, enabled = !busy, shape = RoundedCornerShape(12.dp), modifier = Modifier.weight(1f)) { Text(stringResource(R.string.publish)) }
                OutlinedButton(onClick = { decide(false) }, enabled = !busy, shape = RoundedCornerShape(12.dp), modifier = Modifier.weight(1f)) { Text(stringResource(R.string.reject), color = closedColor) }
            }
        }
    }
}

/** Fix what's wrong on the spot (phones, hours, where it is), then publish, confirm or save. */
@Composable
fun EditScreen(id: Int, preloaded: AdminPlace?, vm: AdminViewModel, onDone: () -> Unit) {
    var place by remember { mutableStateOf(preloaded) }
    LaunchedEffect(id) { if (place == null) place = vm.place(id) ?: run { onDone(); return@LaunchedEffect } }
    val p = place
    if (p == null) {
        Box(Modifier.fillMaxSize().background(MaterialTheme.colorScheme.background), Alignment.Center) { CircularProgressIndicator() }
        return
    }

    val context = LocalContext.current
    val colors = MaterialTheme.colorScheme
    val scope = rememberCoroutineScope()
    var phone by rememberSaveable { mutableStateOf(p.phone.orEmpty()) }
    var phone2 by rememberSaveable { mutableStateOf(p.phone2.orEmpty()) }
    var hours by rememberSaveable { mutableStateOf(p.hours.orEmpty()) }
    var landmark by rememberSaveable { mutableStateOf(p.landmark.orEmpty()) }
    var pin by rememberSaveable { mutableStateOf<Pair<Double, Double>?>(null) }
    var locating by remember { mutableStateOf(false) }
    var busy by remember { mutableStateOf(false) }
    var failed by remember { mutableStateOf(false) }
    var rejecting by remember { mutableStateOf(false) }
    val hoursOk = hours.isBlank() || Hours.parse(hours) != null

    fun locate() {
        locating = true
        scope.launch {
            pin = currentLocation(context)
            locating = false
        }
    }
    val permission = rememberLauncherForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { granted -> if (granted.values.any { it }) locate() }

    fun submit(decision: Boolean?, confirm: Boolean) {
        busy = true
        failed = false
        scope.launch {
            val ok = vm.save(p, placeFields(phone, phone2, hours, landmark, pin, confirm), decision)
            busy = false
            if (ok) onDone() else failed = true
        }
    }

    Column(Modifier.fillMaxSize().background(colors.background).statusBarsPadding().imePadding().verticalScroll(rememberScrollState()).navigationBarsPadding().padding(bottom = 32.dp)) {
        Row(Modifier.fillMaxWidth().padding(4.dp)) {
            IconButton(onClick = onDone) { Icon(painterResource(R.drawable.ic_back), contentDescription = stringResource(R.string.back)) }
        }
        Row(Modifier.padding(horizontal = 20.dp), verticalAlignment = Alignment.CenterVertically) {
            p.category?.let { IconTile(it, size = 48.dp) }
            Spacer(Modifier.width(14.dp))
            Column {
                Text(p.name, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                p.category?.let { Muted(it.name, small = true) }
            }
        }
        Spacer(Modifier.height(20.dp))

        Column(Modifier.padding(horizontal = 16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            // Who sent it: call them to check before publishing.
            p.submitter?.takeIf { !it.name.isNullOrBlank() }?.let { s ->
                Card {
                    CardRow(
                        icon = R.drawable.ic_user,
                        last = true,
                        onClick = s.phone?.let { ph -> { context.startActivity(Intent(Intent.ACTION_DIAL, telUri(ph).toUri())) } },
                    ) {
                        Text(listOfNotNull(s.name, s.phone).joinToString(" · "), style = MaterialTheme.typography.bodyLarge, color = if (s.phone != null) colors.primary else colors.onSurface)
                    }
                }
            }
            Field(phone, { phone = it }, stringResource(R.string.phone), KeyboardType.Phone)
            Field(phone2, { phone2 = it }, stringResource(R.string.phone2), KeyboardType.Phone)
            Field(hours, { hours = it }, stringResource(R.string.hours), isError = !hoursOk, placeholder = stringResource(R.string.hours_example))
            Field(landmark, { landmark = it }, stringResource(R.string.landmark))

            val shown = pin ?: p.lat?.let { lat -> p.lng?.let { lat to it } }
            OutlinedButton(
                onClick = {
                    val granted = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED ||
                        ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED
                    if (granted) locate() else permission.launch(arrayOf(Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION))
                },
                enabled = !locating,
                shape = RoundedCornerShape(14.dp),
                modifier = Modifier.fillMaxWidth().height(52.dp),
            ) {
                Icon(painterResource(R.drawable.ic_locate), contentDescription = null, modifier = Modifier.size(18.dp), tint = if (pin != null) openColor else colors.primary)
                Spacer(Modifier.width(10.dp))
                Text(
                    if (shown != null) String.format(Locale.ENGLISH, "%.5f, %.5f", shown.first, shown.second) else stringResource(R.string.use_location),
                    color = if (pin != null) openColor else colors.primary,
                )
            }

            if (failed) Text(stringResource(R.string.not_saved), color = closedColor, style = MaterialTheme.typography.bodyMedium)
            Spacer(Modifier.height(4.dp))

            val big = Modifier.fillMaxWidth().height(52.dp)
            val shape = RoundedCornerShape(14.dp)
            val ready = !busy && hoursOk
            when {
                p.pending -> {
                    Button(onClick = { submit(true, confirm = false) }, enabled = ready, modifier = big, shape = shape) { Text(stringResource(R.string.publish)) }
                    TextButton(onClick = { rejecting = true }, enabled = !busy, modifier = big, shape = shape) { Text(stringResource(R.string.reject), color = closedColor) }
                }
                p.unconfirmed -> {
                    Button(onClick = { submit(null, confirm = true) }, enabled = ready, modifier = big, shape = shape) { Text(stringResource(R.string.confirm)) }
                    OutlinedButton(onClick = { submit(null, confirm = false) }, enabled = ready, modifier = big, shape = shape) { Text(stringResource(R.string.save)) }
                }
                else -> Button(onClick = { submit(null, confirm = false) }, enabled = ready, modifier = big, shape = shape) { Text(stringResource(R.string.save)) }
            }
        }
    }

    if (rejecting) {
        AlertDialog(
            onDismissRequest = { rejecting = false },
            title = { Text(stringResource(R.string.reject_place, p.name)) },
            confirmButton = {
                TextButton(onClick = { rejecting = false; submit(false, confirm = false) }) { Text(stringResource(R.string.reject), color = closedColor) }
            },
            dismissButton = { TextButton(onClick = { rejecting = false }) { Text(stringResource(R.string.cancel)) } },
        )
    }
}

/** One fresh fix from the phone, or null. Callers ask for the permission first. */
@SuppressLint("MissingPermission")
suspend fun currentLocation(context: android.content.Context): Pair<Double, Double>? {
    val lm = context.getSystemService(LocationManager::class.java) ?: return null
    val provider = listOf(LocationManager.GPS_PROVIDER, LocationManager.NETWORK_PROVIDER).firstOrNull { lm.isProviderEnabled(it) } ?: return null
    return suspendCancellableCoroutine { cont ->
        val cancel = androidx.core.os.CancellationSignal()
        cont.invokeOnCancellation { cancel.cancel() }
        LocationManagerCompat.getCurrentLocation(lm, provider, cancel, ContextCompat.getMainExecutor(context), androidx.core.util.Consumer<android.location.Location?> { loc ->
            cont.resume(loc?.let { it.latitude to it.longitude })
        })
    }
}
