/**
 * GlowNoiseBackground — 方案B
 * 渐变光晕 + SVG 噪点纹理 + 浮动光斑动画
 * 纯 CSS + SVG，无 Canvas，无 JS 动画循环
 */
export function GlowNoiseBackground() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      {/* ── 底层渐变 ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(135deg, #e8f4ff 0%, #eef2ff 40%, #f0fafb 70%, #f5f0ff 100%)",
        }}
      />

      {/* ── SVG 噪点纹理叠加 ── */}
      <svg
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          opacity: 0.18,
        }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <filter id="noise-filter">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.72"
            numOctaves="4"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#noise-filter)" />
      </svg>

      {/* ── 光晕 1：左上蓝色大光斑 ── */}
      <div
        style={{
          position: "absolute",
          top: "-20%",
          left: "-10%",
          width: "55%",
          paddingBottom: "55%",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(96,165,250,0.35) 0%, transparent 70%)",
          animation: "glow-drift-1 12s ease-in-out infinite",
        }}
      />

      {/* ── 光晕 2：右侧紫色中光斑 ── */}
      <div
        style={{
          position: "absolute",
          top: "-10%",
          right: "-8%",
          width: "42%",
          paddingBottom: "42%",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(167,139,250,0.28) 0%, transparent 70%)",
          animation: "glow-drift-2 15s ease-in-out infinite",
        }}
      />

      {/* ── 光晕 3：底部中央青色小光斑 ── */}
      <div
        style={{
          position: "absolute",
          bottom: "-15%",
          left: "35%",
          width: "35%",
          paddingBottom: "35%",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(34,211,238,0.22) 0%, transparent 70%)",
          animation: "glow-drift-3 18s ease-in-out infinite",
        }}
      />

      {/* ── 光晕 4：右下蓝色小光斑 ── */}
      <div
        style={{
          position: "absolute",
          bottom: "-5%",
          right: "10%",
          width: "28%",
          paddingBottom: "28%",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%)",
          animation: "glow-drift-1 20s ease-in-out infinite reverse",
        }}
      />

      {/* ── 顶部高光线条 ── */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "1px",
          background:
            "linear-gradient(90deg, transparent 0%, rgba(99,155,255,0.6) 30%, rgba(167,139,250,0.6) 60%, transparent 100%)",
        }}
      />

      {/* ── 内嵌 keyframe 动画 ── */}
      <style>{`
        @keyframes glow-drift-1 {
          0%   { transform: translate(0, 0) scale(1); }
          33%  { transform: translate(4%, 6%) scale(1.06); }
          66%  { transform: translate(-3%, 3%) scale(0.96); }
          100% { transform: translate(0, 0) scale(1); }
        }
        @keyframes glow-drift-2 {
          0%   { transform: translate(0, 0) scale(1); }
          40%  { transform: translate(-5%, 4%) scale(1.08); }
          70%  { transform: translate(3%, -3%) scale(0.94); }
          100% { transform: translate(0, 0) scale(1); }
        }
        @keyframes glow-drift-3 {
          0%   { transform: translate(0, 0) scale(1); }
          50%  { transform: translate(-4%, -5%) scale(1.1); }
          100% { transform: translate(0, 0) scale(1); }
        }
      `}</style>
    </div>
  );
}
