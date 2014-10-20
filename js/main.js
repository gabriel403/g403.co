var lastScrollTop = $(window).scrollTop();
$(window).scroll(function () {
	var newScrollTop = $(window).scrollTop();
	var newHeight    = newScrollTop < 130 ? 200-newScrollTop : 70;
	var currentTop   = $('#big-ass-banner-word').css('top').replace(/[^-\d\.]/g, '');
	$('#big-ass-banner').css({ height: newHeight });
	$('#below-banner').css({ paddingTop: newHeight });

	if (newScrollTop < 100) {
		var newTop = Math.floor(currentTop - (newScrollTop - lastScrollTop));
		if (newTop < 0) {
			 newTop = 10
		}
		$('#big-ass-banner-word').css({ top: newTop });
		lastScrollTop = newScrollTop;
	}

	if (newScrollTop > 0) {
		if (newScrollTop <= 200) {
			var div = newScrollTop/100;
			$('#big-ass-banner-word').css({ fontSize: (4-div)+'em' });
		}
	} else {
		$('#big-ass-banner-word').css({ fontSize: '4em' });

	}

	if (newScrollTop > 150) {
		if ($('#big-ass-banner').hasClass('small-ass-banner')) {
			return;
		}
		$('#big-ass-banner').addClass('small-ass-banner');
		$('#below-banner').addClass('small-ass-banner');
		firstRun = true;
	} else {
		if (!$('#big-ass-banner').hasClass('small-ass-banner')) {
			return;
		}
		$('#big-ass-banner').removeClass('small-ass-banner');
		$('#below-banner').removeClass('small-ass-banner');
		firstRun = true;
	}
})

var words     = ["This","is","one","of","those","big-ass","banners","all","the","young","folk","love"];
var miniWords = ["Look","at","me","I'm","so","cute","and","tiny!"];
var firstRun  = true;

var wordPos = function() {
	var maxLeft = $('#big-ass-banner').width()-$('#big-ass-banner-word').width();
	var maxTop  = $('#big-ass-banner').height()-$('#big-ass-banner-word').height();
	var leftPos = Math.floor(Math.random() * (maxLeft + 1))
	var topPos  = Math.floor(Math.random() * (maxTop + 1))
	$('#big-ass-banner-word').css({ left: leftPos, top: topPos });
}

var wordCh = function(position) {
	if ($('#big-ass-banner').hasClass('small-ass-banner')) {
		$('#big-ass-banner-word').text(miniWords[position]);
	} else {
		$('#big-ass-banner-word').text(words[position]);
	}
}

var wordFun = function(position, fadeIn){
	var defWrds = words;
	if ($('#big-ass-banner').hasClass('small-ass-banner')) {
		defWrds = miniWords;
	}

	if (fadeIn) {
		++position
		if (position >= defWrds.length || firstRun) {
			firstRun = false;
			position = 0;
		}
		wordCh(position)
		wordPos()
	}
	$('#big-ass-banner-word').toggleClass('faded');
	setTimeout(function(){wordFun(position, !fadeIn)}, 1000)
}

var newHeight = $(window).scrollTop() < 150 ? 200-$(window).scrollTop() : 70;
$('#big-ass-banner').css({ height: newHeight });
$('#below-banner').css({ paddingTop: newHeight });
setTimeout(function(){wordFun(-1, true)}, 1000)
