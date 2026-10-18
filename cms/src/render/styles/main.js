/* 静态站点交互：Swiper 轮播 + 移动端导航（纯静态，无框架） */
(function () {
  function initSliders() {
    if (typeof Swiper === 'undefined') return
    document.querySelectorAll('.memory-swiper').forEach(function (el) {
      var slides = el.querySelectorAll('.swiper-slide').length
      if (!slides) return
      if (el.__swiperReady && el.__swiperCount === slides) return
      if (el.swiper) { try { el.swiper.destroy(true, false) } catch (e) { /* noop */ } }
      el.__swiperReady = true
      el.__swiperCount = slides
      // loop 模式至少需要 3 张，1-2 张时降级为单图/平移。
      var perView = slides >= 3 ? 2 : 1
      new Swiper(el, {
        slidesPerView: perView,
        centeredSlides: slides > 1,
        loop: slides >= 3,
        grabCursor: true,
        watchOverflow: true,
        navigation: { nextEl: '.memory-swiper .next', prevEl: '.memory-swiper .prev' },
        breakpoints: slides >= 3 ? { 320: { slidesPerView: 1 }, 900: { slidesPerView: 2 } } : undefined,
      })
    })
  }

  function initNav() {
    var toggle = document.querySelector('.nav-toggle')
    var nav = document.querySelector('.nav')
    if (!toggle || !nav || toggle.__navReady) return
    toggle.__navReady = true
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('nav--open')
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false')
    })
  }

  function init() { initSliders(); initNav() }
  window.__zhSiteInit = init
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init)
  else init()
})()

