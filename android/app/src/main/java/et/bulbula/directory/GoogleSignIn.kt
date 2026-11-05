package et.bulbula.directory

import android.content.Context
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.credentials.CredentialManager
import androidx.credentials.CustomCredential
import androidx.credentials.GetCredentialRequest
import androidx.credentials.exceptions.GetCredentialCancellationException
import androidx.credentials.exceptions.GetCredentialException
import androidx.credentials.exceptions.NoCredentialException
import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential

/** A Google sign-in: the token the site checks, and the account's email to show on this phone. */
class GoogleSignIn(val idToken: String, val email: String)

/** What came of asking: signed in, cancelled by the person, or an error ("no_account", "failed"). */
class GoogleResult(val signIn: GoogleSignIn?, val error: String?)

/**
 * Shows Google's account picker (Credential Manager, "Sign in with Google") and returns the
 * ID token for the site, which checks it against [BuildConfig.GOOGLE_CLIENT_ID].
 * [context] must be an Activity. Needs Google Play services (not on some Huawei phones),
 * so the recovery code stays as the other way.
 */
suspend fun signInWithGoogle(context: Context): GoogleResult {
    val option = GetSignInWithGoogleOption.Builder(BuildConfig.GOOGLE_CLIENT_ID).build()
    val request = GetCredentialRequest.Builder().addCredentialOption(option).build()
    return try {
        val credential = CredentialManager.create(context).getCredential(context, request).credential
        if (credential is CustomCredential && credential.type == GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL) {
            val google = GoogleIdTokenCredential.createFrom(credential.data)
            GoogleResult(GoogleSignIn(google.idToken, google.id), null)
        } else {
            GoogleResult(null, "failed")
        }
    } catch (_: GetCredentialCancellationException) {
        GoogleResult(null, null)
    } catch (_: NoCredentialException) {
        GoogleResult(null, "no_account")
    } catch (_: GetCredentialException) {
        GoogleResult(null, "failed")
    } catch (_: Exception) {
        GoogleResult(null, "failed")
    }
}

/** "Continue with Google", in Google's style: white (or dark) with the coloured G. */
@Composable
fun GoogleButton(onClick: () -> Unit, modifier: Modifier = Modifier, enabled: Boolean = true) {
    val colors = MaterialTheme.colorScheme
    val interaction = remember { MutableInteractionSource() }
    Row(
        modifier
            .fillMaxWidth()
            .height(54.dp)
            .pressScale(interaction, 0.97f)
            .clip(RoundedCornerShape(16.dp))
            .background(colors.surface)
            .border(1.5.dp, colors.outlineVariant, RoundedCornerShape(16.dp))
            .clickable(interaction, indication = null, enabled = enabled, onClick = onClick),
        horizontalArrangement = Arrangement.Center,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Image(painterResource(R.drawable.ic_google), contentDescription = null, modifier = Modifier.size(20.dp))
        Spacer(Modifier.width(12.dp))
        Text(stringResource(R.string.continue_google), fontWeight = FontWeight.Bold, fontSize = 16.sp, color = colors.onSurface)
    }
}

fun googleError(code: String?): Int = when (code) {
    "no_account" -> R.string.google_no_account
    "google" -> R.string.google_failed
    "none" -> R.string.google_none
    "limit" -> R.string.backup_limit
    "offline" -> R.string.offline
    else -> R.string.google_failed
}
