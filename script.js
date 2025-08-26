// DOM Elements
const navbar = document.getElementById("navbar")
const mobileMenu = document.getElementById("mobile-menu")
const navMenu = document.getElementById("nav-menu")
const contactForm = document.getElementById("contact-form")
const galleryGrid = document.getElementById("gallery-grid")
const filterBtns = document.querySelectorAll(".filter-btn")
const lightbox = document.getElementById("lightbox")
const lightboxImg = document.getElementById("lightbox-img")
const lightboxCaption = document.getElementById("lightbox-caption")
const lightboxClose = document.querySelector(".lightbox-close")
const fileInput = document.getElementById("attachment")
const fileLabel = document.querySelector(".file-label")
const originalLabelText = fileLabel ? fileLabel.textContent : ""

// Mobile Navigation Toggle
if (mobileMenu && navMenu) {
  mobileMenu.addEventListener("click", () => {
    mobileMenu.classList.toggle("active")
    navMenu.classList.toggle("active")
  })

  // Close mobile menu when clicking on a link
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      mobileMenu.classList.remove("active")
      navMenu.classList.remove("active")
    })
  })
}

// Navbar scroll effect
if (navbar) {
  window.addEventListener("scroll", () => {
    if (window.scrollY > 100) {
      navbar.classList.add("scrolled")
    } else {
      navbar.classList.remove("scrolled")
    }
  })
}

// Set active navigation link based on current page
document.addEventListener("DOMContentLoaded", () => {
  const currentPage = window.location.pathname.split("/").pop() || "index.html"
  const navLinks = document.querySelectorAll(".nav-link")

  navLinks.forEach((link) => {
    link.classList.remove("active")
    const linkHref = link.getAttribute("href")

    // Check if current page matches the link
    if ((currentPage === "index.html" || currentPage === "") && linkHref === "index.html") {
      link.classList.add("active")
    } else if (currentPage === linkHref) {
      link.classList.add("active")
    }
  })
})

// Gallery filtering (only if gallery elements exist)
if (filterBtns.length > 0 && galleryGrid) {
  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      // Remove active class from all buttons
      filterBtns.forEach((b) => b.classList.remove("active"))
      // Add active class to clicked button
      btn.classList.add("active")

      const filterValue = btn.getAttribute("data-filter")
      const galleryItems = document.querySelectorAll(".gallery-item")

      galleryItems.forEach((item) => {
        if (filterValue === "all" || item.getAttribute("data-category") === filterValue) {
          item.style.display = "block"
          item.style.animation = "fadeInUp 0.5s ease"
        } else {
          item.style.display = "none"
        }
      })
    })
  })
}

// Gallery lightbox (only if lightbox elements exist)
if (lightbox && lightboxImg && lightboxCaption) {
  const galleryItems = document.querySelectorAll(".gallery-item")
  galleryItems.forEach((item) => {
    item.addEventListener("click", () => {
      const img = item.querySelector("img")
      const overlay = item.querySelector(".gallery-overlay")
      const title = overlay.querySelector("h4").textContent
      const description = overlay.querySelector("p").textContent

      lightboxImg.src = img.src
      lightboxCaption.innerHTML = `<h4>${title}</h4><p>${description}</p>`
      lightbox.style.display = "block"
      document.body.style.overflow = "hidden"
    })
  })

  // Close lightbox
  if (lightboxClose) {
    lightboxClose.addEventListener("click", closeLightbox)
  }

  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) {
      closeLightbox()
    }
  })

  function closeLightbox() {
    lightbox.style.display = "none"
    document.body.style.overflow = "auto"
  }

  // Keyboard navigation for lightbox
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && lightbox.style.display === "block") {
      closeLightbox()
    }
  })
}

// Contact form validation and submission (only if form exists)
if (contactForm) {
  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault()

    // Clear previous errors
    document.querySelectorAll(".error-message").forEach((error) => {
      error.textContent = ""
    })

    let isValid = true

    // Get form data
    const formData = new FormData(contactForm)
    const name = formData.get("name").trim()
    const email = formData.get("email").trim()
    const phone = formData.get("phone").trim()
    const message = formData.get("message").trim()

    // Validate name
    if (name.length < 2) {
      document.getElementById("name-error").textContent = "Моля, въведете валидно име (минимум 2 символа)"
      isValid = false
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      document.getElementById("email-error").textContent = "Моля, въведете валиден имейл адрес"
      isValid = false
    }

    // Validate phone (optional but if provided, should be valid)
    if (phone && phone.length < 10) {
      document.getElementById("phone-error").textContent = "Моля, въведете валиден телефонен номер"
      isValid = false
    }

    // Validate message
    if (message.length < 10) {
      document.getElementById("message-error").textContent = "Моля, въведете съобщение (минимум 10 символа)"
      isValid = false
    }

    if (isValid) {
      const submitBtn = contactForm.querySelector('button[type="submit"]')
      const originalText = submitBtn.textContent
      submitBtn.textContent = "Изпращане..."
      submitBtn.disabled = true

      try {
        const response = await fetch("send_contact.php", {
          method: "POST",
          body: formData,
        })

        const result = await response.json()

        if (result.success) {
          // Success message
          alert("Благодарим ви! Вашето съобщение беше изпратено успешно. Ще се свържем с вас скоро.")
          contactForm.reset()

          // Reset file label
          if (fileLabel) {
            fileLabel.textContent = originalLabelText
            fileLabel.style.color = ""
          }
        } else {
          // Show errors
          if (result.errors && result.errors.length > 0) {
            result.errors.forEach((error) => {
              // Show first error in a general error area or alert
              alert("Грешка: " + error)
            })
          }
        }
      } catch (error) {
        console.error("[v0] Form submission error:", error)
        alert("Възникна грешка при изпращане на съобщението. Моля, опитайте отново или се свържете с нас директно.")
      } finally {
        submitBtn.textContent = originalText
        submitBtn.disabled = false
      }
    }
  })
}

// Scroll animations
const observerOptions = {
  threshold: 0.1,
  rootMargin: "0px 0px -50px 0px",
}

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible")
    }
  })
}, observerOptions)

// Add fade-in class to elements that should animate
document.addEventListener("DOMContentLoaded", () => {
  const animateElements = document.querySelectorAll(
    ".service-card, .team-member, .gallery-item, .about-text, .about-image",
  )
  animateElements.forEach((el) => {
    el.classList.add("fade-in")
    observer.observe(el)
  })
})

// Smooth scrolling is no longer needed for separate page navigation

// Loading animation
window.addEventListener("load", () => {
  document.body.classList.add("loaded")
})

// File upload feedback (only if file input exists)
if (fileInput && fileLabel) {
  fileInput.addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
      const fileName = e.target.files[0].name
      fileLabel.textContent = `Избран файл: ${fileName}`
      fileLabel.style.color = "#c17a5b"
    } else {
      fileLabel.textContent = originalLabelText
      fileLabel.style.color = ""
    }
  })
}

// Add hover effects to buttons
document.querySelectorAll(".btn").forEach((btn) => {
  btn.addEventListener("mouseenter", function () {
    this.style.transform = "translateY(-2px)"
  })

  btn.addEventListener("mouseleave", function () {
    this.style.transform = "translateY(0)"
  })
})

// Console log for debugging
console.log("[v0] АИДА СТИЛ website loaded successfully")
console.log("[v0] All interactive features initialized")
console.log("[v0] Current page:", window.location.pathname)
