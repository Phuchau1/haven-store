'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import Link from 'next/link';
import { ArrowUpRight, Sparkles, Shield, Compass, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Interactive3DBanner() {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        // 1. Scene & Camera Setup
        const scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x06080e, 0.04);

        const camera = new THREE.PerspectiveCamera(
            50,
            container.clientWidth / container.clientHeight,
            0.1,
            1000
        );
        camera.position.z = 7;

        // 2. WebGL Renderer with Anti-aliasing
        let renderer: THREE.WebGLRenderer | null = null;
        try {
            renderer = new THREE.WebGLRenderer({
                canvas,
                alpha: true,
                antialias: true,
                powerPreference: 'high-performance',
            });
            renderer.setSize(container.clientWidth, container.clientHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
            renderer.toneMappingExposure = 1.3;
        } catch {
            return;
        }

        // 3. Central 3D Geometry: High-end Torus Knot (Fashion Silk/Metal Ring)
        const geometry = new THREE.TorusKnotGeometry(1.6, 0.42, 160, 32, 2, 3);
        const wireframeGeometry = new THREE.TorusKnotGeometry(1.65, 0.44, 80, 16, 2, 3);

        // Luxury Gold & Obsidian Material
        const material = new THREE.MeshPhysicalMaterial({
            color: 0xd4af37, // Royal Gold
            emissive: 0x1a1202,
            roughness: 0.18,
            metalness: 0.92,
            clearcoat: 0.8,
            clearcoatRoughness: 0.15,
            wireframe: false,
        });

        const wireframeMaterial = new THREE.MeshBasicMaterial({
            color: 0xffdf78,
            wireframe: true,
            transparent: true,
            opacity: 0.12,
        });

        const torusKnot = new THREE.Mesh(geometry, material);
        const wireframeKnot = new THREE.Mesh(wireframeGeometry, wireframeMaterial);
        torusKnot.add(wireframeKnot);
        scene.add(torusKnot);

        // 4. Shimmering Particle Galaxy
        const particleCount = 600;
        const particlePositions = new Float32Array(particleCount * 3);
        const particleScales = new Float32Array(particleCount);

        for (let i = 0; i < particleCount * 3; i += 3) {
            particlePositions[i] = (Math.random() - 0.5) * 16;
            particlePositions[i + 1] = (Math.random() - 0.5) * 12;
            particlePositions[i + 2] = (Math.random() - 0.5) * 12;
            particleScales[i / 3] = Math.random() * 0.08 + 0.02;
        }

        const particleGeometry = new THREE.BufferGeometry();
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

        const particleMaterial = new THREE.PointsMaterial({
            color: 0xd4af37,
            size: 0.05,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending,
        });

        const particles = new THREE.Points(particleGeometry, particleMaterial);
        scene.add(particles);

        // 5. Dynamic Lighting (Studio Fashion Keylights)
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        scene.add(ambientLight);

        const goldLight = new THREE.PointLight(0xffb703, 50, 25);
        goldLight.position.set(4, 4, 4);
        scene.add(goldLight);

        const cyanFillLight = new THREE.PointLight(0x00f5d4, 30, 25);
        cyanFillLight.position.set(-5, -3, 3);
        scene.add(cyanFillLight);

        const rimLight = new THREE.DirectionalLight(0xffffff, 2.5);
        rimLight.position.set(0, 8, -4);
        scene.add(rimLight);

        // 6. Smooth Mouse Parallax Physics
        let targetX = 0;
        let targetY = 0;
        let mouseX = 0;
        let mouseY = 0;

        const onMouseMove = (e: MouseEvent) => {
            const rect = container.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;
            targetX = x * 2.2;
            targetY = y * 2.2;
        };

        const onTouchMove = (e: TouchEvent) => {
            if (e.touches.length > 0) {
                const rect = container.getBoundingClientRect();
                const x = (e.touches[0].clientX - rect.left) / rect.width - 0.5;
                const y = (e.touches[0].clientY - rect.top) / rect.height - 0.5;
                targetX = x * 2;
                targetY = y * 2;
            }
        };

        window.addEventListener('mousemove', onMouseMove, { passive: true });
        window.addEventListener('touchmove', onTouchMove, { passive: true });

        // 7. Responsive Resize Handler
        const handleResize = () => {
            if (!container || !renderer) return;
            const width = container.clientWidth;
            const height = container.clientHeight;
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
        };

        window.addEventListener('resize', handleResize);

        // 8. Performance Optimizer: Only render when visible in viewport
        let isVisible = true;
        const observer = new IntersectionObserver(
            ([entry]) => {
                isVisible = entry.isIntersecting;
            },
            { threshold: 0.05 }
        );
        observer.observe(container);

        // 9. Animation Loop (60 FPS)
        let animationFrameId: number;
        const clock = new THREE.Clock();

        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);
            if (!isVisible) return;

            const elapsedTime = clock.getElapsedTime();

            // Smooth damping
            mouseX += (targetX - mouseX) * 0.05;
            mouseY += (targetY - mouseY) * 0.05;

            // Rotate 3D Torus Knot
            torusKnot.rotation.x = elapsedTime * 0.35 + mouseY * 0.6;
            torusKnot.rotation.y = elapsedTime * 0.45 + mouseX * 0.8;
            torusKnot.position.y = Math.sin(elapsedTime * 1.2) * 0.15;

            // Subtle camera sway
            camera.position.x = mouseX * 0.7;
            camera.position.y = -mouseY * 0.7;
            camera.lookAt(0, 0, 0);

            // Rotate particles slowly
            particles.rotation.y = elapsedTime * 0.04;
            particles.rotation.x = elapsedTime * 0.02;

            renderer?.render(scene, camera);
        };

        animate();

        // 10. Cleanup
        return () => {
            observer.disconnect();
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('touchmove', onTouchMove);
            window.removeEventListener('resize', handleResize);
            geometry.dispose();
            wireframeGeometry.dispose();
            material.dispose();
            wireframeMaterial.dispose();
            particleGeometry.dispose();
            particleMaterial.dispose();
            renderer?.dispose();
        };
    }, []);

    return (
        <section
            ref={containerRef}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="relative w-full h-[520px] sm:h-[580px] lg:h-[640px] overflow-hidden bg-gradient-to-b from-[#06080e] via-[#090d16] to-[#04060a] border-y border-amber-500/20 select-none"
        >
            {/* 3D WebGL Canvas Layer */}
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none z-10"
            />

            {/* Ambient Gradient Glows */}
            <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-amber-500/10 blur-[120px] pointer-events-none" />
            <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />

            {/* Foreground Content Overlay */}
            <div className="container-torano relative z-20 h-full flex flex-col justify-between py-12 sm:py-16">
                
                {/* Top Badge */}
                <div className="flex items-center justify-between">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-amber-400/30 backdrop-blur-md shadow-lg shadow-amber-900/20">
                        <Sparkles size={14} className="text-amber-400 animate-pulse" />
                        <span className="text-[11px] sm:text-xs font-bold tracking-[2.5px] uppercase text-amber-200">
                            HAVEN 3D COUTURE • CAPSULE 2026
                        </span>
                    </div>

                    <div className="hidden sm:flex items-center gap-6 text-xs text-white/50 tracking-wider">
                        <span className="flex items-center gap-1.5"><Shield size={13} className="text-amber-400" /> Vải dệt thủ công</span>
                        <span className="flex items-center gap-1.5"><Compass size={13} className="text-amber-400" /> Phom dáng độc quyền</span>
                    </div>
                </div>

                {/* Main Center Typography */}
                <div className="max-w-2xl">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-3xl sm:text-5xl lg:text-6xl font-black text-white uppercase tracking-tight leading-[1.1] mb-4"
                    >
                        Nghệ Thuật <br />
                        <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 bg-clip-text text-transparent">
                            Điêu Khắc Không Gian
                        </span>
                    </motion.h2>

                    <p className="text-sm sm:text-base text-gray-300 font-light leading-relaxed mb-8 max-w-lg">
                        Khám phá công nghệ dệt may tương lai kết hợp cảm hứng hình học đương đại. Từng thớ vải được tuyển chọn chuẩn mực thời trang cao cấp.
                    </p>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-4">
                        <Link
                            href="/products?category=ao-nam"
                            className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
                        >
                            <span>Khám Phá Bộ Sưu Tập</span>
                            <ArrowUpRight size={16} strokeWidth={2.5} />
                        </Link>

                        <Link
                            href="/about"
                            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-white/10 hover:bg-white/15 text-white font-semibold text-xs sm:text-sm border border-white/20 backdrop-blur-md transition-all duration-300 cursor-pointer"
                        >
                            <Zap size={14} className="text-amber-300" />
                            <span>Triết Lý Thương Hiệu</span>
                        </Link>
                    </div>
                </div>

                {/* Bottom Interactive Hint */}
                <div className="flex items-center justify-between pt-4 border-t border-white/10 text-[11px] text-gray-400 tracking-wider">
                    <span className="hidden sm:inline">Di chuyển chuột hoặc chạm màn hình để tương tác 3D WebGL</span>
                    <span className="text-amber-400/80 font-mono">HAVEN • ARCHIVE NO. 01</span>
                </div>
            </div>
        </section>
    );
}