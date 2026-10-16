/* 静态站点交互：Swiper 轮播（纯静态，无框架） */
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
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initSliders)
  else initSliders()
})()
