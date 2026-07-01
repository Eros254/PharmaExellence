/* ===========================
   PHARMA EXCELLENCE ACADEMY — script.js
   =========================== */

var navbar = document.getElementById("navbar");
var hamburger = document.getElementById("hamburger");
var navLinks = document.getElementById("navLinks");
var drawerClose = document.getElementById("drawerClose");
var navOverlay = document.getElementById("navOverlay");
var scrollProgress = document.getElementById("scrollProgress");
var backToTop = document.getElementById("backToTop");
var toastContainer = document.getElementById("toastContainer");
var modal = document.getElementById("modal");
var modalTitle = document.getElementById("modalTitle");
var modalDesc = document.getElementById("modalDesc");
var modalPrice = document.getElementById("modalPrice");
var GOOGLE_FORM_URL = "https://forms.google.com/";
var currentSlide = 0;
var slides = document.querySelectorAll(".testimonial-card");
var dots = document.querySelectorAll(".dot");
var sliderInterval;
var countersRun = false;
var revealObserver;
var navObserver;

function scrollToSection(id) {
  var el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: "smooth" });
  }
}

function setMenuOpen(isOpen) {
  if (!navLinks) return;
  navLinks.classList.toggle("open", isOpen);
  if (navOverlay) {
    navOverlay.classList.toggle("active", isOpen);
    navOverlay.hidden = !isOpen;
  }
  if (hamburger) {
    hamburger.classList.toggle("active", isOpen);
    hamburger.setAttribute("aria-expanded", String(isOpen));
  }
  document.body.style.overflow = isOpen ? "hidden" : "";
}

function closeMenu() {
  setMenuOpen(false);
}

function showToast(title, message, type) {
  if (!toastContainer) return;
  var toast = document.createElement("div");
  toast.className = "toast " + (type || "info");
  toast.innerHTML =
    '<div><div class="toast-title">' +
    title +
    '</div><div class="toast-message">' +
    message +
    '</div></div><button class="toast-close" type="button" aria-label="Close notification">×</button>';
  toastContainer.appendChild(toast);
  var closeButton = toast.querySelector(".toast-close");
  closeButton.addEventListener("click", function () {
    toast.remove();
  });
  setTimeout(function () {
    if (toast.parentNode) {
      toast.remove();
    }
  }, 4000);
}

function setButtonLoading(button, isLoading, label) {
  if (!button) return;
  if (isLoading) {
    button.classList.add("btn-loading");
    button.disabled = true;
    button.dataset.originalText = button.innerHTML;
    button.innerHTML = '<span class="spinner" aria-hidden="true"></span>';
  } else {
    button.classList.remove("btn-loading");
    button.disabled = false;
    if (button.dataset.originalText) {
      button.innerHTML = button.dataset.originalText;
    }
  }
}

function validateField(field) {
  var group = field.closest(".form-group");
  var error = group ? group.querySelector(".field-error") : null;
  var value = field.value.trim();
  var required = field.hasAttribute("required");
  var type = field.type || field.tagName.toLowerCase();

  if (group) {
    group.classList.remove("error", "success");
  }

  if (!required && !value) {
    if (group) {
      group.classList.add("success");
    }
    return true;
  }

  if (!value) {
    if (group) {
      group.classList.add("error");
      if (error) error.textContent = "This field is required.";
    }
    return false;
  }

  if (type === "email" || field.id === "email") {
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      if (group) {
        group.classList.add("error");
        if (error) error.textContent = "Please enter a valid email address.";
      }
      return false;
    }
  }

  if (group) {
    group.classList.add("success");
    if (error) error.textContent = "";
  }
  return true;
}

function attachValidation(form) {
  var fields = form.querySelectorAll("input, select, textarea");
  fields.forEach(function (field) {
    field.addEventListener("blur", function () {
      validateField(field);
    });
    field.addEventListener("input", function () {
      validateField(field);
    });
  });
}

function animateCounters() {
  var counters = document.querySelectorAll(".stat-num");
  counters.forEach(function (counter) {
    var target = parseInt(counter.getAttribute("data-target"), 10);
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

function addRevealClasses() {
  var sections = document.querySelectorAll(
    ".about, .services, .academy, .pharmtech, .testimonials, .contact",
  );
  sections.forEach(function (section) {
    var children = section.querySelectorAll(
      ".service-card, .course-card, .tech-feature, .pillar, .about-card-main, .about-card-accent, .info-panel, .faq-item, .testimonial-card, .post-card",
    );
    children.forEach(function (el, index) {
      el.classList.add("reveal");
      el.style.transitionDelay = index * 70 + "ms";
    });
  });
}

function initRevealObserver() {
  if (!("IntersectionObserver" in window)) {
    document.querySelectorAll(".reveal").forEach(function (el) {
      el.classList.add("visible");
    });
    return;
  }

  revealObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16 },
  );

  document.querySelectorAll(".reveal").forEach(function (el) {
    revealObserver.observe(el);
  });
}

function goToSlide(index) {
  if (!slides.length || !dots.length) return;
  slides[currentSlide].classList.remove("active");
  dots[currentSlide].classList.remove("active");
  currentSlide = index;
  slides[currentSlide].classList.add("active");
  dots[currentSlide].classList.add("active");
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

function getSupabaseClient() {
  if (window.supabase && !window.__skillexSupabaseClient) {
    var config = window.SUPABASE_CONFIG || {};
    if (
      config.url &&
      config.anonKey &&
      config.url.indexOf("YOUR_") === -1 &&
      config.anonKey.indexOf("YOUR_") === -1
    ) {
      window.__skillexSupabaseClient = window.supabase.createClient(
        config.url,
        config.anonKey,
      );
    }
  }
  return window.__skillexSupabaseClient;
}

function saveSubmission(payload) {
  var client = getSupabaseClient();
  if (client) {
    return client
      .from(
        (window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.tableName) ||
          "submissions",
      )
      .insert([payload])
      .select()
      .then(function (response) {
        if (response.error) {
          throw response.error;
        }
        return { success: true, mode: "supabase" };
      });
  }

  var stored = JSON.parse(
    localStorage.getItem("pharma-excellence-local-submissions") || "[]",
  );
  stored.push(payload);
  localStorage.setItem(
    "pharma-excellence-local-submissions",
    JSON.stringify(stored),
  );
  return Promise.resolve({ success: true, mode: "local-storage" });
}

function submitForm(e) {
  e.preventDefault();
  var form = e.target;
  var btn = form.querySelector('button[type="submit"]');
  var successMsg = document.getElementById("formSuccess");
  var name = document.getElementById("name").value.trim();
  var email = document.getElementById("email").value.trim();
  var service = document.getElementById("service").value.trim();
  var message = document.getElementById("message").value.trim();
  var valid =
    validateField(document.getElementById("name")) &&
    validateField(document.getElementById("email")) &&
    validateField(document.getElementById("message"));

  if (!valid) {
    showToast(
      "Validation needed",
      "Please complete the highlighted fields before sending.",
      "error",
    );
    if (successMsg) {
      successMsg.textContent =
        "Please complete the highlighted fields before sending.";
      successMsg.classList.remove("hidden");
    }
    return;
  }

  setButtonLoading(btn, true);
  if (successMsg) {
    successMsg.textContent = "Saving your enquiry securely...";
    successMsg.classList.remove("hidden");
  }

  saveSubmission({
    type: "contact",
    full_name: name,
    email: email,
    program: service || "General enquiry",
    message: message,
    created_at: new Date().toISOString(),
  })
    .then(function () {
      showToast(
        "Request received",
        "Thanks! Your enquiry has been captured and we will follow up shortly.",
        "success",
      );
      if (successMsg) {
        successMsg.textContent =
          "Thanks! Your enquiry has been captured and we will follow up shortly.";
      }
      setButtonLoading(btn, false, "Send Message");
      form.reset();
      document.querySelectorAll(".form-group").forEach(function (group) {
        group.classList.remove("success", "error");
        var error = group.querySelector(".field-error");
        if (error) error.textContent = "";
      });
      setTimeout(function () {
        if (successMsg) successMsg.classList.add("hidden");
      }, 5000);
    })
    .catch(function () {
      showToast(
        "Submission issue",
        "Your enquiry could not be stored live yet. Please email admissions directly for immediate follow-up.",
        "error",
      );
      if (successMsg) {
        successMsg.textContent =
          "Your enquiry could not be stored live yet. Please email admissions directly for immediate follow-up.";
      }
      setButtonLoading(btn, false, "Send Message");
    });
}

function openCourse(btn) {
  if (!modal || !modalTitle || !modalDesc) return;
  var card = btn.closest(".course-card");
  var title = card.querySelector("h4").textContent;
  var price = card.getAttribute("data-price");
  modalTitle.textContent = title;
  modalDesc.textContent = "Start your application for: " + title;
  modalPrice.textContent = price
    ? "Course price: KES " + Number(price).toLocaleString()
    : "Course price available on request";
  document.getElementById("enrollSuccess").classList.add("hidden");
  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  if (!modal) return;
  modal.classList.add("hidden");
  document.body.style.overflow = "";
}

function submitEnroll(e) {
  e.preventDefault();
  var form = e.target;
  var btn = form.querySelector('button[type="submit"]');
  var successMsg = document.getElementById("enrollSuccess");
  var inputs = form.querySelectorAll("input");
  var name = inputs[0].value.trim();
  var email = inputs[1].value.trim();
  var course = modalTitle.textContent.trim();
  var education = inputs[2] ? inputs[2].value.trim() : "";
  var valid = validateField(inputs[0]) && validateField(inputs[1]);

  if (!valid) {
    showToast(
      "Validation needed",
      "Please add your name and a valid email before continuing.",
      "error",
    );
    if (successMsg) {
      successMsg.textContent =
        "Please add your name and a valid email before continuing.";
      successMsg.classList.remove("hidden");
    }
    return;
  }

  setButtonLoading(btn, true);
  if (successMsg) {
    successMsg.textContent = "Saving your enrollment request...";
    successMsg.classList.remove("hidden");
  }

  saveSubmission({
    type: "enrollment",
    full_name: name,
    email: email,
    program: course,
    education_level: education,
    created_at: new Date().toISOString(),
  })
    .then(function () {
      showToast(
        "Enrollment prepared",
        "Application details saved. We opened the form for completion.",
        "success",
      );
      if (successMsg) {
        successMsg.textContent =
          "Application started for " +
          course +
          ". We captured your details and opened the form for completion.";
      }
      window.open(GOOGLE_FORM_URL, "_blank", "noopener");
      setButtonLoading(btn, false, "Continue Application");
      form.reset();
    })
    .catch(function () {
      showToast(
        "Enrollment prepared",
        "Your request was saved locally. Please continue with the application form to finish.",
        "info",
      );
      if (successMsg) {
        successMsg.textContent =
          "Your request was prepared locally. Please continue with the application form to complete submission.";
      }
      window.open(GOOGLE_FORM_URL, "_blank", "noopener");
      setButtonLoading(btn, false, "Continue Application");
      form.reset();
    });
}

function updateActiveNav() {
  var sections = Array.from(document.querySelectorAll("section[id]"));
  var currentId = "";
  var scrollPos = window.scrollY + 120;

  sections.forEach(function (section) {
    if (section.offsetTop <= scrollPos) {
      currentId = section.getAttribute("id");
    }
  });

  document.querySelectorAll(".nav-links a").forEach(function (link) {
    var href = link.getAttribute("href");
    if (href && href.includes("#")) {
      var targetId = href.split("#")[1];
      link.classList.toggle("active", targetId === currentId);
    }
  });
}

function updateScrollProgress() {
  if (!scrollProgress) return;
  var scrollTop = window.scrollY;
  var docHeight = document.documentElement.scrollHeight - window.innerHeight;
  var progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  scrollProgress.style.width = progress + "%";
}

function updateBackToTop() {
  if (!backToTop) return;
  if (window.scrollY > 700) {
    backToTop.classList.add("visible");
  } else {
    backToTop.classList.remove("visible");
  }
}

function initNavigation() {
  if (hamburger) {
    hamburger.addEventListener("click", function () {
      setMenuOpen(!navLinks.classList.contains("open"));
    });
  }

  if (drawerClose) {
    drawerClose.addEventListener("click", closeMenu);
  }

  if (navOverlay) {
    navOverlay.addEventListener("click", closeMenu);
  }

  document.querySelectorAll(".nav-links a").forEach(function (link) {
    link.addEventListener("click", closeMenu);
  });
}

function initForms() {
  var contactForm = document.getElementById("contactForm");
  if (contactForm) {
    contactForm.addEventListener("submit", submitForm);
    attachValidation(contactForm);
  }

  var enrollForm = document.querySelector(".modal-box form");
  if (enrollForm) {
    enrollForm.addEventListener("submit", submitEnroll);
    attachValidation(enrollForm);
  }
}

function initSlider() {
  dots.forEach(function (dot, i) {
    dot.addEventListener("click", function () {
      goToSlide(i);
      resetSlider();
    });
  });
  startSlider();
}

window.addEventListener("scroll", function () {
  updateScrollProgress();
  updateBackToTop();
  updateActiveNav();
  if (!countersRun && window.scrollY < 400) {
    countersRun = true;
    animateCounters();
  }
});

document.addEventListener("DOMContentLoaded", function () {
  addRevealClasses();
  initNavigation();
  initForms();
  initSlider();
  initRevealObserver();
  updateActiveNav();
  updateScrollProgress();
  updateBackToTop();
  animateCounters();

  if (backToTop) {
    backToTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  if (modal) {
    modal.addEventListener("click", function (e) {
      if (e.target === modal) {
        closeModal();
      }
    });
  }

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      closeMenu();
      closeModal();
    }
  });

  var hexes = document.querySelectorAll(".hex");
  hexes.forEach(function (hex, i) {
    hex.style.animationDelay = 0.5 + i * 0.1 + "s";
    setInterval(function () {
      var y = Math.sin(Date.now() / 1000 + i) * 6;
      hex.style.transform = "translateY(" + y + "px)";
    }, 16);
  });
});
