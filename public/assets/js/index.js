/* =========================================================
   INDEX — Interatividade da landing page
   ========================================================= */

/**
 * Troca a aba ativa na seção de benefícios
 * @param {string} id  - ID do painel (ex: 'manager')
 * @param {HTMLElement} btn - Botão clicado
 */
function switchTab(id, btn) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'))
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'))
  document.getElementById('tab-' + id).classList.add('active')
  btn.classList.add('active')
}

/**
 * Abre/fecha um item do FAQ
 * @param {HTMLElement} el - Elemento .faq-q clicado
 */
function toggleFaq(el) {
  const item   = el.parentElement
  const isOpen = item.classList.contains('open')
  document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'))
  if (!isOpen) item.classList.add('open')
}

/**
 * Esconde a navbar ao rolar para baixo e exibe ao rolar para cima
 */
;(function initNavScroll() {
  let lastScroll = 0
  const nav = document.querySelector('nav')
  if (!nav) return

  window.addEventListener('scroll', () => {
    const curr = window.scrollY
    nav.style.transform = (curr > lastScroll && curr > 120)
      ? 'translateY(-100%)'
      : 'translateY(0)'
    lastScroll = curr
  }, { passive: true })
})()
