package et.bulbula.directory

import android.content.Context
import android.widget.Toast
import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.ui.Alignment
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch
import org.json.JSONObject

/** What came of "Sign in with Google". */
sealed interface GoogleOutcome {
    data object Cancelled : GoogleOutcome
    class Failed(val error: String) : GoogleOutcome
    /** Signed in; this phone's progress is now saved to the account. */
    class SignedIn(val key: String, val email: String) : GoogleOutcome
    /** The account already has saved progress: use it only if the person agrees. */
    class Saved(val key: String, val email: String, val name: String, val saved: JSONObject?) : GoogleOutcome
}

/**
 * Signs in with Google and asks the site for the progress saved to that account
 * (app/m/player). [onlyExisting]: don't start saving a new one (from the welcome screen).
 */
suspend fun signIn(context: Context, cloud: Cloud, progress: Progress, onlyExisting: Boolean): GoogleOutcome {
    val result = signInWithGoogle(context)
    val signIn = result.signIn ?: return result.error?.let { GoogleOutcome.Failed(it) } ?: GoogleOutcome.Cancelled
    val answer = cloud.google(signIn.idToken, progress.name, progress.export(), progress.cloudCode, onlyExisting)
    val reply = answer.reply ?: return GoogleOutcome.Failed(answer.error ?: "failed")
    val key = reply.optString("code").takeIf { it.isNotEmpty() } ?: return GoogleOutcome.Failed("failed")
    return if (reply.optBoolean("existing")) GoogleOutcome.Saved(key, signIn.email, reply.optString("name"), reply.optJSONObject("progress"))
    else GoogleOutcome.SignedIn(key, signIn.email)
}

/** "You already have progress on this account (level, XP). Use it here?" */
@Composable
fun SavedProgressDialog(found: GoogleOutcome.Saved, onUse: () -> Unit, onCancel: () -> Unit) {
    val xp = found.saved?.optInt("xp", 0) ?: 0
    val level = levelFor(xp)
    AlertDialog(
        onDismissRequest = onCancel,
        title = { Text(stringResource(R.string.google_existing_title)) },
        text = { Text(stringResource(R.string.google_existing_body, found.email, stringResource(R.string.level_n_title, level.number, stringResource(level.title)), xp)) },
        confirmButton = { TextButton(onClick = onUse) { Text(stringResource(R.string.google_use_backup)) } },
        dismissButton = { TextButton(onClick = onCancel) { Text(stringResource(R.string.cancel)) } },
    )
}

/** Profile: signed in (email, sign out) or the "Sign in with Google" button. */
@Composable
fun AccountCard(cloud: Cloud, modifier: Modifier = Modifier) {
    val progress = LocalProgress.current
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var busy by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    var found by remember { mutableStateOf<GoogleOutcome.Saved?>(null) }
    var signingOut by remember { mutableStateOf(false) }
    val welcome = stringResource(R.string.welcome_back)

    if (progress.cloud) {
        Card(modifier) {
            CardRow(icon = R.drawable.ic_user, iconTint = openColor) {
                Text(stringResource(R.string.signed_in), style = MaterialTheme.typography.bodyLarge)
                Muted(progress.google?.ifEmpty { null } ?: stringResource(R.string.google_account), small = true)
            }
            CardRow(icon = R.drawable.ic_sign_out, last = true, onClick = { signingOut = true }) {
                Text(stringResource(R.string.sign_out), style = MaterialTheme.typography.bodyLarge)
            }
        }
    } else {
        Column(modifier) {
            GoogleButton(enabled = !busy, onClick = {
                busy = true
                error = null
                scope.launch {
                    when (val outcome = signIn(context, cloud, progress, onlyExisting = false)) {
                        is GoogleOutcome.SignedIn -> progress.signedIn(outcome.key, outcome.email)
                        is GoogleOutcome.Saved -> found = outcome
                        is GoogleOutcome.Failed -> error = outcome.error
                        GoogleOutcome.Cancelled -> Unit
                    }
                    busy = false
                }
            })
            Text(
                stringResource(error?.let { googleError(it) } ?: R.string.sign_in_why),
                style = MaterialTheme.typography.bodyMedium,
                color = if (error != null) closedColor else MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.fillMaxWidth().padding(horizontal = 4.dp, vertical = 8.dp),
            )
        }
    }

    found?.let { saved ->
        SavedProgressDialog(saved, onUse = {
            progress.useSaved(saved)
            found = null
            Toast.makeText(context, welcome, Toast.LENGTH_SHORT).show()
        }, onCancel = { found = null })
    }
    if (signingOut) {
        SignOutSheet(
            email = progress.google?.ifEmpty { null },
            onSignOut = { progress.signOut(); signingOut = false },
            onDelete = {
                val key = progress.cloudCode
                scope.launch {
                    if (key != null) cloud.delete(key)
                    progress.signOut()
                    signingOut = false
                }
            },
            onDismiss = { signingOut = false },
        )
    }
}

/**
 * Signing out, as a sheet in the app's style: Bulbie, what happens, one big button. Deleting
 * the saved copy is a small link with its own confirmation, so it never happens by accident.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun SignOutSheet(email: String?, onSignOut: () -> Unit, onDelete: () -> Unit, onDismiss: () -> Unit) {
    val colors = MaterialTheme.colorScheme
    var deleting by remember { mutableStateOf(false) }
    ModalBottomSheet(onDismissRequest = onDismiss, sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true), containerColor = colors.background) {
        AnimatedContent(
            targetState = deleting,
            transitionSpec = { (fadeIn() + slideInHorizontally { if (targetState) it / 3 else -it / 3 }) togetherWith fadeOut() },
            label = "sign-out",
        ) { confirmDelete ->
            Column(
                Modifier.fillMaxWidth().navigationBarsPadding().padding(start = 24.dp, end = 24.dp, bottom = 20.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Bulbie(size = 88.dp)
                Spacer(Modifier.height(12.dp))
                Text(
                    stringResource(if (confirmDelete) R.string.delete_q else R.string.sign_out_q),
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.ExtraBold,
                    textAlign = TextAlign.Center,
                )
                Spacer(Modifier.height(8.dp))
                Text(
                    when {
                        confirmDelete -> stringResource(R.string.delete_body)
                        email != null -> stringResource(R.string.sign_out_body_email, email)
                        else -> stringResource(R.string.sign_out_body)
                    },
                    style = MaterialTheme.typography.bodyLarge,
                    color = colors.onSurfaceVariant,
                    textAlign = TextAlign.Center,
                )
                Spacer(Modifier.height(24.dp))
                if (confirmDelete) {
                    ChunkyButton(stringResource(R.string.delete_confirm), onDelete, Modifier.fillMaxWidth(), color = closedColor)
                    TextButton(onClick = { deleting = false }, modifier = Modifier.fillMaxWidth().padding(top = 4.dp)) {
                        Text(stringResource(R.string.back), fontWeight = FontWeight.Bold, color = colors.onSurfaceVariant)
                    }
                } else {
                    ChunkyButton(stringResource(R.string.sign_out), onSignOut, Modifier.fillMaxWidth(), icon = R.drawable.ic_sign_out)
                    TextButton(onClick = onDismiss, modifier = Modifier.fillMaxWidth().padding(top = 4.dp)) {
                        Text(stringResource(R.string.stay_signed_in), fontWeight = FontWeight.Bold, color = colors.onSurfaceVariant)
                    }
                    Spacer(Modifier.height(6.dp))
                    Text(
                        stringResource(R.string.sign_out_delete),
                        style = MaterialTheme.typography.labelLarge,
                        color = closedColor,
                        modifier = Modifier.clip(CircleShape).clickable { deleting = true }.padding(horizontal = 12.dp, vertical = 8.dp),
                    )
                }
            }
        }
    }
}

/** Brings the account's saved progress onto this phone, replacing what's here. */
fun Progress.useSaved(found: GoogleOutcome.Saved) {
    restore(found.key, found.name, found.saved)
    linkedGoogle(found.email)
}
