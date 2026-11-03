package et.bulbula.directory

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyListState
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp

/** Search, category, list. The title is the only heading; everything else is the places. */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DirectoryScreen(
    state: DirectoryState,
    now: Pair<Int, Int>,
    query: String,
    onQuery: (String) -> Unit,
    category: String?,
    onCategory: (String?) -> Unit,
    listState: LazyListState,
    chipState: LazyListState,
    onRefresh: () -> Unit,
    onOpen: (Place) -> Unit,
) {
    val directory = state.directory
    val places = remember(directory, query, category) { directory?.listings.orEmpty().matching(query, category) }

    Column(Modifier.fillMaxSize().statusBarsPadding()) {
        Text(
            stringResource(R.string.app_name),
            style = MaterialTheme.typography.headlineLarge,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(start = 20.dp, end = 20.dp, top = 16.dp, bottom = 12.dp),
        )
        SearchField(query, onQuery)
        if (directory != null) {
            Categories(directory.categories, category, onCategory, chipState)
        }
        PullToRefreshBox(isRefreshing = state.refreshing && directory != null, onRefresh = onRefresh, modifier = Modifier.fillMaxSize()) {
            when {
                directory == null && state.failed -> Offline(onRefresh)
                directory == null -> Box(Modifier.fillMaxSize(), Alignment.Center) { CircularProgressIndicator() }
                places.isEmpty() -> Muted(stringResource(R.string.none), Modifier.fillMaxWidth().padding(20.dp))
                else -> LazyColumn(state = listState, contentPadding = PaddingValues(bottom = 24.dp), modifier = Modifier.fillMaxSize().navigationBarsPadding()) {
                    items(places, key = { it.slug }) { place ->
                        PlaceRow(place, showCategory = category == null, now = now, onClick = { onOpen(place) })
                        HorizontalDivider(Modifier.padding(start = 20.dp), color = MaterialTheme.colorScheme.outlineVariant)
                    }
                }
            }
        }
    }
}

/** Name first, then category and landmark; a name that starts with the query ranks first. */
fun List<Place>.matching(query: String, category: String?): List<Place> {
    val q = query.trim().lowercase()
    return filter { p ->
        (category == null || p.category.slug == category) &&
            (q.isEmpty() || listOfNotNull(p.name, p.category.name, p.landmark).any { it.lowercase().contains(q) })
    }.sortedBy { if (q.isNotEmpty() && it.name.lowercase().startsWith(q)) 0 else 1 }
}

@Composable
private fun SearchField(query: String, onQuery: (String) -> Unit) {
    val focus = LocalFocusManager.current
    val colors = MaterialTheme.colorScheme
    Row(
        Modifier.padding(horizontal = 16.dp).fillMaxWidth().height(44.dp).background(colors.surfaceVariant, RoundedCornerShape(12.dp)).padding(start = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(painterResource(R.drawable.ic_search), contentDescription = null, tint = colors.onSurfaceVariant, modifier = Modifier.size(20.dp))
        Box(Modifier.weight(1f).padding(horizontal = 8.dp)) {
            if (query.isEmpty()) Muted(stringResource(R.string.search))
            BasicTextField(
                value = query,
                onValueChange = onQuery,
                singleLine = true,
                textStyle = MaterialTheme.typography.bodyLarge.copy(color = colors.onBackground),
                cursorBrush = SolidColor(colors.primary),
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search),
                keyboardActions = KeyboardActions(onSearch = { focus.clearFocus() }),
                modifier = Modifier.fillMaxWidth(),
            )
        }
        if (query.isNotEmpty()) {
            IconButton(onClick = { onQuery("") }) {
                Icon(painterResource(R.drawable.ic_close), contentDescription = stringResource(R.string.clear), tint = colors.onSurfaceVariant, modifier = Modifier.size(18.dp))
            }
        }
    }
}

@Composable
private fun Categories(categories: List<Category>, selected: String?, onSelect: (String?) -> Unit, state: LazyListState) {
    // Keep the selected chip in view, e.g. after coming back from a place.
    LaunchedEffect(selected, categories) {
        val index = if (selected == null) 0 else categories.indexOfFirst { it.slug == selected } + 1
        val shown = state.layoutInfo.visibleItemsInfo.firstOrNull { it.index == index }
        val fits = shown != null && shown.offset >= 0 && shown.offset + shown.size <= state.layoutInfo.viewportEndOffset
        if (index >= 0 && !fits) state.animateScrollToItem(maxOf(0, index - 1))
    }
    LazyRow(state = state, contentPadding = PaddingValues(horizontal = 16.dp, vertical = 12.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        item { Chip(stringResource(R.string.all), selected == null) { onSelect(null) } }
        items(categories, key = { it.slug }) { c -> Chip(c.name, selected == c.slug) { onSelect(if (selected == c.slug) null else c.slug) } }
    }
}

@Composable
private fun Chip(label: String, selected: Boolean, onClick: () -> Unit) {
    val colors = MaterialTheme.colorScheme
    Text(
        label,
        style = MaterialTheme.typography.labelLarge,
        color = if (selected) colors.background else colors.onBackground,
        modifier = Modifier
            .background(if (selected) colors.onBackground else Color.Transparent, CircleShape)
            .border(1.dp, if (selected) colors.onBackground else colors.outlineVariant, CircleShape)
            .clickable(onClick = onClick)
            .padding(horizontal = 14.dp, vertical = 8.dp),
    )
}

@Composable
private fun PlaceRow(place: Place, showCategory: Boolean, now: Pair<Int, Int>, onClick: () -> Unit) {
    val status = openLine(place.hoursSpec, now, short = true)
    Column(Modifier.fillMaxWidth().clickable(onClick = onClick).padding(horizontal = 20.dp, vertical = 12.dp)) {
        Text(place.name, style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.Medium, maxLines = 2, overflow = TextOverflow.Ellipsis)
        val category = place.category.name.takeIf { showCategory }
        if (category != null || status != null) {
            Spacer(Modifier.height(2.dp))
            Text(
                buildAnnotatedString {
                    if (category != null) append(category)
                    if (category != null && status != null) append(" · ")
                    if (status != null) withStyle(SpanStyle(color = status.color)) { append(status.label) }
                },
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
        }
    }
}

@Composable
private fun Offline(onRetry: () -> Unit) {
    Column(Modifier.fillMaxSize().padding(20.dp), verticalArrangement = Arrangement.Center, horizontalAlignment = Alignment.CenterHorizontally) {
        Muted(stringResource(R.string.offline))
        Spacer(Modifier.height(12.dp))
        Button(onClick = onRetry) { Text(stringResource(R.string.retry)) }
    }
}

@Composable
fun Muted(text: String, modifier: Modifier = Modifier) =
    Text(text, style = MaterialTheme.typography.bodyLarge, color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = modifier)
