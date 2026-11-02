/* 静态站点交互：Swiper 轮播 + 移动端导航（纯静态，无框架） */
(function () {
  function initSliders() {
    if (typeof Swiper === 'undefined') return
    document.querySelectorAll('.memory-swiper').forEach(function (el) {
      new Swiper(el, {
        slidesPerView: 2,
        centeredSlides: true,
        loop: true,
        grabCursor: true,
        watchOverflow: false,
        navigation: { nextEl: '.memory-swiper .next', prevEl: '.memory-swiper .prev' },
        breakpoints: { 320: { slidesPerView: 1 }, 900: { slidesPerView: 2 } },
      })
    })
  }

  function initNav() {
    var toggle = document.querySelector('.nav-toggle')
    var nav = document.querySelector('.nav')
    if (!toggle || !nav) return
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('nav--open')
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false')
    })
  }

  function init() { initSliders(); initNav() }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init)
  else init()
})()

