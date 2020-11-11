---
layout: post
title: Testing the new JetPack Compose
excerpt: I had some trouble testing JetPack Compose with ViewModels and mockito, so thought I'd make this simple blog post to help anyone else stuck with it.
tags:
  - JetPack Compose
  - mockito
  - Android
  - Kotlin
---

### __JetPack Compose__
In case you hadn't noticed there's yet another UI framework/toolkit, JetPack Compose! On the surface it has a lot more in common with Google's Flutter than the default Android View, it's written in code (by default Kotlin) and as such is able to generate previews a lot simpler than when you have the XML, you don't have to bind your ViewModels to the xml, you can just pass them into the functions!

### __Testing Android compose__
There are a few good resources out there for testing JetPack's new Compose functionality
 - [Android Compose Testing](https://developer.android.com/jetpack/compose/testing) 
 - [Gurupreet/ComposeCookBook](https://github.com/Gurupreet/ComposeCookBook)
 - [Testing Compose Navigation](https://developer.android.com/jetpack/compose/navigation#testing)
 
 but the scenario I was struggling to test was passing ViewModel into an upper composeable, I was mocking the ViewModel but I kept getting an error

### Some code
```
open class ImageListViewModel : ViewModel() {
	private val _isLoading = MutableStateFlow(false)
	val isLoading: StateFlow<Boolean>
		get() = _isLoading
}
```
and our composable looks quite simple for this
```
@Composable
fun ImageListScreen(viewModel: ImageListViewModel) {
	val isLoading by viewModel.isLoading.collectAsState()
	val imageItems by viewModel.imageItems.collectAsState()

	if (!isLoading && imageItems.isEmpty()) {
		Text(text = "No data available")
	} else {
		Text(text = "I have data")
  }
}
```
and then in our composable test we mock the viewmodel and alter the return of the property
```
@RunWith(MockitoJUnitRunner::class)
class ImageListTest {
	@get:Rule
	val rule = createAndroidComposeRule<MainActivity>()

	@Mock
	lateinit var viewModel: ImageListViewModel

	@Test
	fun imageListScreen() {
		val isLoading = MutableStateFlow(false)
		val imageItems = MutableStateFlow(listOf<ImageItem>())

		`when`(viewModel.isLoading).thenReturn(isLoading)
		`when`(viewModel.imageItems).thenReturn(imageItems)

		rule.setContent {
			MinderaTheme(darkTheme = false) {
				ImageListScreen(viewModel = viewModel)
			}
		}

		rule.onNodeWithText(text = "No data available").assertIsDisplayed()
	}
}
```
but as I say, this throws an error
```
org.mockito.exceptions.misusing.MissingMethodInvocationException: 
when() requires an argument which has to be 'a method call on a mock'.
```
This is when using `androidTestImplementation "org.mockito:mockito-android:3.5.10"`

But the catch is that the tests for compose run on a device, not on the jvm, so when we boot the emulator and try to run the test mockito can't work correctly as mockito uses CGLib or ByteBuddy, both of which generate .class files. When running on an Android device or emulator we need .dex files instead.

We do have a couple of options, there are other mocking frameworks out there, personally I like mockito, so we go with the other option, helping mockito to run on instrumented tests.

### dexmaker
We can change our dependencies a bit to make mockito work with instrumented tests
```
-- androidTestImplementation "org.mockito:mockito-android:3.5.10"
++ androidTestImplementation "org.mockito:mockito-core:3.5.10"
++ androidTestImplementation "com.linkedin.dexmaker:dexmaker-mockito-inline:2.28.0"
```
Dexmaker here works with mockito to generate .dex files, and since mockito inline can work with private/closed/final classes/functions we can remove the open from the ViewModel.

We then need to update our test file slightly, we want to use the default AndroidJUnit runner, and now we need to initialise mockito annotations manually
```
@RunWith(AndroidJUnit4::class)
class ImageListScreenKtTest {
	@get:Rule
	val rule = createAndroidComposeRule<MainActivity>()

	@get:Rule
	val initRule: MockitoRule = MockitoJUnit.rule()
	...
}
```
we can then run our test successfully!