/* ===========================
   BARIZI PHARMA — script.js
   =========================== */

// ---- NAVBAR: scroll effect & hamburger ----
var navbar = document.getElementById('navbar');
var hamburger = document.getElementById('hamburger');
var navLinks = document.getElementById('navLinks');

window.addEventListener('scroll', function () {
  if (window.scrollY > 30) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});

hamburger.addEventListener('click', function () {
  navLinks.classList.toggle('open');
});

// Close nav on link click (mobile)
var navItems = navLinks.querySelectorAll('a');
navItems.forEach(function (link) {
  link.addEventListener('click', function () {
    navLinks.classList.remove('open');
  });
});

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
  slides[currentSlide].classList.remove('active');
  dots[currentSlide].classList.remove('active');
  currentSlide = index;
  slides[currentSlide].classList.add('active');
  dots[currentSlide].classList.add('active');
}

function nextSlide() {
  var next = (currentSlide + 1) % slides.length;
  goToSlide(next);
}

function startSlider() {
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

function openCourse(btn) {
  var card = btn.closest('.course-card');
  var title = card.querySelector('h4').textContent;
  modalTitle.textContent = title;
  modalDesc.textContent = 'Fill in your details to enroll in: ' + title;
  document.getElementById('enrollSuccess').classList.add('hidden');
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modal.classList.add('hidden');
  document.body.style.overflow = '';
}

modal.addEventListener('click', function (e) {
  if (e.target === modal) {
    closeModal();
  }
});

document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') {
    closeModal();
  }
});

// ---- PAYSTACK PAYMENT ----
var SERVER = 'http://localhost:3000'; // change to your live domain when deployed

// Program prices in KES — must match course card h4 titles exactly
var COURSE_PRICES = {
  'Regulatory Affairs Foundations'              : 3500,
  'QMS & ISO 9001 Lead Auditor Preparation'     : 7500,
  'Advanced Pharmacovigilance Leadership'       : 8500,
  'Pharmaceutical Policy & Leadership'          : 6000,
  'Medical Governance Essentials'               : 3500,
  'Industrial Pharmacy Operations Excellence'   : 6500
};

function submitEnroll(e) {
  e.preventDefault();
  var form       = e.target;
  var btn        = form.querySelector('button[type="submit"]');
  var successMsg = document.getElementById('enrollSuccess');
  var inputs     = form.querySelectorAll('input');
  var name       = inputs[0].value.trim();
  var email      = inputs[1].value.trim();
  var org        = inputs[2] ? inputs[2].value.trim() : '';
  var course     = modalTitle.textContent.trim();
  var amount     = COURSE_PRICES[course] || 5000;

  if (!name || !email) {
    alert('Please fill in your name and email.');
    return;
  }

  btn.textContent = 'Processing...';
  btn.disabled    = true;

  // Step 1: Ask server to initialize a Paystack transaction
  fetch(SERVER + '/api/payment/initialize', {
    method  : 'POST',
    headers : { 'Content-Type': 'application/json' },
    body    : JSON.stringify({ name, email, amount, course, type: 'course', org })
  })
  .then(function (res) { return res.json(); })
  .then(function (data) {
    if (!data.success) {
      throw new Error(data.message || 'Could not initialize payment.');
    }

    // Step 2: Open Paystack's hosted payment page
    var popup = window.open(data.authorization_url, '_blank', 'width=600,height=700');

    // Step 3: Poll for verification every 4 seconds (up to 3 minutes)
    var attempts = 0;
    var maxAttempts = 45;
    var reference  = data.reference;

    var poll = setInterval(function () {
      attempts++;
      if (attempts > maxAttempts) {
        clearInterval(poll);
        btn.textContent = 'Confirm Enrollment';
        btn.disabled    = false;
        alert('Payment window timed out. If you completed payment, contact support with ref: ' + reference);
        return;
      }

      fetch(SERVER + '/api/payment/verify/' + reference)
        .then(function (r) { return r.json(); })
        .then(function (v) {
          if (v.success && v.status === 'success') {
            clearInterval(poll);
            if (popup && !popup.closed) popup.close();
            successMsg.textContent = '🎉 Payment confirmed! KES ' + v.amount + ' received. Check your email for access details.';
            successMsg.classList.remove('hidden');
            btn.textContent = 'Confirm Enrollment';
            btn.disabled    = false;
            form.reset();
            setTimeout(function () {
              closeModal();
              successMsg.classList.add('hidden');
            }, 5000);
          }
        })
        .catch(function () { /* keep polling silently */ });
    }, 4000);
  })
  .catch(function (err) {
    console.error('[ENROLL ERROR]', err);
    alert('Error: ' + err.message);
    btn.textContent = 'Confirm Enrollment';
    btn.disabled    = false;
  });
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