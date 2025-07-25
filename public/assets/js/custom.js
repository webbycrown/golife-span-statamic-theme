/* =====================================
    Template Name: Orion Construction - Tailwind HTML5 Template
    Author Name: WebbyCrown
    Description: Orion Construction - Tailwind HTML5 Template.
    Version:1.0
========================================*/

/*======================================
[ JS Table of contents ]
01. General Open JS
    + Mobile menu
    + Mobile menu dropdown
    + AOS
    + Page scroll to Header sticky

02. Slider Open JS
    + What we do slider
    + Testimonial slider
    + Customer Reviews slider
    + Photos Gallery slider
    + Trending Attractions slider
    + Popular Tours slider
    + Testimonial full slider

03. Popup Open JS
    + Cookie popup js
    + Newsletter Popup JS
    + Our Teachers popup
    + Enquiry form Popup JS
04. Preloader JS
05. Isotope JS



========================================*/

(function ($) {
  GoLife_span_donation = {
    init: function () {
      // Home one js
      this.general_open();
      this.slider_open();
      this.popup_open();
     // this.Isotope_js();
      this.Preloader_js();

    },

    /*======================================
     01. General Open JS
    ========================================*/
    general_open: function () {

      Dropzone.autoDiscover = false;

      $('#kt_dropzone_3').dropzone({
        url: "upload.php", // Set the url for your upload script location
        paramName: "file", // The name that will be used to transfer the file
        maxFiles: 10,
        maxFilesize: 10, // MB
        addRemoveLinks: true,
        accept: function(file, done) {
        if (file.name == "justinbieber.jpg") {
        done("Naha, you don't.");
        } else {
        done();
        }
        }
        });

      $(document).on("click", ".mobile-toggle", function () {
        $('.mobile-navmenu').toggleClass("open");
        $(this).toggleClass("active");
        $('body').toggleClass("menu-open");
      });
      $(document).on("click", ".popup-with-form", function () {
        $('.mobile-navmenu').removeClass("open");
        $('.mobile-toggle').removeClass("active");
        $('body').removeClass("menu-open");
      });

      /* Page scroll to Header sticky */
      $(window).scroll(function () {
        if ($(this).scrollTop() > 0) {
          $('.header').addClass("sticky-header");
        }
        else {
          $('.header').removeClass("sticky-header");
        }
      });

       /* Tabs Jquery */
       $('.tabs-list li, .tab-link-title').click(function () {
        var tab_id = $(this).attr('data-tab');
        // Find the parent container of the clicked tab
        var parentContainer = $(this).closest('.tabs-container');
        
        // Remove 'current' class from tabs and tab contents within the same container
        parentContainer.find('.tabs-list li, .tab-link-title').removeClass('current');
        parentContainer.find('.tabs-content').removeClass('current');
        
        // Add 'current' class to the clicked tab and its corresponding content within the same container
        $(this).addClass('current');
        $("#" + tab_id).addClass('current');
    });

    $(function () {
      $('input[name="admitted"]').change(function () {
          if ($(this).val() === "Admitted") {
              $("#admitted-input").show();
          } else {
              $("#admitted-input").hide();
          }
      });
  });

  // Forms steps

 $(document).ready(function() {
    // Function to show the next form
    function showNextForm(button) {
        button.closest(".global-form").hide().next(".global-form").show();
    }

    // Function to show the previous form
    function showPreviousForm(button) {
        button.closest(".global-form").hide().prev(".global-form").show();
    }

    // Event handler for next button
    $(".submit-btn").click(function(e) {
        e.preventDefault();
        showNextForm($(this));
    });

    // Event handler for previous button
    $(".previous-btn").click(function(e) {
        e.preventDefault();
        showPreviousForm($(this));
    });
});
      
 /* Accordian Jquery */
 $('.accordian-title').click(function(e) {
  e.preventDefault();

  let $this = $(this);

  if ($this.next().hasClass('show')) {
      $this.next().removeClass('show');
      $this.next().slideUp(350);
      $this.parent().parent().find(this).removeClass('active');
  } else {
      $this.parent().parent().find('.accordian .accordian-content').removeClass('show');
      $this.parent().parent().find('.accordian .accordian-content').slideUp(350);
      $this.parent().parent().find(this).addClass('active');
      $this.next().toggleClass('show');
      $this.next().slideToggle(350);
  }
});
      

    },

    /*======================================
     02. Slider Open JS
    ========================================*/
    slider_open: function () {
      var swiper = new Swiper(".SuccessSlider", {
        slidesPerView: 1,
        spaceBetween: 30,
        navigation: {
          nextEl: ".swiper-button-next",
          prevEl: ".swiper-button-prev",
        },
      });

      var swiper = new Swiper(".contribute-thumb", {
        spaceBetween: 10,
        slidesPerView: "auto",
        freeMode: true,
        watchSlidesProgress: true,
      });
      var swiper2 = new Swiper(".contribute-gallery", {
        loop: true,
        spaceBetween: 10,
        navigation: {
          nextEl: ".swiper-button-next",
          prevEl: ".swiper-button-prev",
        },
        thumbs: {
          swiper: swiper,
        },
      });


    },

    /*======================================
     03. Popup Open JS
    ========================================*/
    popup_open: function () {
      $(document).ready(function () {
        $('.popup-with-form').magnificPopup({
          type: 'inline',
          preloader: false,
          focus: '#name',

          // When elemened is focused, some mobile browsers in some cases zoom in
          // It looks not nice, so we disable it:
          callbacks: {
            beforeOpen: function () {
              if ($(window).width() < 700) {
                this.st.focus = false;
              } else {
                this.st.focus = '#name';
              }
            }
          }
        });

           /*Hero section youtube popup*/
        $('.popup-youtube').magnificPopup({
          type: 'iframe',
          mainClass: 'mfp-fade',
          removalDelay: 160,
          preloader: false,
          fixedContentPos: false
        });

        $(document).ready(function() {
          $('.popup-gallery').magnificPopup({
            delegate: 'a',
            type: 'image',
            tLoading: 'Loading image #%curr%...',
            mainClass: 'mfp-img-mobile',
            gallery: {
              enabled: true,
              navigateByImgClick: true,
              preload: [0,1] // Will preload 0 - before current, and 1 after the current image
            },
            image: {
              tError: '<a href="%url%">The image #%curr%</a> could not be loaded.',
              titleSrc: function(item) {
                return item.el.attr('title') + '';
              }
            }
          });
        });
      });
    },

    /*======================================
     04. Preloader JS
    ========================================*/
    Preloader_js: function () {
      //After 2s preloader is fadeOut
     $('.preloader').delay(2000).fadeOut('slow');
      setTimeout(function () {
        //After 2s, the no-scroll class of the body will be removed
        $('body').removeClass('no-scroll');
      }, 2000); //Here you can change preloader time
    },

    /*======================================
     05. Isotope JS
    ========================================*/
    Isotope_js: function () {

    },




  };
  GoLife_span_donation.init();

})(jQuery);
