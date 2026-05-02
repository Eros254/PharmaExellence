// ===========================
// BARIZI PHARMA — script.js
// ===========================

// ---- NAVBAR: scroll behavior + mobile menu ----
var navbar = document.getElementById('navbar');
var hamburger = document.getElementById('hamburger');
var navLinks = document.getElementById('navLinks');

window.addEventListener('scroll', function () {
  if (window.scrollY > 40) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});

hamburger.addEventListener('click', function () {
  navLinks.classList.toggle('open');
});

// Close mobile menu when a link is clicked
var allNavLinks = navLinks.querySelectorAll('a');
allNavLinks.forEach(function (link) {
  link.addEventListener('click', function () {
    navLinks.classList.remove('open');
  });
});


// ---- SCROLL REVEAL ----
var revealElements = document.querySelectorAll('.reveal');

var revealObserver = new IntersectionObserver(function (entries) {
  entries.forEach(function (entry) {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

revealElements.forEach(function (el) {
  revealObserver.observe(el);
});


// ---- PROGRESS BARS: animate when visible ----
var progressBars = document.querySelectorAll('.progress');

var progressObserver = new IntersectionObserver(function (entries) {
  entries.forEach(function (entry) {
    if (entry.isIntersecting) {
      var bar = entry.target;
      var target = bar.style.width;
      bar.style.width = '0';
      setTimeout(function () {
        bar.style.width = target;
      }, 200);
      progressObserver.unobserve(bar);
    }
  });
}, { threshold: 0.3 });

progressBars.forEach(function (bar) {
  progressObserver.observe(bar);
});


// ---- STATS COUNTER ANIMATION ----
var statNumbers = document.querySelectorAll('.stat-num');

function animateCounter(el) {
  var target = parseInt(el.getAttribute('data-target'), 10);
  var start = 0;
  var duration = 1800;
  var stepTime = 20;
  var steps = Math.ceil(duration / stepTime);
  var increment = target / steps;
  var current = 0;

  var timer = setInterval(function () {
    current += increment;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    el.textContent = Math.floor(current);
  }, stepTime);
}

var statsObserver = new IntersectionObserver(function (entries) {
  entries.forEach(function (entry) {
    if (entry.isIntersecting) {
      animateCounter(entry.target);
      statsObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

statNumbers.forEach(function (num) {
  statsObserver.observe(num);
});


// ---- ACTIVE NAV LINK on scroll ----
var sections = document.querySelectorAll('section[id], header[id]');
var navItems = document.querySelectorAll('.nav-links a');

window.addEventListener('scroll', function () {
  var scrollPos = window.scrollY + 120;

  sections.forEach(function (section) {
    var top = section.offsetTop;
    var height = section.offsetHeight;
    var id = section.getAttribute('id');

    if (scrollPos >= top && scrollPos < top + height) {
      navItems.forEach(function (link) {
        link.classList.remove('active-nav');
        if (link.getAttribute('href') === '#' + id) {
          link.classList.add('active-nav');
        }
      });
    }
  });
});


// ---- CONTACT FORM SUBMISSION ----
var contactForm = document.getElementById('contactForm');
var formSuccess = document.getElementById('formSuccess');

contactForm.addEventListener('submit', function (e) {
  e.preventDefault();

  var name = document.getElementById('name').value.trim();
  var email = document.getElementById('email').value.trim();
  var interest = document.getElementById('interest').value;
  var message = document.getElementById('message').value.trim();

  if (!name || !email || !interest || !message) {
    alert('Please fill in all fields before submitting.');
    return;
  }

  var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    alert('Please enter a valid email address.');
    return;
  }

  // Simulate form submission
  var submitBtn = contactForm.querySelector('button[type="submit"]');
  submitBtn.textContent = 'Sending...';
  submitBtn.disabled = true;

  setTimeout(function () {
    contactForm.reset();
    submitBtn.textContent = 'Send Message';
    submitBtn.disabled = false;
    formSuccess.classList.add('show');

    setTimeout(function () {
      formSuccess.classList.remove('show');
    }, 5000);
  }, 1200);
});


// ---- SMOOTH SCROLL for anchor links ----
var anchorLinks = document.querySelectorAll('a[href^="#"]');

anchorLinks.forEach(function (link) {
  link.addEventListener('click', function (e) {
    var href = link.getAttribute('href');
    if (href === '#') return;

    var target = document.querySelector(href);
    if (target) {
      e.preventDefault();
      var offsetTop = target.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: offsetTop, behavior: 'smooth' });
    }
  });
});


// ---- HEX CARDS: tilt effect on hover ----
var hexCards = document.querySelectorAll('.hex');

hexCards.forEach(function (hex) {
  hex.addEventListener('mouseenter', function () {
    hex.style.transform = 'translateY(-10px) rotate(3deg) scale(1.08)';
  });
  hex.addEventListener('mouseleave', function () {
    hex.style.transform = '';
  });
});


// ---- SERVICE CARDS: hover depth effect ----
var serviceCards = document.querySelectorAll('.service-card, .track, .consult-card, .testi-card');

serviceCards.forEach(function (card) {
  card.addEventListener('mousemove', function (e) {
    var rect = card.getBoundingClientRect();
    var x = e.clientX - rect.left - rect.width / 2;
    var y = e.clientY - rect.top - rect.height / 2;
    var rotX = -(y / rect.height) * 6;
    var rotY = (x / rect.width) * 6;
    card.style.transform = 'perspective(600px) rotateX(' + rotX + 'deg) rotateY(' + rotY + 'deg) translateY(-4px)';
  });
  card.addEventListener('mouseleave', function () {
    card.style.transform = '';
  });
});


// ---- PAGE LOAD: add body class for entrance ----
window.addEventListener('load', function () {
  document.body.classList.add('loaded');
});