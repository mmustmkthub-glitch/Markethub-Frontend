// =======================================================
// Backend API URLs
// =======================================================
const SIGNUP_URL = "https://mmustmkt-hub.onrender.com/api/users/register/";
const LOGIN_URL = "https://mmustmkt-hub.onrender.com/api/auth/token/";
const FORGOT_URL = "https://mmustmkt-hub.onrender.com/api/users/forgot-password/";

// =======================================================
// Function to load external HTML (Sign Up / Sign In forms)
// =======================================================
function loadSignupForm($formContainer) {
    const signupFilePath = 'sign-up-overlay.html'; // path to your form HTML

    $.get(signupFilePath)
        .done(function(html) {
            $formContainer.html(html);

            // Attach backend handlers AFTER content is loaded
            attachAuthHandlers($formContainer);
        })
        .fail(function(jqXHR, textStatus, errorThrown) {
            console.error('Error loading sign-up form:', textStatus, errorThrown);
            $formContainer.html('<p>Error loading sign-up form. Please try again later.</p>');
        });
}

// =======================================================
// Modal Controls
// =======================================================
const $modal = $('#signupModal');
const $openBtn = $('#openSignupModal');
const $closeBtn = $modal.find('.close-button');
const $formContainer = $('#signupFormContent');

$openBtn.on('click', function(e) {
    e.preventDefault();
    loadSignupForm($formContainer); 
    $modal.show();
});

$closeBtn.on('click', function() {
    $modal.hide();
});

$(window).on('click', function(event) {
    if ($(event.target).is($modal)) {
        $modal.hide();
    }
});

// =======================================================
// Function to attach API handlers after form is loaded
// =======================================================
function attachAuthHandlers($container) {

    // ------------------ Sign Up ------------------
    const $signupBtn = $container.find('#signupBtn');
    $signupBtn.on('click', async function(e) {
        e.preventDefault();

        const username = $container.find("#signup input[type='text']").val().trim();
        const email = $container.find("#signup input[type='email']").val().trim();
        const phone = $container.find("#signup input[type='tel']").eq(0).val().trim();
        const idValue = $container.find("#signup input[type='tel']").eq(1).val().trim();
        const role = $container.find("#role").val();
        const password = $container.find("#signup input[type='password']").val();
        const isAgreed = $container.find("#agree-terms").is(':checked');

        if (!username || !email || !password) {
            alert("⚠️ Please fill in Username, Email, and Password.");
            return;
        }

        const userData = {
            username,
            email,
            password,
            role,
            phone,
            student: idValue,
            is_verified: isAgreed
        };

        try {
            const response = await fetch(SIGNUP_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
            const result = await response.json();
            if (response.ok) {
                alert("✅ Sign Up Successful! You can now sign in.");
                $container.find("#signup form")[0].reset();
                $container.find("#signup").removeClass("active");
                $container.find("#signin").addClass("active");
            } else {
                alert("❌ Sign Up failed: " + (result.detail || JSON.stringify(result)));
                console.error(result);
            }
        } catch (error) {
            console.error("Network error during Sign Up:", error);
            alert("⚠️ Could not connect to the server.");
        }
    });

    // ------------------ Sign In ------------------
    const $signinBtn = $container.find('#signinBtn');
    $signinBtn.on('click', async function(e) {
        e.preventDefault();

        const username = $container.find("#signin input[type='text']").val().trim();
        const password = $container.find("#signin input[type='password']").val();

        if (!username || !password) {
            alert("⚠️ Please enter your Username and Password.");
            return;
        }

        const credentials = { username, password };

        try {
            const response = await fetch(LOGIN_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials)
            });
            const result = await response.json();
            if (response.ok) {
                localStorage.setItem("access_token", result.access);
                localStorage.setItem("refresh_token", result.refresh);
                localStorage.setItem("user_role", result.role || "buyer");

                alert("✅ Login Successful!");
                $modal.hide();
                window.location.href = (result.role || "buyer") === "seller" ? "index.html" : "order.html";
            } else {
                alert("❌ Sign In failed: " + (result.detail || "Invalid credentials."));
                console.error(result);
            }
        } catch (error) {
            console.error("Network error during Sign In:", error);
            alert("⚠️ Could not connect to the server.");
        }
    });

    // ------------------ Forgot Password ------------------
    const $forgotBtn = $container.find('.form-forgot .form-btn');
    $forgotBtn.on('click', async function(e) {
        e.preventDefault();
        const email = $container.find(".form-forgot input[type='email']").val().trim();
        if (!email) {
            alert("⚠️ Please enter your registered email.");
            return;
        }

        try {
            const response = await fetch(FORGOT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const result = await response.json();
            if (response.ok) {
                alert("✅ Password reset link sent! Check your email.");
                $container.find(".form-forgot")[0].reset();
            } else {
                alert("❌ Could not send reset email: " + (result.detail || JSON.stringify(result)));
                console.error(result);
            }
        } catch (error) {
            console.error("Network error during Forgot Password:", error);
            alert("⚠️ Could not connect to the server.");
        }
    });
}






(function($) {
	"use strict"

	// Mobile Nav toggle
	$('.menu-toggle > a').on('click', function (e) {
		e.preventDefault();
		$('#responsive-nav').toggleClass('active');
	})

	// Fix cart dropdown from closing
	$('.cart-dropdown').on('click', function (e) {
		e.stopPropagation();
	});

	/////////////////////////////////////////

	// Products Slick
	$('.products-slick').each(function() {
		var $this = $(this),
				$nav = $this.attr('data-nav');

		$this.slick({
			slidesToShow: 4,
			slidesToScroll: 1,
			autoplay: true,
			infinite: true,
			speed: 300,
			dots: false,
			arrows: true,
			appendArrows: $nav ? $nav : false,
			responsive: [{
	        breakpoint: 991,
	        settings: {
	          slidesToShow: 2,
	          slidesToScroll: 1,
	        }
	      },
	      {
	        breakpoint: 480,
	        settings: {
	          slidesToShow: 1,
	          slidesToScroll: 1,
	        }
	      },
	    ]
		});
	});

	// Products Widget Slick
	$('.products-widget-slick').each(function() {
		var $this = $(this),
				$nav = $this.attr('data-nav');

		$this.slick({
			infinite: true,
			autoplay: true,
			speed: 300,
			dots: false,
			arrows: true,
			appendArrows: $nav ? $nav : false,
		});
	});

	/////////////////////////////////////////

	// Product Main img Slick
	$('#product-main-img').slick({
    infinite: true,
    speed: 300,
    dots: false,
    arrows: true,
    fade: true,
    asNavFor: '#product-imgs',
  });

	// Product imgs Slick
  $('#product-imgs').slick({
    slidesToShow: 3,
    slidesToScroll: 1,
    arrows: true,
    centerMode: true,
    focusOnSelect: true,
		centerPadding: 0,
		vertical: true,
    asNavFor: '#product-main-img',
		responsive: [{
        breakpoint: 991,
        settings: {
					vertical: false,
					arrows: false,
					dots: true,
        }
      },
    ]
  });

	// Product img zoom
	var zoomMainProduct = document.getElementById('product-main-img');
	if (zoomMainProduct) {
		$('#product-main-img .product-preview').zoom();
	}

	/////////////////////////////////////////

	// Input number
	$('.input-number').each(function() {
		var $this = $(this),
		$input = $this.find('input[type="number"]'),
		up = $this.find('.qty-up'),
		down = $this.find('.qty-down');

		down.on('click', function () {
			var value = parseInt($input.val()) - 1;
			value = value < 1 ? 1 : value;
			$input.val(value);
			$input.change();
			updatePriceSlider($this , value)
		})

		up.on('click', function () {
			var value = parseInt($input.val()) + 1;
			$input.val(value);
			$input.change();
			updatePriceSlider($this , value)
		})
	});

	var priceInputMax = document.getElementById('price-max'),
			priceInputMin = document.getElementById('price-min');

	priceInputMax.addEventListener('change', function(){
		updatePriceSlider($(this).parent() , this.value)
	});

	priceInputMin.addEventListener('change', function(){
		updatePriceSlider($(this).parent() , this.value)
	});

	function updatePriceSlider(elem , value) {
		if ( elem.hasClass('price-min') ) {
			console.log('min')
			priceSlider.noUiSlider.set([value, null]);
		} else if ( elem.hasClass('price-max')) {
			console.log('max')
			priceSlider.noUiSlider.set([null, value]);
		}
	}

	// Price Slider
	var priceSlider = document.getElementById('price-slider');
	if (priceSlider) {
		noUiSlider.create(priceSlider, {
			start: [1, 999],
			connect: true,
			step: 1,
			range: {
				'min': 1,
				'max': 999
			}
		});

		priceSlider.noUiSlider.on('update', function( values, handle ) {
			var value = values[handle];
			handle ? priceInputMax.value = value : priceInputMin.value = value
		});
	}

})(jQuery);



