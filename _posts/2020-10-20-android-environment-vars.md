---
layout: post
title: Securely inject API keys into your Android app during the build process
excerpt: So you want to inject API keys in a reasonably secure way during the build process? Here's one simple way at least.
tags:
  - Gradle
  - Android
  - Kotlin
  - Environment Variables
  - buildConfigField
  - BuildConfig
---

A bit of preamble, my gradle files are in kotlin, so my example code is similarly in kotlin rather than groovy

## __Pre-post Security Rant__
When trying to figure out how to add api keys etc into an Android application I came across a lot of posts that used this as an example:
```
getByName("release") {
  buildConfigField("String", "SECURE_API_KEY", "\"SOMETHINGTHATSHOULDBESECUREPROD\"")
}
getByName("staging") {
  buildConfigField("String", "SECURE_API_KEY", "\"SOMETHINGTHATSHOULDBESECURESTAGE\"")
}
getByName("debug") {
  buildConfigField("String", "SECURE_API_KEY", "\"SOMETHINGTHATSHOULDBESECUREDEV\"")
}
```
Coming from a web dev fe/be background this makes me shake, you should __never__ have these keys in your repositories, __always__ inject them during build time. OK? OK.

### __Injecting api keys from environment variables__
This actually took me a while to figure out, especially since I didn't want to have to deal with environment variables when doing local development, it comes down to a few simple lines. During most builds we want to get it from the environment so we can simply do:
```
android {
	compileSdkVersion(TARGET_SDK_VERSION)

	defaultConfig {
		minSdkVersion(MIN_SDK_VERSION)
		targetSdkVersion(TARGET_SDK_VERSION)

		testInstrumentationRunner("androidx.test.runner.AndroidJUnitRunner")
		consumerProguardFiles("consumer-rules.pro")
		buildConfigField("String", "SECURE_API_KEY", "\"$System.getenv("SECURE_API_KEY")\"" ?: "\"\"")
	}
}
```
Then during build time these `buildConfigField` are built into a java class with static final's in, this file also contains a few other things, here's an example of what it'll look like:
```
package co.g403.android.apikeyblog;

public final class BuildConfig {
  public static final boolean DEBUG = Boolean.parseBoolean("false");
  public static final String APPLICATION_ID = "co.g403.android.apikeyblog";
  public static final String BUILD_TYPE = "release";
  public static final String SECURE_API_KEY = "SOMETHINGTHATSHOULDBESECUREPROD";
}
```

However for dev we want to do something slightly different. We don't really want to mess around with environment variables. 

### __gradle.properties__
We can create a global gradle friendly file which can be read during build time too, if we create and save `nano ~/.gradle/gradle.properties` this will then also appear in our android projects and obviously wont be checked into version control, this will allow us to have different keys that a dev can use, and can be edited if we need to build different types without fear of accidentally checking the key into version control.
```
myApiKey=SOMETHINGTHATSHOULDBESECUREDEV
```
we can then read this in our build.gradle(.kts)
```
buildTypes {
  getByName("debug") {
    val myApiKey: String by project
    buildConfigField("SECURE_API_KEY", myApiKey)
  }
}
```
and then when built our BuildConfig.java is updated
```
package co.g403.android.apikeyblog;

public final class BuildConfig {
  public static final boolean DEBUG = Boolean.parseBoolean("true");
  public static final String APPLICATION_ID = "co.g403.android.apikeyblog";
  public static final String BUILD_TYPE = "debug";
  // Field from build type: debug
  public static final String SECURE_API_KEY = "SOMETHINGTHATSHOULDBESECUREDEV";
}
```

and that's it! You now securely have API keys being injected during builds, with one that can easily be changed during development