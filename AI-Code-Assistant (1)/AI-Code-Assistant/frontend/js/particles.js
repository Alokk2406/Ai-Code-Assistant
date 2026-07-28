/* Lightweight floating-particle ambient background. No dependencies. */
(function () {
  const canvas = document.getElementById('particles');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let particles = [];
  const COLORS = ['rgba(59,130,246,0.55)', 'rgba(34,211,238,0.55)', 'rgba(168,85,247,0.5)'];

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function spawn(count) {
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.8 + 0.6,
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.15,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    }));
  }

  function tick() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    }
    requestAnimationFrame(tick);
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.addEventListener('resize', () => { resize(); spawn(Math.floor((canvas.width * canvas.height) / 22000)); });
  resize();
  spawn(Math.floor((canvas.width * canvas.height) / 22000));
  if (!reduceMotion) requestAnimationFrame(tick);
})();
