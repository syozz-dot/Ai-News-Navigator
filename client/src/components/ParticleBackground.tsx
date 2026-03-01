import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
}

export function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const PARTICLE_COUNT = 80;
    const MAX_DIST = 130;
    const MOUSE_RADIUS = 160;

    let width = 0;
    let height = 0;

    // Use a mutable state object to avoid stale closure issues with animId
    const state = {
      animId: 0,
      running: false,
      particles: [] as Particle[],
      mouse: { x: -9999, y: -9999 },
    };

    function resize() {
      const parent = canvas!.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      width = rect.width > 0 ? rect.width : window.innerWidth;
      height = rect.height > 0 ? rect.height : 320;
      canvas!.width = width;
      canvas!.height = height;
    }

    function createParticle(): Particle {
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.55,
        vy: (Math.random() - 0.5) * 0.55,
        radius: Math.random() * 1.8 + 0.8,
        opacity: Math.random() * 0.45 + 0.2,
      };
    }

    function initParticles() {
      state.particles = Array.from({ length: PARTICLE_COUNT }, createParticle);
    }

    function tick() {
      // Schedule next frame FIRST — this ensures the loop never silently dies
      state.animId = requestAnimationFrame(tick);

      ctx!.clearRect(0, 0, width, height);

      const { particles, mouse } = state;

      for (const p of particles) {
        // Mouse attraction
        const mdx = mouse.x - p.x;
        const mdy = mouse.y - p.y;
        const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
        if (mdist < MOUSE_RADIUS && mdist > 0.5) {
          const force = ((MOUSE_RADIUS - mdist) / MOUSE_RADIUS) * 0.04;
          p.vx += (mdx / mdist) * force;
          p.vy += (mdy / mdist) * force;
        }

        // Damping
        p.vx *= 0.975;
        p.vy *= 0.975;

        // Speed cap
        const spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (spd > 1.6) {
          p.vx = (p.vx / spd) * 1.6;
          p.vy = (p.vy / spd) * 1.6;
        }

        // Minimum drift — prevents particles from fully stopping
        if (spd < 0.08) {
          p.vx += (Math.random() - 0.5) * 0.12;
          p.vy += (Math.random() - 0.5) * 0.12;
        }

        p.x += p.vx;
        p.y += p.vy;

        // Wrap edges
        if (p.x < -5) p.x = width + 5;
        else if (p.x > width + 5) p.x = -5;
        if (p.y < -5) p.y = height + 5;
        else if (p.y > height + 5) p.y = -5;

        // Draw dot
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(59,130,246,${p.opacity})`;
        ctx!.fill();
      }

      // Draw particle-to-particle connection lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < MAX_DIST) {
            ctx!.beginPath();
            ctx!.moveTo(a.x, a.y);
            ctx!.lineTo(b.x, b.y);
            ctx!.strokeStyle = `rgba(99,155,255,${(1 - d / MAX_DIST) * 0.28})`;
            ctx!.lineWidth = 0.7;
            ctx!.stroke();
          }
        }

        // Mouse connection lines
        const p = particles[i];
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < MOUSE_RADIUS) {
          ctx!.beginPath();
          ctx!.moveTo(p.x, p.y);
          ctx!.lineTo(mouse.x, mouse.y);
          ctx!.strokeStyle = `rgba(59,130,246,${(1 - d / MOUSE_RADIUS) * 0.55})`;
          ctx!.lineWidth = 0.9;
          ctx!.stroke();
        }
      }
    }

    function startLoop() {
      if (state.running) return;
      state.running = true;
      state.animId = requestAnimationFrame(tick);
    }

    function stopLoop() {
      state.running = false;
      cancelAnimationFrame(state.animId);
    }

    // Resume animation when tab becomes visible again after being hidden
    function onVisibilityChange() {
      if (document.visibilityState === "visible") {
        stopLoop();
        state.running = false;
        startLoop();
      } else {
        stopLoop();
      }
    }

    // Mouse tracking on the canvas element
    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas!.getBoundingClientRect();
      state.mouse.x = e.clientX - rect.left;
      state.mouse.y = e.clientY - rect.top;
    };
    const onMouseLeave = () => {
      state.mouse.x = -9999;
      state.mouse.y = -9999;
    };

    // Keep canvas size in sync with parent
    const ro = new ResizeObserver(() => {
      resize();
    });
    ro.observe(canvas.parentElement!);

    // Bootstrap
    resize();
    initParticles();
    startLoop();

    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseleave", onMouseLeave);
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("resize", resize);

    return () => {
      stopLoop();
      ro.disconnect();
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        display: "block",
      }}
    />
  );
}
