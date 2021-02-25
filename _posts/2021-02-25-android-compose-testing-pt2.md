---
layout: post
title: Testing the new JetPack Compose Pt2
excerpt: A simple intro to testing basic Android interactions and updates using mockito in JetPack compose
tags:
  - JetPack Compose
  - mockito
  - Android
  - Kotlin
---
### Part 1
Look here for [Part 1](/android-compose-testing/) where I talk about testing loading data and UI updates from it

### __JetPack Compose__
In case you hadn't noticed there's yet another UI framework/toolkit, JetPack Compose! On the surface it has a lot more in common with Google's Flutter than the default Android View, it's written in code (by default Kotlin) and as such is able to generate previews a lot simpler than when you have the XML, you don't have to bind your ViewModels to the xml, you can just pass them into the functions!

### __Testing Android compose__
I want to test some basic UI interactions, we have a list in a ViewModel, clicking a fab add an item to the list and the UI updates to show the list, I won't go through setting up the activity etc, but essentially the activity grabs the viewmodel, call setContent with the theme>surface>initial composable. The initial composeable collects the players list as state and passes it and the addPlayer function to the PlayerList composable.

### Some code
```
class viewModel : ViewModel() {
    private val _players = MutableStateFlow(listOf<Player>())
    val players: StateFlow<List<Player>>
        get() = _players

    fun addPlayer(name: String) {
        _players.value = _players.value + Player(name)
    }
}
```
and our composable looks quite simple for this
```
@Composable
fun PlayerList(players: List<Player>, addPlayer: (String) -> Unit) {
    Scaffold(floatingActionButton = {
        FloatingActionButton(
            onClick = { addPlayer("Player #${players.size}") },
            content = { Icon(Icons.Filled.Add,    "Add new player") },
        )
    }) {
        ScrollableColumn(modifier = Modifier.fillMaxWidth()) {
            players.map { PlayerDisplay(player = it) }
        }
    }
}

@Composable
fun PlayerDisplay(player: Player) {
    Row() {
        Text(text = player.name, softWrap = false)
    }
}
```
and then in our composable test we mock the viewmodel and alter the return of the property
```
class PlayerScreensTest {
    @get:Rule
    val composeTestRule = createAndroidComposeRule<MainActivity>()

    @Test
    fun PlayerListTest() {
        composeTestRule.setContent {
            MyTheme {
                val players by composeTestRule.activity.viewModel.players.collectAsState()
                PlayerList(players, composeTestRule.activity.viewModel::addPlayer)
            }
        }

        composeTestRule.onNodeWithText("Player #0").assertDoesNotExist()
        composeTestRule.onNodeWithContentDescription("Add new player").performClick()
        composeTestRule.onNodeWithText("Player #0").assertIsDisplayed()
        composeTestRule.onNodeWithText("Player #1").assertDoesNotExist()
        composeTestRule.onNodeWithContentDescription("Add new player").performClick()
        composeTestRule.onNodeWithText("Player #0").assertIsDisplayed()
        composeTestRule.onNodeWithText("Player #1").assertIsDisplayed()
    }
}

```
this all looks good, but when running this throws an error
```
2 files found with path 'META-INF/AL2.0' from inputs
```

So now we need to update our apps build.gradle file
```
android {
    // Added to avoid this error -
    // Execution failed for task ':app:mergeDebugAndroidTestJavaResource'.
    // > A failure occurred while executing com.android.build.gradle.internal.tasks.MergeJavaResWorkAction
    // > 2 files found with path 'META-INF/AL2.0' from inputs:
    packagingOptions {
        exclude 'META-INF/AL2.0'
        exclude 'META-INF/LGPL2.1'
    }
}
```
we can then run our tests successfully!