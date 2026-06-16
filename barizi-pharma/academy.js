/* ===========================
   PHARMA EXCELLENCE ACADEMY — script.js
   =========================== */

// ---- NAVBAR: scroll effect & hamburger ----
var navbar = document.getElementById('navbar');
var hamburger = document.getElementById('hamburger');
var navLinks = document.getElementById('navLinks');

window.addEventListener('scroll', function () {
  if (!navbar) return;
  if (window.scrollY > 30) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});

if (hamburger && navLinks) {
  hamburger.addEventListener('click', function () {
    navLinks.classList.toggle('open');
  });
}

// Close nav on link click (mobile)
if (navLinks) {
  var navItems = navLinks.querySelectorAll('a');
  navItems.forEach(function (link) {
    link.addEventListener('click', function () {
      navLinks.classList.remove('open');
    });
  });
}

// ---- SMOOTH SCROLL ----
function scrollToSection(id) {
  var el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' });
  }
}

// ---- COUNTER ANIMATION ----
function animateCounters() {
  var counters = document.querySelectorAll('.stat-num');
  counters.forEach(function (counter) {
    var target = parseInt(counter.getAttribute('data-target'), 10);
    var start = 0;
    var duration = 1800;
    var stepTime = 16;
    var steps = duration / stepTime;
    var increment = target / steps;

    var timer = setInterval(function () {
      start += increment;
      if (start >= target) {
        counter.textContent = target;
        clearInterval(timer);
      } else {
        counter.textContent = Math.floor(start);
      }
    }, stepTime);
  });
}

// ---- SCROLL REVEAL ----
function addRevealClasses() {
  var sections = document.querySelectorAll(
    '.about, .services, .academy, .pharmtech, .testimonials, .contact'
  );
  sections.forEach(function (section) {
    var children = section.querySelectorAll(
      '.service-card, .course-card, .tech-feature, .pillar, .about-card-main, .about-card-accent'
    );
    children.forEach(function (el) {
      el.classList.add('reveal');
    });
  });
}

function revealOnScroll() {
  var elements = document.querySelectorAll('.reveal');
  elements.forEach(function (el) {
    var rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight - 80) {
      el.classList.add('visible');
    }
  });
}

// ---- TESTIMONIALS SLIDER ----
var currentSlide = 0;
var slides = document.querySelectorAll('.testimonial-card');
var dots = document.querySelectorAll('.dot');
var sliderInterval;

function goToSlide(index) {
  if (!slides.length || !dots.length) return;
  slides[currentSlide].classList.remove('active');
  dots[currentSlide].classList.remove('active');
  currentSlide = index;
  slides[currentSlide].classList.add('active');
  dots[currentSlide].classList.add('active');
}

function nextSlide() {
  if (!slides.length) return;
  var next = (currentSlide + 1) % slides.length;
  goToSlide(next);
}

function startSlider() {
  if (!slides.length || !dots.length) return;
  sliderInterval = setInterval(nextSlide, 5000);
}

function resetSlider() {
  clearInterval(sliderInterval);
  startSlider();
}

// Reset auto-slide on manual dot click
dots.forEach(function (dot, i) {
  dot.addEventListener('click', function () {
    goToSlide(i);
    resetSlider();
  });
});

// ---- CONTACT FORM SUBMIT ----
function submitForm(e) {
  e.preventDefault();
  var btn = e.target.querySelector('button[type="submit"]');
  var successMsg = document.getElementById('formSuccess');
  btn.textContent = 'Sending...';
  btn.disabled = true;

  setTimeout(function () {
    successMsg.classList.remove('hidden');
    btn.textContent = 'Send Message';
    btn.disabled = false;
    e.target.reset();
    setTimeout(function () {
      successMsg.classList.add('hidden');
    }, 5000);
  }, 1400);
}

// ---- ENROLLMENT MODAL ----
var modal = document.getElementById('modal');
var modalTitle = document.getElementById('modalTitle');
var modalDesc = document.getElementById('modalDesc');
var GOOGLE_FORM_URL = 'https://forms.google.com/';

function openCourse(btn) {
  if (!modal || !modalTitle || !modalDesc) return;
  var card = btn.closest('.course-card');
  var title = card.querySelector('h4').textContent;
  modalTitle.textContent = title;
  modalDesc.textContent = 'Start your application for: ' + title;
  document.getElementById('enrollSuccess').classList.add('hidden');
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  if (!modal) return;
  modal.classList.add('hidden');
  document.body.style.overflow = '';
}

if (modal) {
  modal.addEventListener('click', function (e) {
    if (e.target === modal) {
      closeModal();
    }
  });
}

document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') {
    closeModal();
  }
});

function submitEnroll(e) {
  e.preventDefault();
  var form       = e.target;
  var btn        = form.querySelector('button[type="submit"]');
  var successMsg = document.getElementById('enrollSuccess');
  var inputs     = form.querySelectorAll('input');
  var name       = inputs[0].value.trim();
  var email      = inputs[1].value.trim();
  var course     = modalTitle.textContent.trim();

  if (!name || !email) {
    alert('Please fill in your name and email.');
    return;
  }

  btn.textContent = 'Opening form...';
  btn.disabled    = true;

  successMsg.textContent = 'Application started for ' + course + '. Complete the Google Form to submit your details.';
  successMsg.classList.remove('hidden');
  window.open(GOOGLE_FORM_URL, '_blank', 'noopener');
  btn.textContent = 'Continue Application';
  btn.disabled = false;
  form.reset();
}

// ---- ACTIVE NAV LINK on scroll ----
function updateActiveNav() {
  var sections = document.querySelectorAll('section[id]');
  var scrollPos = window.scrollY + 100;
  sections.forEach(function (section) {
    var top = section.offsetTop;
    var height = section.offsetHeight;
    var id = section.getAttribute('id');
    var link = document.querySelector('.nav-links a[href="#' + id + '"]');
    if (link) {
      if (scrollPos >= top && scrollPos < top + height) {
        document.querySelectorAll('.nav-links a').forEach(function (a) {
          a.style.color = '';
          a.style.background = '';
        });
        link.style.color = 'var(--blue-dark)';
        link.style.background = 'var(--blue-light)';
      }
    }
  });
}

// ---- INIT ----
var countersRun = false;

window.addEventListener('scroll', function () {
  revealOnScroll();
  updateActiveNav();

  // Run counters once when hero is near top
  if (!countersRun && window.scrollY < 400) {
    countersRun = true;
    animateCounters();
  }
});

document.addEventListener('DOMContentLoaded', function () {
  addRevealClasses();
  revealOnScroll();
  startSlider();
  animateCounters();

  // Hexagon floating animation
  var hexes = document.querySelectorAll('.hex');
  hexes.forEach(function (hex, i) {
    hex.style.animationDelay = (0.5 + i * 0.1) + 's';
    setInterval(function () {
      var y = Math.sin(Date.now() / 1000 + i) * 6;
      hex.style.transform = 'translateY(' + y + 'px)';
    }, 16);
  });
});
