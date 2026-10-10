import React from "react";

const LandingStyles = () => {
    return (
        <style>{`
        @keyframes bounce-button {
          0%, 100% {
            transform: translateY(0);
          }
          25% {
            transform: translateY(-10px);
          }
          50% {
            transform: translateY(0);
          }
          75% {
            transform: translateY(-5px);
          }
        }
        .animate-bounce-button {
          animation: bounce-button 2s ease-in-out infinite;
        }
        .hero-btn-icon {
          width: 1.8rem;
          height: 2.5rem;
          margin-left: 0.75rem;
          display: inline-block;
          vertical-align: middle;
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
          animation-fill-mode: forwards;
        }
        .animate-fade-in-up-delay {
          animation: fadeInUp 0.8s ease-out 0.2s forwards;
          animation-fill-mode: forwards;
        }
        .animate-fade-in-up-delay-2 {
          animation: fadeInUp 0.8s ease-out 0.4s forwards;
          animation-fill-mode: forwards;
        }
        .animate-fade-in-up-delay-3 {
          animation: fadeInUp 0.8s ease-out 0.6s forwards;
          animation-fill-mode: forwards;
        }
        .animate-fade-in-up-delay-4 {
          animation: fadeInUp 0.8s ease-out 0.8s forwards;
          animation-fill-mode: forwards;
        }
        .animate-fade-in-up-slow {
          animation: fadeInUp 1.2s ease-out forwards;
          animation-fill-mode: forwards;
        }
        .ribbon-wrapper {
          position: absolute;
          top: -10px;
          right: -10px;
          width: 180px;
          height: 180px;
          overflow: visible;
          z-index: 10;
          pointer-events: none;
        }
        .ribbon {
          position: absolute;
          top: 35px;
          right: -45px;
          width: 220px;
          background: var(--chart-2);
          color: var(--foreground);
          text-align: center;
          padding: 10px 0;
          font-size: 0.875rem;
          font-weight: 600;
          transform: rotate(45deg);
          box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
          line-height: 1.2;
          pointer-events: auto;
        }
        .ribbon::before {
          content: '';
          position: absolute;
          left: 0;
          bottom: -10px;
          width: 0;
          height: 0;
          border-style: solid;
          border-width: 10px 0 0 10px;
          border-color: rgba(0, 0, 0, 0.2) transparent transparent transparent;
        }
        .ribbon::after {
          content: '';
          position: absolute;
          right: 0;
          bottom: -10px;
          width: 0;
          height: 0;
          border-style: solid;
          border-width: 10px 10px 0 0;
          border-color: rgba(0, 0, 0, 0.2) transparent transparent transparent;
        }
        .pricing-card:hover .pricing-check {
          color: currentColor;
        }
        .pricing-card:hover .pricing-duration {
          color: currentColor;
        }
        .pricing-card.group:hover .pricing-duration {
          color: white;
        }
        .pricing-popular::before {
          content: 'POPULAR';
          position: absolute;
          top: 30px;
          right: -30px;
          transform: rotate(45deg);
          background-color: #FFBA53;
          color: var(--foreground);
          padding: 4px 40px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 1.5px;
          z-index: 1;
        }
      `}</style>
    );
};

export default LandingStyles;

