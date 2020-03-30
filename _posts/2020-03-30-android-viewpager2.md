---
layout: post
title: Implementing ViewPager2 in a basic Android app
excerpt: This is 1st in a series of quick blog posts on implementing some features in an Android app. ViewPager allows us have a horizontal (and vertical) swiping component that populates from a series/list of various kinds, either Views, Fragements or data sources.
tags:
  - android
  - kotlin
  - viewpager
  - databinding
---

I've only been learning Android for the last 6 months or so, in my spare time, so this is 1st in a series of quick blog posts on implementing some features in an Android app. These will be fairly basic for most experienced people, but helped me and maybe help other new devs with getting to grips with these things. 

[You can find the code in a GitHub repo](https://github.com/gabriel403/ViewPager2Demo)

# ViewPager2
ViewPager allows us have a horizontal (and vertical) swiping component that populates from a series/list of various kinds, either Views, Fragements or data sources. `ViewPager2` is built on `RecyclerView`, which gives us some improvements around performance, rtl support, and it means when we're familiar with one, we're mostly familar with the other. We can also add fancy animations as we swipe.

This is what we'll be building
![Hardcore Swiping Action](/images/ViewPager2-demo.gif){:class="center-img"}{:width="200px"}

## Basics & intro
This is not by any means comprehensive, but is from my perspective, ViewModels retrieve data from repositories, fragments observe the ViewModel's data and apply an adapter against them, an Adapter converts the data from the ViewModel into something that can be bound to the individual ViewHolders, and this is what updates the UI when we swipe. We use databinding to to do a lot of the heavy lifting for us.

## Getting started

We're using the latest Android studio beta, but the latest stable Android studio should work fine. We create a new project with an empty activity to get started.

First we want to enable data binding in the app

Add this into the gradle file of your app module

```
buildFeatures {
  dataBinding = true
}
```
and we need to apply kapt plugin for databinding

```
apply plugin: "kotlin-kapt"
```

and then further down we add a dependency on the viewpager2 module, we also include lifecycle-extensions to remove a few deprecated statements

```
implementation "androidx.viewpager2:viewpager2:1.0.0"
implementation "androidx.lifecycle:lifecycle-extensions:2.2.0"
```

We then create a package to represent the data we want to use, in my example case testimonials, within that package a kotlin class called `TestimonialAdapter`, this will extend a `ListAdapter` inorder to bind a testimonial data object to the layout, we'll fill this out a bit more later.  
Alongside this we create a package called `datasource` and inside this a `Testimonial` class and a `TestimonialRespository` class, these are fairly simple, and in the repository we'll just return some pre-defined objects rather than getting bogged down in network or databse requests.

## Data data data

{% highlight kotlin %}
data class Testimonial(
  val authorText: String,
  val testimonialText: String,
  val companyText: String
)
{% endhighlight %}

{% highlight kotlin %}
class TestimonialRepository {
  private val testimonials = MutableLiveData<List<Testimonial>>()

  fun getTestimonials(): LiveData<List<Testimonial>> {
    testimonials.value = listOf(
      Testimonial(
        testimonialText = "Gabriel is an amazing developer and I'm so appreciative to have him as my Tech Lead, he's pretty too",
        authorText = "Pawełek Grzybek — Junior Developer",
        companyText = "Mindera"
      ),
      Testimonial(
        testimonialText = "Gabs is one of the best at what he does, always available for a job, clean, methodical",
        authorText = "Maja T — Przyjaciółka",
        companyText = "Trzebiatowska Crime Family"
      ),
      Testimonial(
        testimonialText =
        "Gabriel is such a mediocre game player he makes me look good, I appreciate that he holds back so much for me",
        authorText = "Ben R — bff",
        companyText = "Loser@Games Co."
      )
    )
    return testimonials
  }
}
{% endhighlight %}

### Infrastructure
Next we're going to create a view to represent the testimonial and a fragement/viewmodel to hold them and give them some context.

Create a new toplevel package ui, and within that a package home, and then create a new fragment (with viewmodel) within that.

- app/
  - testimonials/
    - TestimonialAdapter
    - datasource/
      - Testimonial
      - TestimonialRepository
  - ui/
    - home/
      - HomeFragment
      - HomeViewModel

And then within out layouts folder we want

- layout
  - home_fragment
  - testimonials_layout
  - testimonial_layout
  - activity_main

So far we've covered the `Testimonial` data class and `TestimonialRepository` class, we're going to switch focus for a bit and look at our layout files.

## Layout files

Our `testimonial_layout` is a simple file that binds with the Testimonial object uses TextViews to output the data contained within the individual `Testimonial`, this is the layout that the ViewPager uses, and to which we bind the individual `Testimonial` objects

{% highlight xml %}
<?xml version="1.0" encoding="utf-8"?>
<layout xmlns:android="http://schemas.android.com/apk/res/android"
  xmlns:tools="http://schemas.android.com/tools">
  <data>
    <variable
      name="item"
      type="co.g403.android.viewpager2demo.testimonials.datasource.Testimonial" />
  </data>

  <LinearLayout
    android:id="@+id/testimonials_view_pager_container"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:paddingStart="16dp"
    android:paddingTop="40dp"
    android:paddingEnd="16dp"
    android:paddingBottom="40dp"
    tools:showIn="@layout/home_fragment">

    <TextView
      android:id="@+id/testimonial_text"
      android:layout_width="match_parent"
      android:layout_height="wrap_content"
      android:textAlignment="center"
      android:textColor="#222222"
      android:textSize="20sp"
      android:text="@{item.testimonialText}"
      tools:text="Gabriel is cool" />

    <Space
      android:layout_width="match_parent"
      android:layout_height="20dp" />

    <TextView
      android:id="@+id/testimonial_author"
      android:layout_width="match_parent"
      android:layout_height="wrap_content"
      android:textAlignment="center"
      android:textColor="#222222"
      android:textSize="18sp"
      android:text="@{item.authorText}"
      tools:text="Ben R — bff" />

    <Space
      android:layout_width="match_parent"
      android:layout_height="20dp" />

    <TextView
      android:id="@+id/testimonial_company"
      android:layout_width="match_parent"
      android:layout_height="wrap_content"
      android:textAlignment="center"
      android:textColor="#444"
      android:textSize="16sp"
      android:text="@{item.companyText}"
      tools:text="Loser@Games Co." />

  </LinearLayout>
</layout>
{% endhighlight %}

and the `testimonials_layout` is the container for our ViewPager2
{% highlight xml %}
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
  xmlns:tools="http://schemas.android.com/tools"
  android:layout_width="match_parent"
  android:layout_height="match_parent"
  android:orientation="vertical"
  android:background="#f5f5f5"
  android:id="@+id/testimonials_layout"
  tools:showIn="@layout/home_fragment">

  <TextView
    android:id="@+id/textView24"
    android:layout_width="match_parent"
    android:layout_height="wrap_content"
    android:alpha="0.9"
    android:text="People love me"
    android:textAlignment="center"
    android:textSize="24sp"
    tools:text="People love me" />

  <androidx.viewpager2.widget.ViewPager2
    android:id="@+id/testimonials_view_pager"
    android:layout_width="match_parent"
    android:layout_height="0dp"
    android:layout_weight="1" />
</LinearLayout>
{% endhighlight %}

Our `home_fragement` is a lot smaller and is just there as a wrapper around the `testimonials_layout`
{% highlight xml %}
<?xml version="1.0" encoding="utf-8"?>
<layout xmlns:android="http://schemas.android.com/apk/res/android"
  xmlns:tools="http://schemas.android.com/tools">
  <ScrollView
    android:layout_width="match_parent"
    android:layout_height="wrap_content"
    tools:context="co.g403.android.viewpager2demo.MainActivity">

    <include layout="@layout/testimonials_layout" />
  </ScrollView>
</layout>
{% endhighlight %}

and we also need to update our `activity_main` layout to render our fragment, normally we'd be using the navigation or something, but this is just a simple app so we can do it like this
{% highlight xml %}
<fragment
  android:id="@+id/home_fragment"
  android:name="co.g403.android.viewpager2demo.ui.home.HomeFragment"
  android:layout_width="0dp"
  android:layout_height="match_parent"
  android:layout_weight="2"
  app:layout_constraintEnd_toEndOf="parent"
  app:layout_constraintStart_toStartOf="parent" />
{% endhighlight %}

So we've covered the layouts, the `Testimonial` data class and the `TestimonialRepository`

- app/
  - testimonials/
    - TestimonialAdapter
    - datasource/
      - Testimonial ✅
      - TestimonialRepository ✅
  - ui/
    - home/
      - HomeFragment
      - HomeViewModel

- layout
  - home_fragment ✅
  - testimonials_layout ✅
  - testimonial_layout ✅
  - activity_main ✅

Now to wrap up the rest of the binding of the data to the layout, starting with the HomeViewModel, this just gets the repository of testimonials and stores them to be used in the layout
{% highlight kotlin %}
class HomeViewModel : ViewModel() {
  private val testimonialRepository = TestimonialRepository()
  val testimonials = testimonialRepository.getTestimonials()
}
{% endhighlight %}

Now we're down to the couple of classes that do most of the heavy lifting, the adapter and the fragment
{% highlight kotlin %}

class TestimonialAdapter : ListAdapter<Testimonial, TestimonialViewHolder>(TestimonialItemDiffCallback()) {
  override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): TestimonialViewHolder {
    val layoutInflater = LayoutInflater.from(parent.context)
    val binding = DataBindingUtil.inflate<ViewDataBinding>(layoutInflater, viewType, parent, false)
    return TestimonialViewHolder(binding)
  }

  override fun onBindViewHolder(holder: TestimonialViewHolder, position: Int) = holder.bind(getItem(position))
  override fun getItemViewType(position: Int) = R.layout.testimonial_layout
}

class TestimonialItemDiffCallback : DiffUtil.ItemCallback<Testimonial>() {
  override fun areItemsTheSame(oldItem: Testimonial, newItem: Testimonial): Boolean = oldItem == newItem
  override fun areContentsTheSame(oldItem: Testimonial, newItem: Testimonial): Boolean = oldItem == newItem
}

class TestimonialViewHolder(private val binding: ViewDataBinding) : RecyclerView.ViewHolder(binding.root) {
  fun bind(testimonial: Testimonial) {
    binding.setVariable(BR.item, testimonial)
    binding.executePendingBindings()
  }
}
{% endhighlight %}
We create `TestimonialAdapter` that extends the `ListAdapter`, this already gives us a few things to make development easier, but we do have to implement our own `DiffUtil.ItemCallback` for it. The override of `onCreateViewHolder` is so we can use databinding to bind the the data into the viewholder, our override of `onBindViewHolder` is so we can bind the correct testimonial to the viewholder and we override `getItemViewType` so that list/viewholder knows what layout is needed to inflate/populate.  
The `TestimonialViewHolder` takes in the data binding and when the adapter passes the testimonial to the viewholder we trigger the binding to update the variable in the layout.

{% highlight kotlin %}
class HomeFragment : Fragment() {
  private val viewModel: HomeViewModel = HomeViewModel()
  private val testimonialsAdapter: TestimonialAdapter = TestimonialAdapter()

  override fun onCreateView(
    inflater: LayoutInflater,
    container: ViewGroup?,
    savedInstanceState: Bundle?
  ): View? = inflater.inflate(R.layout.home_fragment, container, false)

  override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
    super.onViewCreated(view, savedInstanceState)
    view.testimonials_view_pager.adapter = testimonialsAdapter
  }

  override fun onActivityCreated(savedInstanceState: Bundle?) {
    super.onActivityCreated(savedInstanceState)
    viewModel.testimonials.observe(viewLifecycleOwner, Observer { list ->
      testimonialsAdapter.submitList(list)
    })
  }
}
{% endhighlight %}

Here we have the final piece of the app, the `HomeFragment`, here we hold the `HomeViewModel` and the `TestimonialAdapter`, when we create the view (`onViewCreated`) we set up all our binding mechanics.  
Then in `onActivityCreated` we observe the LiveData List of Testimonials that's in the ViewModel and when it changes we apply the TestimonialAdapter to it, so that it's able to bind correctly to our view

- app/
  - testimonials/
    - TestimonialAdapter ✅
    - datasource/
      - Testimonial ✅
      - TestimonialRepository ✅
  - ui/
    - home/
      - HomeFragment ✅
      - HomeViewModel ✅

- layout
  - home_fragment ✅
  - testimonials_layout ✅
  - testimonial_layout ✅
  - activity_main ✅

Now that it's complete, once we build and run this we'll get an app with a swipeable section as you can see in the gif below!  
[You can find the code in a GitHub repo](https://github.com/gabriel403/ViewPager2Demo)

I'm very concsious that we've skipped any form of testing for this, I don't know much about testing in Android, but I have the creepy feeling of my bestie, Maja, breathing down my neck at the lack of them.

Next I'll be writing:
 - writing tests for ViewPager
 - a quick post about repositories
 - maybe one on different animations in ViewPager
 - Annotations and BindingAdapaters (glide, extra formatting or styling)

![Hardcore Swiping Action](/images/ViewPager2-demo.gif){:class="center-img"}{:width="200px"}


