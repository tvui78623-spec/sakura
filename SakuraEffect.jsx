import React, { useEffect, useRef } from 'react';

const SakuraEffect = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    class Petal {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height - canvas.height;
        this.size = Math.random() * 4 + 3;
        this.speedX = Math.random() * 1.5 - 0.5;
        this.speedY = Math.random() * 1.2 + 0.8;
        this.opacity = Math.random() * 0.5 + 0.2;
        this.flip = Math.random();
        this.flipSpeed = Math.random() * 0.03;
      }

      update() {
        this.x += this.speedX + Math.sin(this.y / 30) * 0.5;
        this.y += this.speedY;
        this.flip += this.flipSpeed;

        if (this.y > canvas.height || this.x > canvas.width || this.x < 0) {
          this.x = Math.random() * canvas.width;
          this.y = -20;
          this.speedX = Math.random() * 1.5 - 0.5;
          this.speedY = Math.random() * 1.2 + 0.8;
        }
      }

      draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.flip);
        ctx.scale(Math.sin(this.flip), 1);
        ctx.fillStyle = `rgba(255, 183, 197, ${this.opacity})`;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.size, this.size / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    const petalsCount = 40;
    const petalsArray = Array.from({ length: petalsCount }, () => new Petal());

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      petalsArray.forEach((petal) => {
        petal.update();
        petal.draw();
      });
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full pointer-events-none z-0"
      style={{ opacity: 0.85 }}
    />
  );
};

export default SakuraEffect;
