/**
 * Neural Network 3D Background
 * Canvas-based 3D visualization of AI neural network
 * Lightweight and performant alternative to Three.js
 */

import { useEffect, useRef } from 'react';

interface Node {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
}

interface Connection {
  from: number;
  to: number;
}

export function NeuralNetworkBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<Node[]>([]);
  const connectionsRef = useRef<Connection[]>([]);
  const animationRef = useRef<number>();
  const rotationRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize nodes (neural network nodes)
    const nodeCount = 30;
    const nodes: Node[] = [];
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: (Math.random() - 0.5) * 400,
        y: (Math.random() - 0.5) * 400,
        z: (Math.random() - 0.5) * 400,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        vz: (Math.random() - 0.5) * 2,
      });
    }
    nodesRef.current = nodes;

    // Initialize connections (random links between nodes)
    const connections: Connection[] = [];
    for (let i = 0; i < nodeCount; i++) {
      const connectionCount = Math.floor(Math.random() * 4) + 2;
      for (let j = 0; j < connectionCount; j++) {
        const target = Math.floor(Math.random() * nodeCount);
        if (target !== i) {
          connections.push({ from: i, to: target });
        }
      }
    }
    connectionsRef.current = connections;

    // 3D rotation matrices
    function rotateX(point: { x: number; y: number; z: number }, angle: number) {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      return {
        x: point.x,
        y: point.y * cos - point.z * sin,
        z: point.y * sin + point.z * cos,
      };
    }

    function rotateY(point: { x: number; y: number; z: number }, angle: number) {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      return {
        x: point.x * cos + point.z * sin,
        y: point.y,
        z: -point.x * sin + point.z * cos,
      };
    }

    function project(point: { x: number; y: number; z: number }, distance: number = 500) {
      const scale = distance / (distance + point.z);
      return {
        x: point.x * scale,
        y: point.y * scale,
        z: point.z,
        scale,
      };
    }

    // Animation loop
    const animate = () => {
      // Clear canvas with semi-transparent background for trail effect
      ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update rotation
      rotationRef.current.x += 0.0005;
      rotationRef.current.y += 0.0008;

      // Update and project nodes
      const projectedNodes = nodes.map((node) => {
        // Update position
        node.x += node.vx;
        node.y += node.vy;
        node.z += node.vz;

        // Bounce off boundaries
        if (Math.abs(node.x) > 200) node.vx *= -1;
        if (Math.abs(node.y) > 200) node.vy *= -1;
        if (Math.abs(node.z) > 200) node.vz *= -1;

        // Apply rotation
        let rotated = rotateX(node, rotationRef.current.x);
        rotated = rotateY(rotated, rotationRef.current.y);

        // Project to 2D
        const projected = project(rotated);

        return {
          x: canvas.width / 2 + projected.x,
          y: canvas.height / 2 + projected.y,
          z: rotated.z,
          scale: projected.scale,
        };
      });

      // Sort by z-depth (painter's algorithm)
      const sortedIndices = Array.from({ length: nodes.length }, (_, i) => i).sort(
        (a, b) => projectedNodes[a].z - projectedNodes[b].z
      );

      // Draw connections
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.15)';
      ctx.lineWidth = 1;
      connections.forEach((conn) => {
        const from = projectedNodes[conn.from];
        const to = projectedNodes[conn.to];

        // Only draw if both nodes are visible
        if (from && to) {
          ctx.beginPath();
          ctx.moveTo(from.x, from.y);
          ctx.lineTo(to.x, to.y);
          ctx.stroke();
        }
      });

      // Draw nodes
      sortedIndices.forEach((i) => {
        const node = projectedNodes[i];

        // Gradient for depth effect
        const brightness = Math.floor(100 + node.scale * 155);
        const alpha = 0.3 + node.scale * 0.7;

        // Draw glow
        const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, 8);
        gradient.addColorStop(0, `rgba(59, 130, 246, ${alpha * 0.6})`);
        gradient.addColorStop(1, `rgba(59, 130, 246, 0)`);
        ctx.fillStyle = gradient;
        ctx.fillRect(node.x - 8, node.y - 8, 16, 16);

        // Draw core node
        ctx.fillStyle = `rgba(59, 130, 246, ${alpha})`;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 2 + node.scale * 2, 0, Math.PI * 2);
        ctx.fill();

        // Draw bright center
        ctx.fillStyle = `rgba(191, 219, 254, ${alpha * 0.8})`;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 1 + node.scale * 1, 0, Math.PI * 2);
        ctx.fill();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{
        background: 'linear-gradient(135deg, #FFFFFF 0%, #F0F4FF 50%, #F0F9FF 100%)',
      }}
    />
  );
}
