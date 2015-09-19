---
layout: post
title: ZF2 Custom Form Element
tags:
- zf2
- zendframework2
- php
- Zend\Form
---
Quick walk through on creating a simple custom form element that just echos out the value.

I recently needed a way to output plain text as part of a form, that would take a value just like a normal form element would.
It's very similar to something I needed to do in ZF1 and it always weirds me that ZF doesn't include something like this by default.

We need 4 files to add our new element:

* The form element
* The view helper for the element
* An override of the generic FormElement view helper
* A Module.php to add our element to the view helper config

I've been putting things that tend to be site wide in the application module, or seperate them into another module to be added at the vendor level.

This is our form element, we don't do anything fancy, it's just declaring the type.
{% highlight php linenos %}
<?php
    namespace Application\Form\Element;

    use Zend\Form\Element;

    class PlainText extends Element
    {
        protected $attributes = array(
            'type' => 'plaintext',
        );
    }
{% endhighlight %}
This is our view helper, very basic, just returns the value rather than parsing it into some fancy html
{% highlight php linenos %}
<?php

    namespace Application\Form\View\Helper;

    use Zend\Form\View\Helper\AbstractHelper;
    use Zend\Form\ElementInterface;

    class FormPlainText extends AbstractHelper {

        public function render(ElementInterface $element) {
        	return $element->getValue();
        }

    	public function __invoke(ElementInterface $element = null) {
    		return $this->render($element);
    	}

    }
{% endhighlight %}
Here we override the generic FormElement helper so that generic rendering methods, such as $this->formRow will work with our new element.

{% highlight php linenos %}
<?php
    namespace Application\Form\View\Helper;

    use Application\Form\Element;
    use Zend\Form\View\Helper\FormElement as BaseFormElement;
    use Zend\Form\ElementInterface;

    class FormElement extends BaseFormElement
    {
    	public function render(ElementInterface $element)
    	{
    		$renderer = $this->getView();
    		if (!method_exists($renderer, 'plugin')) {
    			// Bail early if renderer is not pluggable
    			return '';
    		}

    		if ($element instanceof Element\PlainText) {
    			$helper = $renderer->plugin('form_plain_text');
    			return $helper($element);
    		}

    		return parent::render($element);
    	}
    }
{% endhighlight %}

And finally we add our bits to the module configuration
{% highlight php linenos %}
<?php
    namespace Application;

    use Zend\Mvc\ModuleRouteListener;
    use Zend\Mvc\MvcEvent;

    class Module
    {

        public function getViewHelperConfig()
        {
            return array(
                'invokables' => array(
                    'formelement'       => 'Application\Form\View\Helper\FormElement',
                    'formPlainText'     => 'Application\Form\View\Helper\FormPlainText',
                ),
            );
        }
{% endhighlight %}

Now when we declare our forms we can add a plaintext form element
{% highlight php linenos %}
<?php
    $form->add(array(
        'type' => 'Application\Form\Element\PlainText',
        'name' => 'start_date',
        'attributes' => array(
            'id' => 'TrialStart',
        ),
        'options' => array(
            'label' => 'Trial Start Date',
        ),
    ));
{% endhighlight %}

And jobs done, you could add a second element which also renders a hidden field along with the plain text if you need the value being submitted too.
