---
layout: post
title: Testing a Retrofit/RxJava Android library using Mockito
excerpt: There's lots of blog posts out there with great examples on how to do certain things in Kotlin/Android. What there seems to be a lack of, in general, is how to write tests, how to write tests for complex apps, or libraries.
tags:
  - Android
  - Kotlin
  - Mockito
  - Retrofit
  - RxJava
---

### __Tests in Android, say what?__
There's lots of blog posts out there with great examples on how to do certain things in Kotlin/Android, take [this one](/android-viewpager2/) for example. What there seems to be a lack of, in general, is how to write tests. There's some simple explanations about for classic "addition" unit testing, you know, you send 2 numbers into a function and get the sum of them out, about as trivial and far from the real world as possible (unless you're writing node modules, then there's probably already one for it). There are a few examples of tests for full apps, tapping buttons and things like that, but what I wanted to test was a simple library, something reusable.

What I've been writing is a simple library for doing some network activity, going to flickr, fetching some images, all that jazz. We have a service interface that uses Retrofit 2 annotations and produces RxJava observables. We have a repository that takes the service as a constructor arg and uses the service to request some images, watches the observable and updates a Mutable/LiveData that an app/viewmodel/etc can observe for changes. This will get more complicated later involving pagination and updating etc, but this is the state of the library as I want to test it.

### __Repository testing and mocked network calls__
Initially I want to test the repository, so that a known response from the api call produces consistent results to the client, the repository involves some transformation of the response, parsing/transforming it as needed, so sounds like a good candidate for our first set of tests. When writing js apps it's most common to use axios for network traffic, and there're many options for mocking that traffic during testing. Officially there's moxios, mock adapter and unofficially network intercept apps like nock. Looking around Retrofit it has [Retrofit-mock](https://github.com/square/Retrofit/tree/master/Retrofit-mock) and so I started there. There wasn't a lot of information out there, so I dove straight in and tried to see what I could make out, I ended up with a mockservice that produced network delegates and a brain that was streaming out through my ears, there had to be something better. I started to look at mockito to see if we could use that instead to mock our network traffic. This made the code a lot simpler, but I was still getting problems 
```
Expected :<[SizedImage(id=1)]>
Actual   :null
```
Google was not helping with this, as I said there was not many posts about testing and only a tiny subset of them had testing Retrofit and RxJava. Don't get me wrong, millions of posts about Retrofit and RxJava, but who wants to write about testing in a blog post...

### Immediate Executor and Immediate Scheduler
So I turned to my trusty source for all things Android, my sister Maja. Her response: "Immediate executor for tests, Google it". So I did. This led me to [this blog](https://www.codexpedia.com/android/unit-test-Retrofit-2-RxJava-2-and-livedata-in-android/) it seemed a bit out of date but was enough to get me to the end result. I added
```
@Rule
@JvmField
var rule = InstantTaskExecutorRule()
```
and created a customer scheduler
```
// Test rule for making the RxJava run synchronously in unit tests
companion object {
    @ClassRule
    @JvmField
    val schedulers = RxImmediateSchedulerRule()
}
```
and then we were all working perfectly, I was able to assert against the responses as expected and get passing tests!
Amazing!

You can view the code and tests as is in a very incomplete [git repo](https://github.com/gabriel403/AndroidTesting)