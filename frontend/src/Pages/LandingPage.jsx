import React from "react";
import { Link } from "react-router-dom";
import AnnapurnaLogo from "../assets/annapurnaPlain.svg";

const LandingPage = () => {
	return (
		<div className="landing">
			<div className="landing__grain" aria-hidden="true" />
			<div className="landing__strip" aria-hidden="true" />

			<header className="landing__header">
				<div className="landing__header-links">
					<Link className="landing__signin" to="/login">
						Sign In
					</Link>
					<span className="landing__header-divider" aria-hidden="true">
						/
					</span>
					<Link className="landing__signin" to="/signup">
						Sign Up
					</Link>
				</div>
			</header>

			<main className="landing__content">
				<div className="landing__logo reveal" style={{ "--delay": "0ms" }}>
					<img
						src={AnnapurnaLogo}
						alt="Annapurna"
						className="landing__logo-image"
					/>
				</div>

				<h1 className="landing__brand reveal" style={{ "--delay": "180ms" }}>
					AnnaPurna
				</h1>
				<p className="landing__tagline reveal" style={{ "--delay": "320ms" }}>
					Surplus Food, Shared.
				</p>

				<div className="landing__rule reveal" style={{ "--delay": "420ms" }} />

				<p className="landing__description reveal" style={{ "--delay": "520ms" }}>
					"Bridging the gap between abundance and hunger — one meal at a time."
				</p>

				<div className="landing__cta-group reveal" style={{ "--delay": "700ms" }}>
					<Link className="landing__cta" to="/login">
						Enter
						<span className="landing__cta-arrow">-&gt;</span>
					</Link>
					<Link className="landing__cta landing__cta--ghost" to="/signup">
						Create Account
					</Link>
				</div>
			</main>

			<style>{`
				@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500;1,600&family=Noto+Serif+Devanagari:wght@400;500;600&family=Sora:wght@300;400;500;600&display=swap');

				:root {
					--earth-cream: #f5f0e8;
					--earth-olive: #6b7a2a;
					--earth-terracotta: #c8602a;
					--earth-brown: #3d2b1f;
				}

				.landing {
					min-height: 100vh;
					background: radial-gradient(circle at top, #f9f4ec 0%, var(--earth-cream) 60%, #efe7da 100%);
					color: var(--earth-brown);
					display: flex;
					flex-direction: column;
					align-items: center;
					justify-content: center;
					position: relative;
					overflow: hidden;
					padding: 48px 24px 120px;
				}

				.landing__grain {
					position: absolute;
					inset: 0;
					background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140' viewBox='0 0 140 140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E");
					mix-blend-mode: multiply;
					opacity: 0.35;
					pointer-events: none;
				}

				.landing__strip {
					position: absolute;
					bottom: 0;
					left: 0;
					right: 0;
					height: 100px;
					background: linear-gradient(90deg, rgba(200, 96, 42, 0.18), rgba(107, 122, 42, 0.2));
					clip-path: polygon(0 35%, 10% 45%, 20% 40%, 30% 52%, 40% 45%, 50% 58%, 60% 50%, 70% 62%, 80% 52%, 90% 60%, 100% 55%, 100% 100%, 0 100%);
					opacity: 0.7;
				}

				.landing__header {
					position: absolute;
					top: 24px;
					right: 28px;
					z-index: 2;
				}

				.landing__header-links {
					display: flex;
					align-items: center;
					gap: 10px;
				}

				.landing__signin {
					font-family: 'Sora', sans-serif;
					font-size: 0.88rem;
					letter-spacing: 0.12em;
					text-transform: uppercase;
					color: rgba(61, 43, 31, 0.65);
					text-decoration: none;
					transition: color 200ms ease;
				}

				.landing__header-divider {
					color: rgba(61, 43, 31, 0.45);
					font-size: 0.9rem;
				}

				.landing__signin:hover {
					color: var(--earth-terracotta);
				}

				.landing__content {
					position: relative;
					z-index: 1;
					text-align: center;
					max-width: 720px;
					display: flex;
					flex-direction: column;
					align-items: center;
					gap: 14px;
				}

				.landing__logo {
					width: 92px;
					height: 92px;
					border-radius: 999px;
					border: 1px solid rgba(107, 122, 42, 0.4);
					display: grid;
					place-items: center;
					margin-bottom: 16px;
					background: rgba(245, 240, 232, 0.9);
					box-shadow: 0 12px 30px rgba(61, 43, 31, 0.08);
				}

				.landing__logo-image {
					width: 72px;
					height: 72px;
					object-fit: contain;
				}

				.landing__brand {
					font-family: 'Noto Serif Devanagari', 'Sora', sans-serif;
					font-size: clamp(2.6rem, 5vw, 4.1rem);
					letter-spacing: 0.36em;
					text-transform: uppercase;
					color: var(--earth-olive);
					margin: 0;
				}

				.landing__tagline {
					font-family: 'Sora', sans-serif;
					font-size: 0.95rem;
					letter-spacing: 0.22em;
					text-transform: uppercase;
					color: rgba(107, 122, 42, 0.8);
					margin: 0;
				}

				.landing__rule {
					width: min(340px, 70vw);
					height: 1px;
					background: rgba(200, 96, 42, 0.6);
					margin: 6px 0 8px;
				}

				.landing__description {
					font-family: 'Cormorant Garamond', serif;
					font-style: italic;
					font-size: clamp(1.4rem, 2.6vw, 2.1rem);
					line-height: 1.5;
					color: var(--earth-brown);
					margin: 4px 0 8px;
				}

				.landing__cta-group {
					display: flex;
					flex-wrap: wrap;
					align-items: center;
					justify-content: center;
					gap: 12px;
				}

				.landing__cta {
					font-family: 'Sora', sans-serif;
					font-size: 0.98rem;
					letter-spacing: 0.2em;
					text-transform: uppercase;
					text-decoration: none;
					color: var(--earth-olive);
					display: inline-flex;
					align-items: center;
					gap: 12px;
					padding: 10px 18px;
					border-radius: 999px;
					position: relative;
					cursor: pointer;
					transition: color 220ms ease;
				}

				.landing__cta::after {
					content: "";
					position: absolute;
					bottom: 2px;
					left: 14px;
					width: calc(100% - 28px);
					height: 1px;
					background: var(--earth-terracotta);
					transform: scaleX(0);
					transform-origin: left;
					transition: transform 220ms ease;
				}

				.landing__cta::before {
					content: "";
					position: absolute;
					inset: -10px;
					border-radius: 999px;
					border: 1px solid rgba(200, 96, 42, 0.2);
					transform: scale(0);
					transition: transform 220ms ease;
				}

				.landing__cta:hover {
					color: var(--earth-terracotta);
				}

				.landing__cta:hover::after {
					transform: scaleX(1);
				}

				.landing__cta:hover::before {
					transform: scale(1);
				}

				.landing__cta-arrow {
					display: inline-block;
					transition: transform 220ms ease;
				}

				.landing__cta:hover .landing__cta-arrow {
					transform: translateX(6px);
				}

				.landing__cta--ghost {
					color: rgba(61, 43, 31, 0.72);
					letter-spacing: 0.12em;
					text-transform: none;
					padding: 10px 16px;
				}

				.landing__cta--ghost::after,
				.landing__cta--ghost::before {
					display: none;
				}

				.landing__cta--ghost:hover {
					color: var(--earth-terracotta);
				}

				.reveal {
					opacity: 0;
					transform: translateY(14px);
					animation: reveal 700ms ease forwards;
					animation-delay: var(--delay);
				}

				@keyframes reveal {
					to {
						opacity: 1;
						transform: translateY(0);
					}
				}

				@media (max-width: 720px) {
					.landing {
						padding: 40px 18px 120px;
					}

					.landing__header {
						top: 18px;
						right: 18px;
					}

					.landing__logo {
						width: 76px;
						height: 76px;
					}

					.landing__logo-image {
						width: 56px;
						height: 56px;
					}

					.landing__brand {
						letter-spacing: 0.22em;
					}

					.landing__tagline {
						font-size: 0.82rem;
					}
				}

				@media (prefers-reduced-motion: reduce) {
					.reveal {
						animation: none;
						opacity: 1;
						transform: none;
					}

					.landing__cta::after,
					.landing__cta::before,
					.landing__cta-arrow {
						transition: none;
					}
				}
			`}</style>
		</div>
	);
};

export default LandingPage;
